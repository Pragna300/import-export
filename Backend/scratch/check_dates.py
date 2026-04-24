import asyncio
import os
import sys
from sqlalchemy import select, func

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.models import Shipment
from database import engine

async def check_dates():
    async with engine.connect() as conn:
        res = await conn.execute(select(func.min(Shipment.created_at), func.max(Shipment.created_at), func.count(Shipment.id)))
        min_date, max_date, count = res.first()
        print(f"Total Shipments: {count}")
        print(f"Min Created At: {min_date}")
        print(f"Max Created At: {max_date}")

if __name__ == "__main__":
    asyncio.run(check_dates())
