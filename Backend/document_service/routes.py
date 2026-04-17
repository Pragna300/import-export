from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import Document

from .schemas import DocumentResponse
from .service import background_process_invoice, save_upload_file

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload-invoice/", response_model=DocumentResponse)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    file_path, file_ext = save_upload_file(file)

    new_doc = Document(file_url=file.filename, status="Processing", doc_type="invoice")
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    background_tasks.add_task(
        background_process_invoice,
        file_path,
        file_ext,
        new_doc.id,
    )

    return DocumentResponse(
        id=new_doc.id,
        status=new_doc.status,
        message="Invoice uploaded and is processing in the background.",
        file_url=new_doc.file_url,
        shipment_id=new_doc.shipment_id,
        extracted_data=new_doc.extracted_data,
        created_at=new_doc.created_at,
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    document = await db.get(Document, doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document
