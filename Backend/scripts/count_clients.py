import asyncio
import os
import sys
from sqlalchemy import select, func

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import async_session
from models.models import Shipment


async def count_clients():
    async with async_session() as session:
        stmt = select(func.count(func.distinct(Shipment.vendor)))
        result = await session.execute(stmt)
        count = result.scalar()
        print(f"Total Unique Clients: {count}")

if __name__ == "__main__":
    asyncio.run(count_clients())
