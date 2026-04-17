from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.websocket_service import manager

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/tracking")
async def tracking_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We keep the connection open and wait for incoming messages if any
            # though the main purpose is to push updates to the client
            data = await websocket.receive_text()
            # client can send ping or subscribe messages here if extended
    except WebSocketDisconnect:
        manager.disconnect(websocket)
