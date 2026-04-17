from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import torch
import torch.nn.functional as F

from models.models import HSNClassification, Shipment

from .model import HSNClassifierCNN
from .preprocessing import tokenize_and_pad

model = None
word2idx = {}
idx2hsn = {}


def load_hsn_model():
    global model, word2idx, idx2hsn
    vocab_size = 20000
    model = HSNClassifierCNN(vocab_size=vocab_size, embed_dim=300, num_classes=99)
    model.eval()
    word2idx = {"dummy": 1}
    idx2hsn = {i: str(i).zfill(2) for i in range(99)}


async def predict_hsn_code(product_name: str) -> dict:
    if model is None:
        load_hsn_model()

    tensor_input = tokenize_and_pad(product_name, word2idx)
    with torch.no_grad():
        logits = model(tensor_input)
        probabilities = F.softmax(logits, dim=1)
        confidence_score, predicted_idx = torch.max(probabilities, dim=1)

    return {
        "hsn_code": idx2hsn.get(predicted_idx.item(), "Unknown"),
        "confidence_score": round(confidence_score.item() * 100, 2),
        "model_version": "CNN-v1.0",
    }


async def save_hsn_classification(
    db: AsyncSession,
    shipment_id: int,
    product_name: str,
    prediction: dict,
):
    shipment = await db.get(Shipment, shipment_id)
    if shipment is None:
        return None, "Shipment not found"

    result = await db.execute(
        select(HSNClassification).where(HSNClassification.shipment_id == shipment_id)
    )
    existing = result.scalars().first()
    if existing:
        existing.product_name = product_name
        existing.hsn_code = str(prediction["hsn_code"])
        existing.confidence_score = prediction["confidence_score"]
        existing.model_version = prediction["model_version"]
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
    await db.commit()
    await db.refresh(classification)
    return classification, None
