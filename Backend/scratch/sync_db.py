
import asyncio
from sqlalchemy import text
from database import engine

async def sync_db():
    print("🔄 Synchronizing database schema...")
    async with engine.begin() as conn:
        try:
            # Add status column to duties table if it doesn't exist
            await conn.execute(text("ALTER TABLE duties ADD COLUMN IF NOT EXISTS status VARCHAR(50);"))
            print("✅ Added 'status' column to 'duties' table.")
            
            # Also ensure created_by exists in shipments if we use it
            await conn.execute(text("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);"))
            print("✅ Verified 'created_by' in 'shipments' table.")
            
            print("🎉 Database sync complete!")
        except Exception as e:
            print(f"❌ Error during sync: {e}")

if __name__ == "__main__":
    asyncio.run(sync_db())
