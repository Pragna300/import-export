from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from . import service
from .service import manager

from .schemas import TrackingFullResponse

router = APIRouter(prefix="/tracking", tags=["Live Tracking"])

@router.get("/{code}", response_model=TrackingFullResponse)
async def get_tracking(code: str, db: AsyncSession = Depends(get_db)):
    return await service.get_shipment_tracking(db, code)

@router.websocket("/ws")
async def tracking_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
