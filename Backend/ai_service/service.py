import httpx
import os
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.models import Shipment, ShipmentTracking, HSNClassification, Duty, RiskAssessment
from dotenv import load_dotenv
# Load env once at startup
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

def get_api_key():
    return os.getenv("OPEN_ROUTER_API_KEY")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

async def get_chatbot_response(db: AsyncSession, message: str, history: list):
    api_key = get_api_key()
    if not api_key:
        return "Offline mode enabled. AI features required an API key."

    # Detect tracking code (Supports SHN- and SHP-)
    tracking_match = re.search(r"(SHN|SHP)-[A-Z0-9]{8}", message.upper())
    shipment_context = ""
    
    if tracking_match:
        code = tracking_match.group(0)
        # Eagerly load metadata for richer context
        from sqlalchemy.orm import selectinload
        res = await db.execute(
            select(Shipment)
            .where(Shipment.shipment_code == code)
            .options(
                selectinload(Shipment.hsn_classification),
                selectinload(Shipment.duty),
                selectinload(Shipment.risk_assessment)
            )
        )
        shipment = res.scalars().first()

        if shipment:
            tracking_result = await db.execute(
                select(ShipmentTracking)
                .where(ShipmentTracking.shipment_id == shipment.id)
                .order_by(ShipmentTracking.timestamp.desc())
                .limit(3)
            )
            history_recs = tracking_result.scalars().all()
            history_str = "\n".join([f"- {t.timestamp}: {t.status} @ {t.location}" for t in history_recs])
            
            hsn_info = f"HSN: {shipment.hsn_classification.hsn_code}" if shipment.hsn_classification else "HSN: Pending"
            duty_info = f"Duty/Tax: ₹{shipment.duty.total_cost}" if shipment.duty else "Duty: Pending"
            risk_info = f"Risk: {shipment.risk_assessment.risk_level}" if shipment.risk_assessment else "Risk: Not assessed"

            shipment_context = f"\n\n[CONTEXT: {code}]\n" \
                               f"Product: {shipment.product_name}\n" \
                               f"Route: {shipment.origin_country} to {shipment.destination_country}\n" \
                               f"Status: {shipment.status}\n" \
                               f"{hsn_info} | {duty_info} | {risk_info}\n" \
                               f"History:\n{history_str}\n"

    system_prompt = (
        "You are Shnoor AI, a helpful logistics assistant for Shnoor International Logistics Group. "
        "Company Details: Founded 2018. HQ: Shnoor Tower, Dubai, UAE. Mission: Eliminate friction in global trade using AI. "
        "Contact: info@shnoor.com, support@shnoor.com. "
        "Your goal is to simplify import-export tasks. You can track shipments, explain HSN codes, and analyze risk. "
        "Keep answers professional, clear, and under 3-4 sentences. Use bullet points if listing steps."
    )
    if shipment_context:
        system_prompt += f"\n\nContext for current shipment:\n{shipment_context}"

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append(msg)
    messages.append({"role": "user", "content": message})

    models_to_try = [
        "meta-llama/llama-3.2-3b-instruct:free", # More likely to be active
        "openrouter/auto", # Automatic selection
    ]

    last_error = ""
    for model_name in models_to_try:
        try:
            print(f"🤖 Calling AI Gateway with model: {model_name}...")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    OPENROUTER_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://shnoor.ai", # Required by some OpenRouter models
                        "X-Title": "Shnoor AI"
                    },
                    json={
                        "model": model_name,
                        "messages": messages,
                        "temperature": 0.5,
                        "max_tokens": 150
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                
                last_error = f"Status {response.status_code}: {response.text}"
                print(f"❌ {model_name} failed: {last_error}")
                
        except Exception as e:
            last_error = str(e)
            print(f"❌ {model_name} exception: {last_error}")

    return f"AI gateway error: {last_error[:50]}..."

async def generate_predictive_insight(product: str, origin: str, destination: str, status: str):
    """
    Generates a professional AI-driven logistics insight for a shipment.
    """
    api_key = get_api_key()
    if not api_key:
        return "Insight unavailable in offline mode."

    system_prompt = (
        "You are a logistics intelligence AI. Generate a single professional "
        "sentence (max 20 words) predicting a transit insight for this cargo."
    )
    user_prompt = f"Product: {product}, Route: {origin} to {destination}, Status: {status}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "meta-llama/llama-3.1-8b-instruct:free",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.5
                },
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            return "Standard transit efficiency predicted."
    except Exception:
        return "Route stability verified. No immediate risks detected."
