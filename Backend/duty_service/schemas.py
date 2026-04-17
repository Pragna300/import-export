from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DutyCalculateRequest(BaseModel):
    shipment_id: int
    persist_result: bool = True


class DutyBreakdownResponse(BaseModel):
    shipment_id: int
    hsn_code: str
    currency: str
    assessable_value: float
    duty_rate: float
    tax_rate: float
    duty_amount: float
    tax_amount: float
    other_charges: float
    total_cost: float
    rule_source: str
    duty_id: Optional[int] = None


class DutyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shipment_id: int
    hsn_code: str
    duty_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    other_charges: Optional[float] = None
    total_cost: Optional[float] = None
    currency: Optional[str] = None
    calculated_at: Optional[datetime] = None
