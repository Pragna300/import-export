from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database import get_db
from models.models import Shipment, ShipmentTracking
from schemas.schemas import TrackingCreate, ShipmentCreate, ShipmentResponse

router = APIRouter(prefix="/shipments", tags=["Shipments"])


@router.get("/", response_model=List[ShipmentResponse])
async def get_all_shipments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Shipment).order_by(Shipment.created_at.desc()))
    shipments = result.scalars().all()
    return shipments


@router.get("/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(shipment_id: int, db: AsyncSession = Depends(get_db)):
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.put("/{shipment_id}/status", response_model=ShipmentResponse)
async def update_shipment_status(shipment_id: int, status: str, current_location: str = None, db: AsyncSession = Depends(get_db)):
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    shipment.status = status
    if current_location:
        shipment.current_location = current_location
        
    await db.commit()
    await db.refresh(shipment)
    return shipment


@router.post("/{shipment_id}/tracking")
async def add_tracking_remark(shipment_id: int, tracking: TrackingCreate, db: AsyncSession = Depends(get_db)):
    shipment = await db.get(Shipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    new_tracking = ShipmentTracking(
        shipment_id=shipment.id,
        status=tracking.status,
        location=tracking.location,
        remarks=tracking.remarks
    )
    
    # Also update the shipment's main status and location for convenience
    shipment.status = tracking.status
    shipment.current_location = tracking.location
    
    db.add(new_tracking)
    await db.commit()
    await db.refresh(new_tracking)
    
    return {"message": "Tracking updated successfully", "tracking_id": new_tracking.id}
