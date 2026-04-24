
import asyncio
from sqlalchemy.ext.asyncio import create_async_session, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os
import sys

# Add Backend to path
sys.path.append(os.path.join(os.getcwd(), 'Backend'))

from Backend.models.models import Shipment
from Backend.database import engine

async def check_shipments():
    async with engine.connect() as conn:
        result = await conn.execute(select(Shipment).limit(5))
        shipments = result.fetchall()
        print(f"Found {len(shipments)} shipments")
        for s in shipments:
            print(f"ID: {s.id}, Code: {s.shipment_code}, Product: {s.product_name}")

if __name__ == "__main__":
    asyncio.run(check_shipments())
