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
    from database import async_session
    async with async_session() as db:
        document = None
        try:
            print(f"📄 Processing Document #{doc_id}...")
            # 🚀 OPTIMIZATION: Extract text using threadpool (async-friendly)
            raw_text = await extract_text_from_file(file_path, file_ext)
            
            if not raw_text:
                print(f"❌ OCR failed to extract any text for Document #{doc_id}")
                document = await db.get(Document, doc_id)
                if document:
                    document.status = "Error"
                    document.extracted_data = {"error": "OCR failed to extract text. Please ensure the file is readable and not empty."}
                    await db.commit()
                return

            print(f"✅ OCR Done. Extracted {len(raw_text)} chars.")
            
            # Update status to indicate OCR is done and AI analysis is starting
            document = await db.get(Document, doc_id)
            if document:
                document.extracted_data = {"status": "Analyzing Content..."}
                await db.commit() 

            # 🚀 LLM Analysis (Async httpx call)
            structured_json = await process_invoice_with_llm(raw_text)

            document = await db.get(Document, doc_id)
            if not document:
                print(f"❌ Document #{doc_id} disappeared during processing!")
                return

            if "error" in structured_json:
                print(f"❌ AI Extraction failed for Document #{doc_id}: {structured_json['error']}")
                document.status = "Failed"
                document.extracted_data = structured_json
                await db.commit()
                return
            
            print(f"✅ AI Extraction successful for Document #{doc_id}")

            try:
                extracted_data = ExtractedInvoiceData(**structured_json)
            except Exception as e:
                print(f"❌ Validation error for Document #{doc_id}: {e}")
                document.status = "Failed Validation"
                document.extracted_data = {"error": f"AI response format invalid: {str(e)}", "raw": structured_json}
                await db.commit()
                return

            # 🚀 NEW SHIPMENT DETECTION & CREATION
            shipment = None
            if extracted_data.shipment_code:
                from sqlalchemy import select
                stmt = select(Shipment).where(Shipment.shipment_code == extracted_data.shipment_code)
                res = await db.execute(stmt)
                shipment = res.scalars().first()
            
            if not shipment:
                shipment = Shipment(
                    shipment_code=extracted_data.shipment_code or f"SHN-{uuid.uuid4().hex[:8].upper()}",
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
                await db.flush() 
            
            document.shipment_id = shipment.id
            
            # 1. HSN Classification
            print(f"🔍 [1/3] Classifying HSN for Document #{doc_id}...")
            if extracted_data.hsn_code and len(str(extracted_data.hsn_code)) >= 2:
                prediction = {
                    "hsn_code": str(extracted_data.hsn_code),
                    "confidence_score": 99.0,
                    "model_version": "AI-Extracted"
                }
            else:
                prediction = await predict_hsn_code(db, extracted_data.product_name)
            
            hsn_rec, _ = await save_hsn_classification(db, shipment.id, extracted_data.product_name, prediction, commit=False)

            # 2. Duty Calculation
            print(f"💰 [2/3] Calculating Duty for Document #{doc_id}...")
            breakdown = await calculate_duty_breakdown(db, shipment, prediction["hsn_code"])
            duty_rec = await save_duty_result(db, breakdown, commit=False)
            
            # 3. Risk Assessment
            print(f"🛡️ [3/3] Analyzing Risk for Document #{doc_id}...")
            risk_prediction = await assess_risk(db, shipment, hsn_rec, duty_rec)
            await save_risk_assessment(db, risk_prediction, commit=False)
            
            document.doc_type = structured_json.get("doc_type", "Other")
            document.extracted_data = {
                **structured_json,
                "hsn_result": prediction,
                "duty_result": breakdown,
                "risk_result": risk_prediction
            }
            document.status = "Completed"
            shipment.status = "Pending Review"
            
            # 🚀 FINAL SINGLE BATCH COMMIT
            await db.commit()
            print(f"🎉 SUCCESS: Document #{doc_id} fully processed and saved.")

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
            # 🚀 KEEPING THE FILE so user can download it later from the dashboard
            pass
            # if os.path.exists(file_path):
            #     try:
            #         os.remove(file_path)
            #     except:
            #         pass
