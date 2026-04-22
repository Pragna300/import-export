import asyncio
import os
import sys

# Add the parent directory to sys.path to import from database and models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, async_session, Base
from models.models import User, Shipment, ShipmentTracking, HSNClassification, RiskAssessment, Duty
from auth.utils import get_password_hash
from decimal import Decimal
from datetime import datetime, timedelta

async def seed_data():
    print("🚀 Starting Database Seeding...")
    
    async with engine.begin() as conn:
        # Create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as db:
        # 1. Create a Test User
        print("👤 Creating Test User...")
        test_user = User(
            name="Logistics Manager",
            email="manager@shnoor.com",
            password_hash=get_password_hash("password123"),
            role="admin"
        )
        db.add(test_user)
        await db.flush() # Get the ID

        # 2. Create Sample Shipments
        print("📦 Creating Sample Shipments...")
        shipments_data = [
            {
                "code": "SHP-772A1B01",
                "product": "Breville Refrigerators",
                "origin": "Indonesia",
                "dest": "India",
                "val": 1724.0,
                "qty": 2,
                "status": "In Transit"
            },
            {
                "code": "SHP-883F2C02",
                "product": "Industrial Solar Panels",
                "origin": "China",
                "dest": "Germany",
                "val": 15500.0,
                "qty": 50,
                "status": "Processing"
            },
            {
                "code": "SHP-991D3E03",
                "product": "Premium Coffee Beans",
                "origin": "Brazil",
                "dest": "USA",
                "val": 4500.0,
                "qty": 1000,
                "status": "Delivered"
            }
        ]

        shipments = []
        for s in shipments_data:
            new_shipment = Shipment(
                shipment_code=s["code"],
                product_name=s["product"],
                quantity=s["qty"],
                unit_price=Decimal(s["val"] / s["qty"]),
                total_value=Decimal(s["val"]),
                currency="USD",
                origin_country=s["origin"],
                destination_country=s["dest"],
                status=s["status"],
                created_by=test_user.id
            )
            db.add(new_shipment)
            shipments.append(new_shipment)
        
        await db.flush()

        # 3. Add Tracking History for the first shipment
        print("📍 Adding Tracking History...")
        h1 = ShipmentTracking(
            shipment_id=shipments[0].id,
            status="Order Placed",
            location="Jakarta Port",
            remarks="Cargo booked and awaiting clearance.",
            timestamp=datetime.utcnow() - timedelta(days=2)
        )
        h2 = ShipmentTracking(
            shipment_id=shipments[0].id,
            status="In Transit",
            location="Indian Ocean",
            remarks="Vessel sailing towards Mumbai.",
            timestamp=datetime.utcnow() - timedelta(days=1)
        )
        db.add_all([h1, h2])

        # 4. Add HSN Classification
        print("🔍 Adding HSN Classifications...")
        hsn = HSNClassification(
            shipment_id=shipments[0].id,
            product_name="Breville Refrigerators",
            hsn_code="8418.10.10",
            confidence_score=0.98,
            model_version="LLM-Distil-V2"
        )
        db.add(hsn)

        # 5. Add Risk Assessment
        print("⚠️ Adding Risk Assessments...")
        risk = RiskAssessment(
            shipment_id=shipments[0].id,
            risk_score=15.5,
            risk_level="Low",
            reason="Stable route and trusted supplier.",
            model_version="Risk-ML-G4"
        )
        db.add(risk)

        # 6. Add Duty
        print("💰 Adding Duty Records...")
        duty = Duty(
            shipment_id=shipments[0].id,
            hsn_code="8418.10.10",
            duty_amount=Decimal(172.4), # 10%
            tax_amount=Decimal(310.3),  # 18%
            total_cost=Decimal(2206.7),
            currency="USD"
        )
        db.add(duty)

        await db.commit()
        print("✅ Seeding Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
