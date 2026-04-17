from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.models import Duty

from .schemas import DutyBreakdownResponse, DutyCalculateRequest, DutyResponse
from .service import (
    calculate_duty_breakdown,
    get_or_fetch_hsn,
    get_shipment,
    save_duty_result,
)

router = APIRouter(prefix="/duty", tags=["Duty"])


@router.post("/", response_model=DutyBreakdownResponse)
async def calculate_duty(
    request: DutyCalculateRequest,
    db: AsyncSession = Depends(get_db),
):
    shipment = await get_shipment(db, request.shipment_id)
    if shipment is None:
        raise HTTPException(status_code=404, detail="Shipment not found")

    classification, error = await get_or_fetch_hsn(db, shipment)
    if error:
        raise HTTPException(status_code=502, detail=error)

    breakdown = calculate_duty_breakdown(shipment, classification.hsn_code)
    if request.persist_result:
        duty = await save_duty_result(db, breakdown)
        breakdown["duty_id"] = duty.id

    return DutyBreakdownResponse(**breakdown)


@router.get("/{shipment_id}", response_model=DutyResponse)
async def get_duty(shipment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Duty).where(Duty.shipment_id == shipment_id))
    duty = result.scalars().first()
    if duty is None:
        raise HTTPException(status_code=404, detail="Duty record not found")
    return duty
