import asyncio
import os
from sqlalchemy import text
from database import engine

async def rectify_database_v3():
    print("🛠️ Starting Comprehensive Database Rectification (v3)...")
    
    # Tables and their expected columns
    rectifications = {
        "shipments": [
            ("shipment_code", "VARCHAR(50) UNIQUE"),
            ("product_name", "TEXT"),
            ("description", "TEXT"),
            ("quantity", "INT"),
            ("unit_price", "NUMERIC"),
            ("total_value", "NUMERIC"),
            ("currency", "VARCHAR(10)"),
            ("origin_country", "VARCHAR(50)"),
            ("destination_country", "VARCHAR(50)"),
            ("status", "VARCHAR(50)"),
            ("current_location", "TEXT"),
            ("created_by", "INT"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ],
        "documents": [
            ("shipment_id", "INT"),
            ("file_url", "TEXT"),
            ("doc_type", "VARCHAR(50)"),
            ("status", "VARCHAR(50)"),
            ("extracted_data", "JSONB"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ]
    }
    
    async with engine.connect() as conn:
        for table, columns in rectifications.items():
            print(f"\n🔍 Checking '{table}' table columns...")
            for col, col_type in columns:
                try:
                    check_sql = text(f"""
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='{table}' AND column_name='{col}';
                    """)
                    result = await conn.execute(check_sql)
                    
                    if not result.fetchone():
                        print(f"➕ Adding missing column '{col}' to '{table}'...")
                        # Clean type for ALTER TABLE (remove constraints like UNIQUE/REFERENCES for simplicity)
                        base_type = col_type.split("UNIQUE")[0].split("REFERENCES")[0].strip()
                        alter_sql = text(f"ALTER TABLE {table} ADD COLUMN {col} {base_type};")
                        await conn.execute(alter_sql)
                        await conn.commit()
                        print(f"✅ Column '{col}' added.")
                    else:
                        # print(f"💎 '{col}' exists.")
                        pass
                except Exception as e:
                    print(f"❌ Error adding '{col}' to '{table}': {e}")

    print("\n🎉 Comprehensive Rectification Complete. All tables should now match models.py.")

if __name__ == "__main__":
    asyncio.run(rectify_database_v3())
