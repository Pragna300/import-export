from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.models import Shipment, HSNClassification
try:
    import torch
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

from .model import HSNClassifierCNN
from .preprocessing import tokenize_and_pad

model = None
word2idx = {"<pad>": 0, "<unk>": 1}
idx2hsn = {i: str(i).zfill(2) + "0000" for i in range(1, 100)}


def load_hsn_model():
    global model
    if not TORCH_AVAILABLE:
        print("⚠️ PyTorch not found. Using fallback HSN logic.")
        return
        
    try:
        vocab_size = 20000
        model = HSNClassifierCNN(vocab_size=vocab_size, embed_dim=300, num_classes=99)
        model.eval()
    except Exception as e:
        print(f"⚠️ Error loading HSN model: {e}")
        model = None


from starlette.concurrency import run_in_threadpool

async def predict_hsn_code(db: AsyncSession, product_name: str) -> dict:
    if model is None:
        load_hsn_model()

    # 1. Database-first lookup (Check if we have an exact or close match in HSN Master)
    from models.models import HSNMaster
    stmt = select(HSNMaster).where(HSNMaster.description.ilike(f"%{product_name}%")).limit(1)
    res = await db.execute(stmt)
    master_rec = res.scalars().first()
    
    if master_rec:
        return {
            "hsn_code": master_rec.hsn_code,
            "confidence_score": 95.0,
            "model_version": "HSN-Master-Lookup",
        }

    # 2. ML Fallback (Try LLM first if Torch is missing, then sync local model)
    if not TORCH_AVAILABLE or model is None:
        from .llm_fallback import call_llm_for_hsn
        return await call_llm_for_hsn(product_name)

    return await run_in_threadpool(_sync_ml_predict, product_name)

def _sync_ml_predict(product_name: str) -> dict:
    if model is None:
        return {
            "hsn_code": "847130", 
            "confidence_score": 50.0,
            "model_version": "Fallback-Static",
        }
    
    try:
        tensor_input = tokenize_and_pad(product_name, word2idx)
        with torch.no_grad():
            logits = model(tensor_input)
            probabilities = F.softmax(logits, dim=1)
            confidence_score, predicted_idx = torch.max(probabilities, dim=1)

        return {
            "hsn_code": idx2hsn.get(predicted_idx.item(), "841400"), 
            "confidence_score": round(confidence_score.item() * 100, 2),
            "model_version": "CNN-v1.0",
        }
    except Exception as e:
        print(f"⚠️ ML Prediction Error: {e}")
        return {
            "hsn_code": "841400",
            "confidence_score": 10.0,
            "model_version": "Error-Fallback",
        }


async def save_hsn_classification(
    db: AsyncSession,
    shipment_id: int,
    product_name: str,
    prediction: dict,
    commit: bool = True
):
    shipment = await db.get(Shipment, shipment_id)
    if shipment is None:
        return None, "Shipment not found"

    # Update the main shipment record with the predicted HSN code for direct access.
    shipment.hsn_code = str(prediction["hsn_code"])

    result = await db.execute(
        select(HSNClassification).where(HSNClassification.shipment_id == shipment_id)
    )
    existing = result.scalars().first()
    if existing:
        existing.product_name = product_name
        existing.hsn_code = str(prediction["hsn_code"])
        existing.confidence_score = prediction["confidence_score"]
        existing.model_version = prediction["model_version"]
        if commit:
            await db.commit()
            await db.refresh(existing)
        return existing, None

    classification = HSNClassification(
        shipment_id=shipment_id,
        product_name=product_name,
        hsn_code=str(prediction["hsn_code"]),
        confidence_score=prediction["confidence_score"],
        model_version=prediction["model_version"],
    )
    db.add(classification)
    if commit:
        await db.commit()
        await db.refresh(classification)
    return classification, None
