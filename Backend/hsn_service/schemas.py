from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class HSNPredictRequest(BaseModel):
    product_name: str
    shipment_id: Optional[int] = None
    persist_result: bool = False


class HSNPredictionResponse(BaseModel):
    hsn_code: str
    confidence_score: float
    model_version: str
    shipment_id: Optional[int] = None
    classification_id: Optional[int] = None


class HSNClassificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    product_name: str
    hsn_code: str
    confidence_score: Optional[float] = None
    model_version: Optional[str] = None
    created_at: Optional[datetime] = None
