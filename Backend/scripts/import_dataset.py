import csv
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path
from sqlalchemy import select

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
        # 1. Ensure an Admin User exists
        res = await db.execute(select(User).limit(1))
        system_user = res.scalars().first()
        
        if not system_user:
            print("👤 Creating system user...")
            system_user = User(
                name="System Admin",
                email="admin@shnoor.com",
                role="admin",
                is_active=True
            )
            db.add(system_user)
            await db.commit()
            await db.refresh(system_user)

        # 2. CACHE EXISTING CODES FOR SPEED
        print("🔍 Scanning database for existing records...")
        existing_codes_res = await db.execute(select(Shipment.shipment_code))
        existing_codes = set(existing_codes_res.scalars().all())
        print(f"✅ Cached {len(existing_codes)} existing records.")

        # 3. Read CSV
        with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            # Clean column names (strip whitespace)
            reader.fieldnames = [name.strip() for name in reader.fieldnames]
            
            count = 0
            skipped = 0
            for row in reader:
                try:
                    ship_code = row['shipment_id']
                    if ship_code in existing_codes:
                        skipped += 1
                        continue

                    # 4. MAP DATA
                    invoice_date = datetime.strptime(row['invoice_date'], '%Y-%m-%d')
                    
                    shipment = Shipment(
                        shipment_code=ship_code,
                        product_name=row['product'],
                        quantity=1,
                        unit_price=float(row['revenue'] or 0),
                        total_value=float(row['revenue'] or 0),
                        currency="INR",
                        status=row['status'] if row['status'] != 'Paid' else 'Delivered',
                        origin_country=row['origin'],
                        destination_country=row['destination'],
                        created_by=system_user.id,
                        created_at=invoice_date
                    )
                    db.add(shipment)
                    await db.flush()

                    # 5. CREATE DUTY
                    duty = Duty(
                        shipment_id=shipment.id,
                        duty_amount=float(row['duty_expense'] or 0),
                        tax_amount=float(row['tax_expense'] or 0),
                        total_cost=float(row['duty_expense'] or 0) + float(row['tax_expense'] or 0),
                        status="Paid",
                        calculated_at=invoice_date
                    )
                    db.add(duty)

                    # 6. CREATE HSN
                    if row.get('hsn_code'):
                        hsn = HSNClassification(
                            shipment_id=shipment.id,
                            hsn_code=row['hsn_code'],
                            product_name=row['product'],
                            confidence_score=0.95,
                            created_at=invoice_date
                        )
                        db.add(hsn)

                    # 7. CREATE RISK
                    risk = RiskAssessment(
                        shipment_id=shipment.id,
                        risk_level=row['risk_level'],
                        risk_score=float(row['risk_score'] or 0),
                        reason=f"Historical risk from {row['origin']}",
                        created_at=invoice_date
                    )
                    db.add(risk)

                    count += 1
                    if count % 50 == 0:
                        await db.commit()
                        print(f"📦 Progress: {count} records synced...")

                except Exception as e:
                    print(f"⚠️ Error on row {count}: {e}")
                    continue

        await db.commit()
        print(f"✅ IMPORT COMPLETE: {count} records added, {skipped} duplicates skipped.")

if __name__ == "__main__":
    asyncio.run(import_data())
