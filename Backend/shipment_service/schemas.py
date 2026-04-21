from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ShipmentBase(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    origin_country: Optional[str] = None
    destination_country: Optional[str] = None
    currency: Optional[str] = "INR"
    description: Optional[str] = ""

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentResponse(ShipmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    shipment_code: Optional[str] = None
    status: Optional[str] = None
    total_value: Optional[float] = None
    current_location: Optional[str] = None
    created_at: Optional[datetime] = None
    ai_insight: Optional[str] = None

class TrackingCreate(BaseModel):
    status: str
    location: str
    remarks: Optional[str] = None
