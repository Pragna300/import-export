import asyncio
import pandas as pd
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
import sys
import os

# Ensure the Backend directory is in the path
sys.path.append(os.getcwd())

from database import engine
from models.models import Shipment, Duty, HSNClassification, RiskAssessment

async def fix_dates():
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    csv_filename = "logistics_accountant_dataset (1).csv"
    
    try:
        df = pd.read_csv(csv_filename).fillna('')
        print(f"📊 Loaded {len(df)} records to fix dates.")
    except Exception as e:
        print(f"❌ Error: {e}")
        return

    async with async_session() as db:
        success = 0
        for index, row in df.iterrows():
            code = str(row.get('shipment_id')).strip()
            try:
                dt_str = str(row.get('invoice_date')).strip()
                dt = datetime.datetime.strptime(dt_str, '%Y-%m-%d')
                
                # Update Shipment
                res = await db.execute(select(Shipment).where(Shipment.shipment_code == code))
                shipment = res.scalars().first()
                
                if shipment:
                    shipment.created_at = dt
                    # Update associated modules
                    await db.execute(update(HSNClassification).where(HSNClassification.shipment_id == shipment.id).values(created_at=dt))
                    await db.execute(update(Duty).where(Duty.shipment_id == shipment.id).values(created_at=dt))
                    await db.execute(update(RiskAssessment).where(RiskAssessment.shipment_id == shipment.id).values(created_at=dt))
                    success += 1
                
                if success % 100 == 0:
                    print(f"✅ Fixed {success} records...")
                    
            except Exception as e:
                continue

        await db.commit()
        print(f"\n🎉 Successfully fixed {success} shipment dates!")

if __name__ == "__main__":
    asyncio.run(fix_dates())
