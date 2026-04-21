import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    print("🚀 Starting Database Schema Migration (Widening Columns)...")
    
    # List of ALTER commands to expand truncated columns
    migrations = [
        "ALTER TABLE shipments ALTER COLUMN shipment_code TYPE VARCHAR(100);",
        "ALTER TABLE hsn_classifications ALTER COLUMN hsn_code TYPE VARCHAR(100);",
        "ALTER TABLE hsn_classifications ALTER COLUMN model_version TYPE VARCHAR(50);",
        "ALTER TABLE duties ALTER COLUMN hsn_code TYPE VARCHAR(100);",
        "ALTER TABLE risk_assessments ALTER COLUMN risk_level TYPE VARCHAR(50);",
        "ALTER TABLE risk_assessments ALTER COLUMN model_version TYPE VARCHAR(50);",
    ]
    
    async with engine.connect() as conn:
        for cmd in migrations:
            try:
                print(f"Executing: {cmd}")
                await conn.execute(text(cmd))
                await conn.commit()
            except Exception as e:
                print(f"⚠️ Warning (could be already migrated): {e}")

    print("✅ Migration Complete! Columns have been widened.")

if __name__ == "__main__":
    asyncio.run(migrate())
