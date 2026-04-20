import os
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, func
from models.models import Shipment, ShipmentTracking
from .schemas import ShipmentBase, ShipmentCreate
import uuid

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8006")

async def get_ai_insight(product: str, origin: str, destination: str, status: str):
    """Call the AI service via HTTP instead of direct import."""
    try:
        async with httpx.AsyncClient() as client:
            # We assume ai_service will eventually have a specialized insight endpoint, 
            # or we can use a generic completion. For now, let's assume it has /ai/predictive-insight
            response = await client.post(
                f"{AI_SERVICE_URL}/ai/predictive-insight",
                json={
                    "product": product,
                    "origin": origin,
                    "destination": destination,
                    "status": status
                },
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json().get("insight", "Route stability verified.")
    except Exception:
        pass
    return "AI analysis unavailable. Standard transit times apply."

async def create_shipment(db: AsyncSession, payload: ShipmentCreate):
    new_shipment = Shipment(
        shipment_code=f"SHP-{uuid.uuid4().hex[:8].upper()}",
        product_name=payload.product_name,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        total_value=payload.quantity * payload.unit_price,
        origin_country=payload.origin_country,
        destination_country=payload.destination_country,
        currency=payload.currency,
        description=payload.description,
        status="Pending Analysis"
    )
    db.add(new_shipment)
    await db.commit()
    await db.refresh(new_shipment)
    return new_shipment

async def get_all_shipments(db: AsyncSession, skip: int = 0, limit: int = 50, search: str = None):
    query = select(Shipment)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Shipment.shipment_code.ilike(search_filter)) | 
            (Shipment.product_name.ilike(search_filter))
        )
    
    result = await db.execute(
        query.order_by(Shipment.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    shipments = result.scalars().all()
    
    # Inject AI insights for specific searches
    if search and shipments:
        for s in shipments:
            s.ai_insight = await get_ai_insight(
                s.product_name, s.origin_country, s.destination_country, s.status
            )
            
    return shipments

async def get_shipment_by_id(db: AsyncSession, shipment_id: int):
    shipment = await db.get(Shipment, shipment_id)
    if shipment:
        shipment.ai_insight = await get_ai_insight(
            shipment.product_name, 
            shipment.origin_country, 
            shipment.destination_country, 
            shipment.status
        )
    return shipment

async def create_shipment_tracking(db: AsyncSession, shipment_id: int, status: str, location: str, remarks: str):
    new_tracking = ShipmentTracking(
        shipment_id=shipment_id,
        status=status,
        location=location,
        remarks=remarks
    )
    db.add(new_tracking)
    
    # Update shipment main state
    shipment = await db.get(Shipment, shipment_id)
    if shipment:
        shipment.status = status
        shipment.current_location = location
        
    await db.commit()
    await db.refresh(new_tracking)
    return new_tracking
