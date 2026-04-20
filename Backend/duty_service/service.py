from decimal import Decimal, ROUND_HALF_UP
import os

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import Duty, HSNClassification, Shipment

HSN_SERVICE_URL = os.getenv("HSN_SERVICE_URL", "http://127.0.0.1:8003")

COUNTRY_TAX_RULES = {
    "india": {"tax_rate": Decimal("18.00"), "other_charges": Decimal("250.00")},
    "usa": {"tax_rate": Decimal("7.50"), "other_charges": Decimal("175.00")},
    "germany": {"tax_rate": Decimal("19.00"), "other_charges": Decimal("220.00")},
    "uae": {"tax_rate": Decimal("5.00"), "other_charges": Decimal("150.00")},
}

HSN_DUTY_RULES = {
    "02": Decimal("5.00"),
    "26": Decimal("10.00"),
    "73": Decimal("12.50"),
    "84": Decimal("15.00"),
    "85": Decimal("18.00"),
}


def quantize_amount(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


async def get_shipment(db: AsyncSession, shipment_id: int):
    return await db.get(Shipment, shipment_id)


async def get_or_fetch_hsn(db: AsyncSession, shipment: Shipment):
    result = await db.execute(
        select(HSNClassification).where(HSNClassification.shipment_id == shipment.id)
    )
    classification = result.scalars().first()
    if classification is not None:
        return classification, None

    payload = {
        "product_name": shipment.product_name or "",
        "shipment_id": shipment.id,
        "persist_result": True,
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{HSN_SERVICE_URL}/hsn/",
                json=payload,
                timeout=20,
            )
        response.raise_for_status()
    except Exception as exc:
        return None, f"Unable to obtain HSN classification: {exc}"

    result = await db.execute(
        select(HSNClassification).where(HSNClassification.shipment_id == shipment.id)
    )
    classification = result.scalars().first()
    if classification is None:
        return None, "HSN classification was not stored for the shipment"
    return classification, None


async def calculate_duty_breakdown(db: AsyncSession, shipment: Shipment, hsn_code: str):
    from models.models import CountryTaxRule, HSNRateRule

    assessable_value = Decimal(str(shipment.total_value or 0))
    destination = (shipment.destination_country or "").strip().lower()
    hsn_prefix = str(hsn_code)[:2]

    # Query DB for Country Rules
    country_rule_res = await db.execute(select(CountryTaxRule).where(CountryTaxRule.country_code == destination))
    country_rule_db = country_rule_res.scalars().first()

    if country_rule_db:
        tax_rate = Decimal(str(country_rule_db.tax_rate))
        other_charges = Decimal(str(country_rule_db.other_charges))
    else:
        # Fallback to hardcoded if not in DB
        country_rule = COUNTRY_TAX_RULES.get(
            destination,
            {"tax_rate": Decimal("12.00"), "other_charges": Decimal("200.00")},
        )
        tax_rate = country_rule["tax_rate"]
        other_charges = country_rule["other_charges"]

    # Query DB for HSN Rules
    hsn_rule_res = await db.execute(select(HSNRateRule).where(HSNRateRule.hsn_prefix == hsn_prefix))
    hsn_rule_db = hsn_rule_res.scalars().first()

    if hsn_rule_db:
        duty_rate = Decimal(str(hsn_rule_db.duty_rate))
    else:
        # Fallback to hardcoded if not in DB
        duty_rate = HSN_DUTY_RULES.get(hsn_prefix, Decimal("8.00"))

    duty_amount = quantize_amount(assessable_value * duty_rate / Decimal("100"))
    tax_base = assessable_value + duty_amount
    tax_amount = quantize_amount(tax_base * tax_rate / Decimal("100"))
    total_cost = quantize_amount(assessable_value + duty_amount + tax_amount + other_charges)

    return {
        "shipment_id": shipment.id,
        "hsn_code": str(hsn_code),
        "currency": shipment.currency or "USD",
        "assessable_value": float(quantize_amount(assessable_value)),
        "duty_rate": float(duty_rate),
        "tax_rate": float(tax_rate),
        "duty_amount": float(duty_amount),
        "tax_amount": float(tax_amount),
        "other_charges": float(other_charges),
        "total_cost": float(total_cost),
        "rule_source": f"db-hsn:{hsn_prefix} db-destination:{destination or 'default'}",
    }


async def save_duty_result(db: AsyncSession, breakdown: dict):
    result = await db.execute(select(Duty).where(Duty.shipment_id == breakdown["shipment_id"]))
    duty = result.scalars().first()
    if duty is None:
        duty = Duty(
            shipment_id=breakdown["shipment_id"],
            hsn_code=breakdown["hsn_code"],
            duty_amount=breakdown["duty_amount"],
            tax_amount=breakdown["tax_amount"],
            other_charges=breakdown["other_charges"],
            total_cost=breakdown["total_cost"],
            currency=breakdown["currency"],
        )
        db.add(duty)
    else:
        duty.hsn_code = breakdown["hsn_code"]
        duty.duty_amount = breakdown["duty_amount"]
        duty.tax_amount = breakdown["tax_amount"]
        duty.other_charges = breakdown["other_charges"]
        duty.total_cost = breakdown["total_cost"]
        duty.currency = breakdown["currency"]

    await db.commit()
    await db.refresh(duty)
    return duty
