from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import RiskAssessment

from .schemas import RiskAssessRequest, RiskAssessmentResponse, RiskAssessmentResult
from .service import (
    assess_risk,
    get_or_fetch_duty,
    get_or_fetch_hsn,
    get_shipment,
    save_risk_assessment,
)

router = APIRouter(prefix="/risk", tags=["Risk"])


@router.post("/", response_model=RiskAssessmentResult)
async def calculate_risk(
    request: RiskAssessRequest,
    db: AsyncSession = Depends(get_db),
):
    shipment = await get_shipment(db, request.shipment_id)
    if shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")

    classification, hsn_error = await get_or_fetch_hsn(db, shipment)
    if hsn_error:
        raise HTTPException(status_code=502, detail=hsn_error)

    duty, duty_error = await get_or_fetch_duty(db, shipment)
    if duty_error:
        raise HTTPException(status_code=502, detail=duty_error)

    assessment = assess_risk(shipment, classification, duty)
    assessment_id = None
    if request.persist_result:
        saved = await save_risk_assessment(db, assessment)
        assessment_id = saved.id

    return RiskAssessmentResult(assessment_id=assessment_id, **assessment)


@router.get("/{shipment_id}", response_model=RiskAssessmentResponse)
async def get_risk(shipment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RiskAssessment).where(RiskAssessment.shipment_id == shipment_id)
    )
    assessment = result.scalars().first()
    if assessment is None:
        raise HTTPException(status_code=404, detail="Risk assessment not found")
    return assessment
