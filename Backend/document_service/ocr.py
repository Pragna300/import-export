import asyncio
import json
import os
import re
from dotenv import load_dotenv

import httpx
import pdfplumber
import pytesseract

from PIL import Image


from starlette.concurrency import run_in_threadpool

async def extract_text_from_file(file_path: str, file_extension: str) -> str:
    """Async wrapper for text extraction to prevent blocking the event loop."""
    return await run_in_threadpool(_sync_extract_text_from_file, file_path, file_extension)

def _sync_extract_text_from_file(file_path: str, file_extension: str) -> str:
    text = ""
    try:
        if file_extension == ".pdf":
            with pdfplumber.open(file_path) as pdf:
                # 🚀 AGGRESSIVE SPEED OPTIMIZATION: Process only the FIRST page
                if pdf.pages:
                    text = pdf.pages[0].extract_text() or ""
                    
                    # 🚀 FALLBACK: If first page text is empty, try OCR (scanned PDF)
                    if len(text.strip()) < 20:
                        print(f"📄 PDF text extraction empty. Trying OCR on page 1...")
                        try:
                            from pdf2image import convert_from_path
                            images = convert_from_path(file_path, first_page=1, last_page=1)
                            if images:
                                text = pytesseract.image_to_string(images[0])
                        except Exception as ocr_err:
                            print(f"⚠️ PDF-OCR Fallback failed: {ocr_err}")
        elif file_extension in [".jpg", ".jpeg", ".png"]:
            image = Image.open(file_path)
            # 🚀 SPEED OPTIMIZATION: Resize large images
            if image.width > 2000 or image.height > 2000:
                image.thumbnail((1500, 1500))
            image = image.convert("L")
            text = pytesseract.image_to_string(image)
    except Exception as e:
        print(f"❌ OCR Error: {e}")
        return ""

    return text.strip()

# Configure Tesseract path only if on Windows and default fails
if os.name == 'nt':
    # Try common Windows path
    win_tess = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if os.path.exists(win_tess):
        pytesseract.pytesseract.tesseract_cmd = win_tess
    else:
        print("⚠️ WARNING: Tesseract OCR not found at default Windows path. Image processing may fail.")
else:
    # On Linux/Deployment, we check if tesseract is in PATH
    import shutil
    if not shutil.which("tesseract"):
        print("⚠️ WARNING: Tesseract binary not found in PATH. Image processing may fail.")

async def process_invoice_with_llm(raw_text: str) -> dict:
    prompt = """
    Analyze the following shipping document and extract data into valid JSON.
    CRITICAL: Identify the 'doc_type' as one of: [Invoice, Bill of Lading, Packing List, Certificate, Other].
    
    JSON Format:
    {
      "doc_type": "Invoice | Bill of Lading | Packing List | etc",
      "shipment_code": "Reference number or ID",
      "product_name": "Primary product name",
      "hsn_code": "Extract HSN/Harmonized code if visible",
      "quantity": 0,
      "price": 0,
      "country": "Origin country",
      "destination_country": "Destination country",
      "currency": "USD/EUR/INR",
      "description": "Short summary of items"
    }
    """

    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(env_path)
    openrouter_api_key = os.getenv("OPEN_ROUTER_API_KEY")
    if not openrouter_api_key:
        return {"error": "Missing OPEN_ROUTER_API_KEY in environment variables"}

    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "messages": [{"role": "user", "content": prompt + "\n\n" + raw_text}],
        "max_tokens": 150, 
        "temperature": 0.0,
    }
    models_to_try = [
        "openrouter/auto",
        "google/gemini-2.0-flash-001",
        "meta-llama/llama-3.1-8b-instruct:free"
    ]

    retries_per_model = 1
    for model_name in models_to_try:
        for attempt in range(retries_per_model + 1):
            try:
                print(f"🤖 Calling AI ({model_name}) - Attempt {attempt+1}... Text Length: {len(raw_text)}")
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            **headers,
                            "HTTP-Referer": "https://shnoor.ai",
                            "X-Title": "Shnoor AI"
                        },
                        json={
                            **payload,
                            "model": model_name
                        },
                        timeout=15, 
                    )

                if response.status_code != 200:
                    print(f"❌ AI Provider Error ({model_name}): {response.status_code} - {response.text}")
                    break # Try next model
                
                result = response.json()
                if "choices" not in result or not result["choices"]:
                     print(f"❌ AI Provider ({model_name}) returned no choices.")
                     break # Try next model

                content = result["choices"][0]["message"]["content"]
                print(f"✅ AI Response Received from {model_name} ({len(content)} chars)")
                
                json_match = re.search(r'(\{.*\}|\[.*\])', content, re.DOTALL)
                clean_text = json_match.group(1) if json_match else content.strip().replace("```json", "").replace("```", "")
                    
                try:
                    return json.loads(clean_text)
                except json.JSONDecodeError:
                    print(f"❌ JSON Decode Error from {model_name}")
                    if attempt < retries_per_model: continue
                    break # Try next model
            except Exception as exc:
                print(f"❌ Exception for {model_name}: {str(exc)}")
                if attempt < retries_per_model: 
                    await asyncio.sleep(1)
                    continue
                break # Try next model
        
        # 🚀 COOL-DOWN: Wait 1 second before trying a different model
        await asyncio.sleep(1)
    
    return {"error": "AI extraction failed after trying multiple models"}
