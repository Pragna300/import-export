from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import async_session, get_db
from models.models import Document, Shipment, HSNClassification
from schemas.schemas import DocumentResponse, ShipmentCreate
from services.ocr_service import extract_text_from_file, process_invoice_with_llm
from services.hsn_service import predict_hsn_code
from pydantic import ValidationError
import shutil
import os
import uuid

router = APIRouter(prefix="/documents", tags=["Documents"])


from database import async_session

async def background_process_invoice(file_path: str, file_ext: str, doc_id: int):
    db = async_session()

    try:
        raw_text = extract_text_from_file(file_path, file_ext)
        structured_json = await process_invoice_with_llm(raw_text)

        doc = await db.get(Document, doc_id)

        if not doc:
            return

        doc.extracted_data = structured_json

        if "error" in structured_json:
            doc.status = "Failed"
        else:
            try:
                validated_data = ShipmentCreate(**structured_json)
                doc.status = "Completed"

                new_shipment = Shipment(
                    shipment_code=f"SHP-{uuid.uuid4().hex[:8].upper()}",
                    product_name=validated_data.product_name,
                    quantity=validated_data.quantity,
                    unit_price=validated_data.price,
                    total_value=(validated_data.quantity * validated_data.price) if validated_data.quantity and validated_data.price else 0,
                    origin_country=validated_data.country,
                    destination_country=validated_data.destination_country,
                    description=validated_data.description,
                    currency=validated_data.currency,
                    status="Pending"
                )

                db.add(new_shipment)
                await db.commit()
                await db.refresh(new_shipment)

                doc.shipment_id = new_shipment.id

                # HSN native integration
                hsn_prediction = await predict_hsn_code(new_shipment.product_name)
                hsn_classification = HSNClassification(
                    shipment_id=new_shipment.id,
                    product_name=new_shipment.product_name,
                    hsn_code=str(hsn_prediction.get("hsn_code")),
                    confidence_score=hsn_prediction.get("confidence_score"),
                    model_version=hsn_prediction.get("model_version")
                )
                db.add(hsn_classification)
            except ValidationError as ve:
                print("Validation Error:", ve)
                doc.status = "Failed Validation"

        await db.commit()

    except Exception as e:
        print("BACKGROUND ERROR:", e)
        try:
            doc.status = "Error"
            await db.commit()
        except:
            await db.rollback()

    finally:
        await db.close()

        if os.path.exists(file_path):
            os.remove(file_path)


# ✅ Upload API
@router.post("/upload-invoice/", response_model=DocumentResponse)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Save file temporarily
    file_ext = os.path.splitext(file.filename)[1].lower()
    temp_path = f"temp_{file.filename}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create document record
    new_doc = Document(file_url=file.filename, status="Processing")
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    # Run background task
    background_tasks.add_task(
        background_process_invoice,
        temp_path,
        file_ext,
        new_doc.id
    )

    return {
        "id": new_doc.id,
        "status": "Processing",
        "message": "Invoice uploaded and is processing in the background."
    }



@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, doc_id)

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return doc