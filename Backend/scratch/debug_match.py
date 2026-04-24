import asyncio
import os
import sys
from sqlalchemy import select

# Add project root to path
sys.path.append(os.getcwd())

from database import engine
from models.models import Shipment

async def debug_match():
    async with engine.connect() as conn:
        res = await conn.execute(select(Shipment.shipment_code).limit(5))
        codes = [r[0] for r in res.fetchall()]
        print(f"Sample DB Codes: {codes}")

if __name__ == "__main__":
    asyncio.run(debug_match())
