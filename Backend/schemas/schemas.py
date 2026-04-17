from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    message: Optional[str] = None
    file_url: Optional[str] = None
    shipment_id: Optional[int] = None
    extracted_data: Optional[Dict[str, Any]] = None
    created_at: Optional[Any] = None

class ExtractedInvoiceData(BaseModel):
    product_name: str
    quantity: int
    price: float
    country: str

class ShipmentCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None
    country: Optional[str] = None
    destination_country: Optional[str] = None
    status: Optional[str] = "Pending"
    currency: Optional[str] = "USD"
    description: Optional[str] = None

class ShipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    shipment_code: Optional[str] = None
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    total_value: Optional[float] = None
    origin_country: Optional[str] = None
    destination_country: Optional[str] = None
    status: Optional[str] = None
    current_location: Optional[str] = None
    description: Optional[str] = None
    currency: Optional[str] = None

class TrackingCreate(BaseModel):
    status: str
    location: str
    remarks: Optional[str] = None
