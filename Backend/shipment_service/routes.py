from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
import httpx
import os

from database import get_db
from . import service
from .schemas import ShipmentResponse, TrackingCreate, ShipmentCreate
from tracking_service.service import manager

HSN_SERVICE_URL = os.getenv("HSN_SERVICE_URL", "http://127.0.0.1:8003")
DUTY_SERVICE_URL = os.getenv("DUTY_SERVICE_URL", "http://127.0.0.1:8004")
RISK_SERVICE_URL = os.getenv("RISK_SERVICE_URL", "http://127.0.0.1:8005")

router = APIRouter(prefix="/shipments", tags=["Shipments"])

async def trigger_ai_pipeline(shipment_id: int, product_name: str):
    async with httpx.AsyncClient() as client:
        # 1. HSN
        await client.post(f"{HSN_SERVICE_URL}/hsn/", json={
            "product_name": product_name, "shipment_id": shipment_id, "persist_result": True
        })
        # 2. Duty
        await client.post(f"{DUTY_SERVICE_URL}/duty/", json={
            "shipment_id": shipment_id, "persist_result": True
        })
        # 3. Risk
        await client.post(f"{RISK_SERVICE_URL}/risk/assess/", json={
            "shipment_id": shipment_id, "persist_result": True
        })

@router.post("/", response_model=ShipmentResponse)
async def create_shipment(
    payload: ShipmentCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    shipment = await service.create_shipment(db, payload)
    background_tasks.add_task(trigger_ai_pipeline, shipment.id, shipment.product_name)
    return shipment

@router.get("/", response_model=List[ShipmentResponse])
async def get_all_shipments(
    skip: int = 0, 
    limit: int = 50, 
    search: str = None, 
    db: AsyncSession = Depends(get_db)
):
    return await service.get_all_shipments(db, skip=skip, limit=limit, search=search)

@router.get("/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(shipment_id: int, db: AsyncSession = Depends(get_db)):
    shipment = await service.get_shipment_by_id(db, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@router.post("/{shipment_id}/tracking")
async def add_tracking(shipment_id: int, tracking: TrackingCreate, db: AsyncSession = Depends(get_db)):
    return await service.create_shipment_tracking(
        db, shipment_id, tracking.status, tracking.location, tracking.remarks
    )

# WebSocket support for live tracking
@router.websocket("/ws/tracking")
async def tracking_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
