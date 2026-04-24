import os
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import Document

from .schemas import DocumentResponse
from .service import background_process_invoice, save_upload_file

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse)
@router.post("/upload-invoice/", response_model=DocumentResponse)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    shipment_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    file_path, file_ext = save_upload_file(file)

    new_doc = Document(
        file_url=file_path, # Store the actual path for retrieval
        status="Processing", 
        doc_type="invoice",
        shipment_id=shipment_id
    )
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
        file_url=file.filename, # Show display name in response
        shipment_id=new_doc.shipment_id,
        extracted_data=new_doc.extracted_data,
        created_at=new_doc.created_at,
    )


@router.get("/download/{doc_id}")
async def download_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    from fastapi.responses import FileResponse
    document = await db.get(Document, doc_id)
    if not document or not document.file_url:
        raise HTTPException(status_code=404, detail="File not found")
    
    # In this app, file_url stores the internal path
    if not os.path.exists(document.file_url):
         # If file was deleted after processing (as in current service.py logic)
         # We need to change service.py to KEEP the file if we want downloads.
         raise HTTPException(status_code=404, detail="Physical file no longer exists")
         
    return FileResponse(document.file_url, filename=os.path.basename(document.file_url))


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    result = await db.execute(select(Document).offset(skip).limit(limit).order_by(Document.created_at.desc()))
    return result.scalars().all()


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    document = await db.get(Document, doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{doc_id}")
async def delete_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a document record asynchronously"""
    document = await db.get(Document, doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await db.delete(document)
    await db.commit()
    return {"message": "Document deleted successfully"}
