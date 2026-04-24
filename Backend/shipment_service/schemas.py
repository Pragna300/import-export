from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class ShipmentBase(BaseModel):
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[Any] = None
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
    total_value: Optional[Any] = None
    current_location: Optional[str] = None
    created_at: Optional[datetime] = None
    ai_insight: Optional[str] = None
    hsn_code: Optional[str] = None

class TrackingCreate(BaseModel):
    status: str
    location: str
    remarks: Optional[str] = None
