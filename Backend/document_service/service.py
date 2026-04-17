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

UPLOAD_DIR = Path("document_uploads")
HSN_SERVICE_URL = os.getenv("HSN_SERVICE_URL", "http://127.0.0.1:8003")


def save_upload_file(upload_file) -> tuple[str, str]:
    UPLOAD_DIR.mkdir(exist_ok=True)
    file_ext = Path(upload_file.filename).suffix.lower()
    temp_name = f"{uuid.uuid4().hex}_{upload_file.filename}"
    temp_path = UPLOAD_DIR / temp_name

    with temp_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return str(temp_path), file_ext


async def classify_shipment_with_hsn(shipment_id: int, product_name: str) -> dict:
    payload = {
        "product_name": product_name,
        "shipment_id": shipment_id,
        "persist_result": True,
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{HSN_SERVICE_URL}/hsn/",
                json=payload,
                timeout=30,
            )
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        return {"error": f"HSN service call failed: {exc}"}


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
            status="Pending",
        )

        db.add(shipment)
        await db.commit()
        await db.refresh(shipment)

        hsn_result = await classify_shipment_with_hsn(
            shipment_id=shipment.id,
            product_name=extracted_data.product_name,
        )

        document.shipment_id = shipment.id
        document.status = "Completed"
        document.extracted_data = {
            **structured_json,
            "hsn_result": hsn_result,
        }
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
