from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RiskAssessRequest(BaseModel):
    shipment_id: int
    persist_result: bool = True


class RiskAssessmentResult(BaseModel):
    shipment_id: int
    risk_score: float
    risk_level: str
    reason: str
    model_version: str
    assessment_id: Optional[int] = None


class RiskAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    risk_score: Optional[float] = None
    risk_level: str
    reason: Optional[str] = None
    model_version: Optional[str] = None
    created_at: Optional[datetime] = None
