import asyncio
import os
import sys
from sqlalchemy import text

# Add parent directory to path so we can import from root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from scripts.import_dataset import import_data


async def reset_and_import():
    print("🗑️ Truncating tables...")
    async with engine.begin() as conn:
        # Disable FK checks for truncation if needed, but here we'll just delete in order
        await conn.execute(text("TRUNCATE TABLE risk_assessments CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE hsn_classifications CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE duties CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE documents CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE shipment_tracking CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE shipments CASCADE;"))
    
    print("✅ Tables truncated. Starting re-import...")
    await import_data()
    print("🚀 All systems go!")

if __name__ == "__main__":
    asyncio.run(reset_and_import())
