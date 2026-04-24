import json
import os
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
                    page_text = pdf.pages[0].extract_text()
                    if page_text:
                        text = page_text
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

async def process_invoice_with_llm(raw_text: str) -> dict:
    prompt = """
    Extract invoice data and return ONLY valid JSON.

    Format:
    {
      "shipment_code": "Extracted shipment ID or reference if found, else null",
      "product_name": "",
      "quantity": 0,
      "price": 0,
      "country": "",
      "destination_country": "",
      "currency": "USD",
      "description": ""
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
        "model": "google/gemini-flash-1.5:free",
        "messages": [{"role": "user", "content": prompt + "\n\n" + raw_text}],
        "max_tokens": 150, # Minimum tokens for basic JSON
        "temperature": 0.0,
    }

    try:
        print(f"🤖 Calling AI Intelligence Engine (Timeout: 10s)... Text Length: {len(raw_text)}")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    **headers,
                    "HTTP-Referer": "https://shnoor.ai",
                    "X-Title": "Shnoor AI"
                },
                json=payload,
                timeout=10, # Aggressive timeout
            )

        if response.status_code != 200:
            print(f"❌ AI Provider Error: {response.status_code} - {response.text}")
            return {"error": f"AI provider error: {response.status_code}"}

        result = response.json()
        if "choices" not in result or not result["choices"]:
             print(f"❌ AI Provider returned no choices: {result}")
             return {"error": "No response from AI"}

        content = result["choices"][0]["message"]["content"]
        print(f"✅ AI Response Received ({len(content)} chars)")
        clean_text = content.strip().replace("```json", "").replace("```", "")
        return json.loads(clean_text)
    except Exception as exc:
        print(f"❌ AI Extraction Exception: {str(exc)}")
        return {"error": str(exc)}
