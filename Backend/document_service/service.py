import os
import shutil
import uuid
from pathlib import Path

import httpx
from pydantic import ValidationError

from database import async_session
from models.models import Document, Shipment

from .ocr import extract_text_from_file, process_invoice_with_llm
from .schemas import ExtractedInvoiceData

# Direct imports from other services to avoid network overhead
from hsn_service.service import predict_hsn_code, save_hsn_classification
from duty_service.service import calculate_duty_breakdown, save_duty_result
from risk_service.service import assess_risk, save_risk_assessment

# Pointing to the unified gateway port for inter-service communication
# In local dev it's localhost:8000. In production it's the Render service URL.
PORT = os.getenv("PORT", "8000")
GATEWAY_URL = os.getenv("GATEWAY_URL", f"http://127.0.0.1:{PORT}").rstrip("/")

# Directory for temporary document storage
UPLOAD_DIR = Path("document_uploads")


def save_upload_file(upload_file) -> tuple[str, str]:
    UPLOAD_DIR.mkdir(exist_ok=True)
    file_ext = Path(upload_file.filename).suffix.lower()
    temp_name = f"{uuid.uuid4().hex}_{upload_file.filename}"
    temp_path = UPLOAD_DIR / temp_name

    with temp_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return str(temp_path), file_ext


async def call_internal_service(endpoint: str, payload: dict) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GATEWAY_URL}{endpoint}",
                json=payload,
                timeout=30,
            )
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"error": f"Service call to {endpoint} failed: {exc}"}


async def background_process_invoice(file_path: str, file_ext: str, doc_id: int):
    db = async_session()
    document = None

    try:
        raw_text = extract_text_from_file(file_path, file_ext)
        structured_json = await process_invoice_with_llm(raw_text)

        document = await db.get(Document, doc_id)
        if not document:
            return

        document.extracted_data = structured_json

        if "error" in structured_json:
            document.status = "Failed"
            await db.commit()
            return

        extracted_data = ExtractedInvoiceData(**structured_json)
        shipment = Shipment(
            shipment_code=f"SHP-{uuid.uuid4().hex[:8].upper()}",
            product_name=extracted_data.product_name,
            quantity=extracted_data.quantity,
            unit_price=extracted_data.price,
            total_value=extracted_data.quantity * extracted_data.price,
            origin_country=extracted_data.country,
            destination_country=extracted_data.destination_country,
            description=extracted_data.description,
            currency=extracted_data.currency,
            status="Processing",
        )

        db.add(shipment)
        document.shipment_id = shipment.id
        await db.commit()
        await db.refresh(shipment)
        await db.refresh(document)

        # 1. HSN Classification (Direct Call)
        prediction = await predict_hsn_code(db, extracted_data.product_name)
        hsn_record, _ = await save_hsn_classification(db, shipment.id, extracted_data.product_name, prediction)
        
        document.extracted_data = {**document.extracted_data, "hsn_result": prediction}
        await db.commit()
        await db.refresh(document)

        # 2. Duty Calculation (Direct Call)
        breakdown = await calculate_duty_breakdown(db, shipment, hsn_record.hsn_code)
        duty_record = await save_duty_result(db, breakdown)
        
        document.extracted_data = {**document.extracted_data, "duty_result": breakdown}
        await db.commit()
        await db.refresh(document)

        # 3. Risk Assessment (Direct Call)
        risk_prediction = await assess_risk(db, shipment, hsn_record, duty_record)
        await save_risk_assessment(db, risk_prediction)
        
        document.extracted_data = {**document.extracted_data, "risk_result": risk_prediction}
        document.status = "Completed"
        
        # Mark shipment as fully processed
        shipment.status = "Pending Review"
        await db.commit()

    except ValidationError as exc:
        if document is not None:
            document.status = "Failed Validation"
            document.extracted_data = {"error": "Invalid OCR payload", "detail": str(exc)}
            await db.commit()
    except Exception as exc:
        if document is not None:
            document.status = "Error"
            document.extracted_data = {"error": str(exc)}
            await db.commit()
        else:
            await db.rollback()
    finally:
        await db.close()
        if os.path.exists(file_path):
            os.remove(file_path)
