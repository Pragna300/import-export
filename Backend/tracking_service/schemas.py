from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from shipment_service.schemas import ShipmentResponse

class TrackingHistoryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    location: str
    remarks: Optional[str] = None
    timestamp: datetime

class TrackingFullResponse(BaseModel):
    shipment: ShipmentResponse
    history: List[TrackingHistoryEntry]
    ai_insight: Optional[str] = None
