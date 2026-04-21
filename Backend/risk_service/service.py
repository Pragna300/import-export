import os

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import Duty, HSNClassification, RiskAssessment, Shipment

HSN_SERVICE_URL = os.getenv("HSN_SERVICE_URL", "http://127.0.0.1:8003")
DUTY_SERVICE_URL = os.getenv("DUTY_SERVICE_URL", "http://127.0.0.1:8004")

HIGH_RISK_COUNTRIES = {"afghanistan", "iran", "north korea", "syria"}
MEDIUM_RISK_COUNTRIES = {"russia", "myanmar", "iraq", "sudan"}
SENSITIVE_HSN_PREFIXES = {"93", "36", "28"}


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


async def get_or_fetch_duty(db: AsyncSession, shipment: Shipment):
    result = await db.execute(select(Duty).where(Duty.shipment_id == shipment.id))
    duty = result.scalars().first()
    if duty is not None:
        return duty, None

    payload = {"shipment_id": shipment.id, "persist_result": True}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DUTY_SERVICE_URL}/duty/",
                json=payload,
                timeout=25,
            )
        response.raise_for_status()
    except Exception as exc:
        return None, f"Unable to obtain duty calculation: {exc}"

    result = await db.execute(select(Duty).where(Duty.shipment_id == shipment.id))
    duty = result.scalars().first()
    if duty is None:
        return None, "Duty calculation was not stored for the shipment"
    return duty, None


async def assess_risk(db: AsyncSession, shipment: Shipment, classification: HSNClassification, duty: Duty):
    score = 0.0
    reasons = []

    destination = (shipment.destination_country or "").strip().lower()
    origin = (shipment.origin_country or "").strip().lower()
    hsn_prefix = str(classification.hsn_code or "")[:2]
    total_value = float(shipment.total_value or 0)
    duty_total = float(duty.total_cost or 0)
    duty_ratio = (duty_total / total_value) if total_value else 0

    from models.models import RiskRule
    
    # Check Country Risk Rules
    country_rules_stmt = select(RiskRule).where(
        RiskRule.entity_type == 'country',
        RiskRule.entity_value.in_([destination, origin])
    )
    country_rules_res = await db.execute(country_rules_stmt)
    country_rules = country_rules_res.scalars().all()
    
    for rule in country_rules:
        score += float(rule.score_impact)
        reasons.append(f"Shipment involves a {rule.risk_level.lower()}-risk country ({rule.entity_value})")
        
    # Check HSN Risk Rules
    hsn_rules_stmt = select(RiskRule).where(
        RiskRule.entity_type == 'hsn',
        RiskRule.entity_value == hsn_prefix
    )
    hsn_rules_res = await db.execute(hsn_rules_stmt)
    hsn_rules = hsn_rules_res.scalars().all()
    
    for rule in hsn_rules:
        score += float(rule.score_impact)
        reasons.append(f"HSN category ({hsn_prefix}) is flagged as {rule.risk_level.lower()} risk")

    # Fallback to defaults if rules table is empty (to maintain behavior until seeded)
    if not country_rules and not hsn_rules:
        HIGH_RISK_COUNTRIES = {"afghanistan", "iran", "north korea", "syria"}
        MEDIUM_RISK_COUNTRIES = {"russia", "myanmar", "iraq", "sudan"}
        SENSITIVE_HSN_PREFIXES = {"93", "36", "28"}
        
        if destination in HIGH_RISK_COUNTRIES or origin in HIGH_RISK_COUNTRIES:
            score += 45
            reasons.append("Shipment involves a high-risk country")
        elif destination in MEDIUM_RISK_COUNTRIES or origin in MEDIUM_RISK_COUNTRIES:
            score += 25
            reasons.append("Shipment involves a medium-risk country")

        if hsn_prefix in SENSITIVE_HSN_PREFIXES:
            score += 25
            reasons.append("HSN category is flagged as sensitive")

    # Hardcoded business logic for confidence, value, and duty ratio
    # These could also be moved to the database later
    if classification.confidence_score is not None and float(classification.confidence_score) < 5:
        score += 15
        reasons.append("HSN classification confidence is low")

    if total_value >= 100000:
        score += 20
        reasons.append("Shipment value is very high")
    elif total_value >= 25000:
        score += 10
        reasons.append("Shipment value is elevated")

    if duty_ratio >= 1.35:
        score += 15
        reasons.append("Total landed cost is unusually high relative to invoice value")
    elif duty_ratio >= 1.15:
        score += 8
        reasons.append("Duty and tax burden is above normal threshold")

    if not reasons:
        reasons.append("No major compliance or valuation signals detected")

    score = min(score, 100.0)
    if score >= 70:
        level = "High"
    elif score >= 35:
        level = "Medium"
    else:
        level = "Low"

    return {
        "shipment_id": shipment.id,
        "risk_score": round(score, 2),
        "risk_level": level,
        "reason": "; ".join(reasons),
        "model_version": "rule-engine-v2.0",
    }


async def save_risk_assessment(db: AsyncSession, assessment: dict):
    result = await db.execute(
        select(RiskAssessment).where(RiskAssessment.shipment_id == assessment["shipment_id"])
    )
    existing = result.scalars().first()
    if existing is None:
        existing = RiskAssessment(**assessment)
        db.add(existing)
    else:
        existing.risk_score = assessment["risk_score"]
        existing.risk_level = assessment["risk_level"]
        existing.reason = assessment["reason"]
        existing.model_version = assessment["model_version"]

    await db.commit()
    await db.refresh(existing)
    return existing
