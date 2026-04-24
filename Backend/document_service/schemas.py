from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict


class ExtractedInvoiceData(BaseModel):
    doc_type: Optional[str] = "Other"
    shipment_code: Optional[str] = None
    product_name: Optional[str] = "Unknown Product"
    hsn_code: Optional[str] = None
    quantity: Optional[int] = 0
    price: Optional[float] = 0.0
    country: Optional[str] = "Unknown"
    destination_country: Optional[str] = None
    currency: Optional[str] = "USD"
    description: Optional[str] = None


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    message: Optional[str] = None
    file_url: Optional[str] = None
    shipment_id: Optional[int] = None
    extracted_data: Optional[Dict[str, Any]] = None
    created_at: Optional[Any] = None
