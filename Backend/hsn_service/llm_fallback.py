import os
import json
import re
import httpx
from dotenv import load_dotenv

async def call_llm_for_hsn(product_name: str) -> dict:
    """Fallback LLM call for HSN classification when local ML model is unavailable."""
    prompt = f"""
    Classify the following product into an HSN (Harmonized System) code.
    Product: {product_name}
    
    CRITICAL: Provide a 6-digit HSN code and a confidence score.
    Return ONLY valid JSON:
    {{
      "hsn_code": "XXXXXX",
      "confidence_score": 90.0,
      "reason": "Short explanation"
    }}
    """

    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(env_path)
    api_key = os.getenv("OPEN_ROUTER_API_KEY")
    
    if not api_key:
        return {
            "hsn_code": "847130",
            "confidence_score": 50.0,
            "model_version": "LLM-Fallback-Missing-Key"
        }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://shnoor.ai",
                    "X-Title": "Shnoor HSN Engine"
                },
                json={
                    "model": "google/gemini-2.0-flash-001", # High speed / low cost
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 100,
                    "temperature": 0.0,
                },
                timeout=10,
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                json_match = re.search(r'(\{.*\})', content, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(1))
                    return {
                        "hsn_code": str(data.get("hsn_code", "847130")),
                        "confidence_score": float(data.get("confidence_score", 85.0)),
                        "model_version": "LLM-Gemini-v2"
                    }
    except Exception as e:
        print(f"⚠️ HSN LLM Fallback Error: {e}")
    
    return {
        "hsn_code": "847130",
        "confidence_score": 40.0,
        "model_version": "LLM-Fallback-Error"
    }
