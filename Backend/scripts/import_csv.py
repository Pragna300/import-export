import asyncio
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from database import engine
from models.models import Shipment, Duty, HSNClassification, RiskAssessment, User
from sqlalchemy import select

async def import_data():
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    # Read the CSV (Ensure this file is in the Backend folder)
    csv_filename = "logistics_accountant_dataset (1).csv"
    try:
        # Fill NaN with empty strings and clean numeric columns
        df = pd.read_csv(csv_filename).fillna('')
        print(f"📊 Loaded {len(df)} records from CSV.")
    except FileNotFoundError:
        print(f"❌ Error: {csv_filename} not found.")
        return

    async with async_session() as db:
        # Get or create admin user
        result = await db.execute(select(User).limit(1))
        admin = result.scalars().first()
        if not admin:
            print("👤 Creating default admin user...")
            admin = User(
                name="System Admin", 
                email="admin@shnoor.com", 
                password_hash="$2b$12$6Gxe46f6V1Oq8V3pP7Gxe.vV0l8v0v0v0v0v0v0v0v0v0v0v0v0v0", 
                role="admin"
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)

        print(f"⏳ Syncing data to Accountant Dashboard...")
        success_count = 0
        error_count = 0

        for index, row in df.iterrows():
            try:
                # 1. Create Shipment
                shipment = Shipment(
                    shipment_code=str(row.get('shipment_id', f"SHN-Bulk-{index}")).strip(),
                    product_name=str(row.get('product', 'Unknown Product')),
                    description=f"Auto-import from {str(row.get('vendor', 'Unknown Vendor'))}",
                    quantity=int(row.get('quantity', 1)) if str(row.get('quantity')).isdigit() else 1,
                    unit_price=float(row.get('unit_price', 0)) if str(row.get('unit_price')).replace('.','').isdigit() else 0,
                    total_value=float(row.get('revenue', 0)),
                    currency="INR",
                    origin_country=str(row.get('origin', 'Unknown'))[:50],
                    destination_country=str(row.get('destination', 'India'))[:50],
                    status='Delivered' if row.get('status') == 'Paid' else 'In Transit',
                    created_by=admin.id
                )
                db.add(shipment)
                await db.flush()

                # 2. Create HSN
                hsn = HSNClassification(
                    shipment_id=shipment.id,
                    product_name=str(row['product']),
                    hsn_code=str(row.get('hsn_code', '00000000'))[:100], # Widened
                    confidence_score=0.98,
                    model_version="Pipeline-v2.0"
                )
                db.add(hsn)

                # 3. Create Duty/Expense
                duty = Duty(
                    shipment_id=shipment.id,
                    hsn_code=str(row.get('hsn_code', '00000000'))[:100], # Widened
                    duty_amount=float(row.get('duty_expense', 0)),
                    tax_amount=float(row.get('tax_expense', 0)),
                    total_cost=float(row.get('duty_expense', 0)) + float(row.get('tax_expense', 0)),
                    currency="INR"
                )
                db.add(duty)

                # 4. Create Risk
                risk = RiskAssessment(
                    shipment_id=shipment.id,
                    risk_score=float(row.get('risk_score', 0)),
                    risk_level=str(row.get('risk_level', 'Low'))[:50],
                    reason="Bulk Financial Import",
                    model_version="Pipeline-v2.0"
                )
                db.add(risk)
                
                success_count += 1
                if success_count % 50 == 0:
                    print(f"✅ Processed {success_count}/{len(df)} rows...")

            except Exception as e:
                error_count += 1
                print(f"⚠️ Error on row {index}: {e}")
                continue # Skip bad row and continue

        await db.commit()
        print(f"\n🎉 Import Finished!")
        print(f"📊 Success: {success_count}")
        print(f"❌ Failed: {error_count}")

if __name__ == "__main__":
    asyncio.run(import_data())
