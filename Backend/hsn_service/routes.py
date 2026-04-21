from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import HSNClassification

from .schemas import (
    HSNClassificationResponse,
    HSNPredictionResponse,
    HSNPredictRequest,
)
from .service import predict_hsn_code, save_hsn_classification

router = APIRouter(prefix="/hsn", tags=["HSN"])


@router.post("/", response_model=HSNPredictionResponse)
async def classify_hsn(
    request: HSNPredictRequest,
    db: AsyncSession = Depends(get_db),
):
    prediction = await predict_hsn_code(db, request.product_name)
    classification_id = None

    if request.persist_result:
        if request.shipment_id is None:
            raise HTTPException(
                status_code=400,
                detail="shipment_id is required when persist_result is true",
            )
        classification, error = await save_hsn_classification(
            db,
            request.shipment_id,
            request.product_name,
            prediction,
        )
        if error:
            raise HTTPException(status_code=404, detail=error)
        classification_id = classification.id

    return HSNPredictionResponse(
        shipment_id=request.shipment_id,
        classification_id=classification_id,
        **prediction,
    )


@router.get("/{shipment_id}", response_model=HSNClassificationResponse)
async def get_hsn_result(shipment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(HSNClassification).where(HSNClassification.shipment_id == shipment_id)
    )
    classification = result.scalars().first()
    if classification is None:
        raise HTTPException(status_code=404, detail="HSN classification not found")
    return classification
