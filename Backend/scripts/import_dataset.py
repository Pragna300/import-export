import csv
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# Add the parent directory to sys.path to allow importing from database and models
sys.path.append(str(Path(__file__).parent.parent))

from database import async_session, engine, Base
from models.models import User, Shipment, Duty, RiskAssessment, HSNClassification

CSV_FILE = Path(__file__).parent.parent / "logistics_accountant_dataset (1).csv"

async def import_data():
    if not CSV_FILE.exists():
        print(f"❌ CSV file not found at {CSV_FILE}")
        return

    print(f"🚀 Starting import from {CSV_FILE}...")
    
    async with async_session() as db:
        # 1. Ensure a System User exists
        result = await db.execute(asyncio.get_event_loop().run_in_executor(None, lambda: db.get(User, 1)))
        # Wait, db.get is not async in older sqlalchemy, but here we use AsyncSession
        system_user = await db.get(User, 1)
        if not system_user:
            print("👤 Creating system user...")
            system_user = User(
                id=1,
                name="System Admin",
                email="admin@shnoor.com",
                role="admin",
                is_active=True
            )
            db.add(system_user)
            await db.commit()
            await db.refresh(system_user)

        # 2. Read CSV
        with open(CSV_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                try:
                    # Parse date
                    invoice_date = datetime.strptime(row['invoice_date'], '%Y-%m-%d')
                    
                    # Create Shipment
                    shipment = Shipment(
                        shipment_code=row['shipment_id'],
                        product_name=row['product'],
                        total_value=float(row['revenue']),
                        status=row['status'] if row['status'] != 'Paid' else 'Delivered',
                        origin_country=row['origin'],
                        destination_country=row['destination'],
                        created_by=system_user.id,
                        created_at=invoice_date
                    )
                    db.add(shipment)
                    await db.flush() # Get shipment.id

                    # Create Duty
                    duty = Duty(
                        shipment_id=shipment.id,
                        hsn_code=row['hsn_code'],
                        duty_amount=float(row['duty_expense']),
                        tax_amount=float(row['tax_expense']),
                        total_cost=float(row['total_landed_cost']),
                        currency="USD", # Based on the CSV values looking like USD
                        calculated_at=invoice_date
                    )
                    db.add(duty)

                    # Create Risk Assessment
                    risk = RiskAssessment(
                        shipment_id=shipment.id,
                        risk_score=float(row['risk_score']),
                        risk_level=row['risk_level'],
                        reason="Dataset Import",
                        model_version="Dataset-v1"
                    )
                    db.add(risk)

                    # Create HSN Classification
                    if row['hsn_code'] and row['hsn_code'] != 'None':
                        hsn = HSNClassification(
                            shipment_id=shipment.id,
                            product_name=row['product'],
                            hsn_code=row['hsn_code'],
                            confidence_score=0.99,
                            model_version="Ground Truth"
                        )
                        db.add(hsn)

                    count += 1
                    if count % 50 == 0:
                        print(f"📦 Imported {count} records...")
                        await db.commit()

                except Exception as e:
                    print(f"⚠️ Error importing row {row.get('shipment_id')}: {e}")
                    continue

            await db.commit()
            print(f"✅ Successfully imported {count} records!")

if __name__ == "__main__":
    asyncio.run(import_data())
