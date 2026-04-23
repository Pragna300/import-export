import asyncio
from database import async_session
from models.models import Shipment
from sqlalchemy import select, func

async def count_shipments():
    async with async_session() as db:
        result = await db.execute(select(func.count(Shipment.id)))
        count = result.scalar()
        print(f"--- SHIPMENT_COUNT: {count} ---")

if __name__ == "__main__":
    try:
        asyncio.run(count_shipments())
    except Exception as e:
        print(f"--- ERROR: {e} ---")
