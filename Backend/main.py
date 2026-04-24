import os
import shutil
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware
import traceback
import asyncio
from sqlalchemy import text

from database import engine, Base, get_db
from tracking_service.service import listen_to_pg_tracking

# ✅ IMPORTANT: Import all models into Base.metadata so tables get registered
import models.models # This ensures Shipment, Document, Tracking etc. are seen by Base

# Routers
from auth.routes import router as auth_router
from document_service.routes import router as document_router
from shipment_service.routes import router as shipment_router
from analytics_service.routes import router as analytics_router
from ai_service.routes import router as ai_router
from hsn_service.routes import router as hsn_router
from risk_service.routes import router as risk_router
from duty_service.routes import router as duty_router
from tracking_service.routes import router as tracking_router

app = FastAPI(title="AI Import-Export Unified Gateway")

# CORS Configuration
# When allow_credentials=True, allow_origins cannot be ["*"]
# Using allow_origin_regex to support all Vercel subdomains and preview URLs
raw_origins = os.getenv("CORS_ORIGINS", "https://import-export-shnoor.vercel.app,https://importexport-phi.vercel.app,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
cors_origins = [origin.strip() for origin in raw_origins if origin.strip() and origin.strip() != "*"]

# Always allow local development if not explicitly in origins
if "http://localhost:5173" not in cors_origins:
    cors_origins.append("http://localhost:5173")
if "http://127.0.0.1:5173" not in cors_origins:
    cors_origins.append("http://127.0.0.1:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # ✅ Allows all vercel deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(shipment_router)
app.include_router(analytics_router)
app.include_router(ai_router)
app.include_router(hsn_router)
app.include_router(risk_router)
app.include_router(duty_router)
app.include_router(tracking_router)

@app.post("/import-data", tags=["Admin"])
async def import_dataset_endpoint(db: AsyncSession = Depends(get_db)):
    """Trigger the dataset import from the CSV file."""
    from scripts.import_dataset import import_data
    # We need to monkey-patch or adapt import_data to use the provided db session
    # For now, let's just try to run it. 
    # Actually, import_dataset.py uses its own async_session.
    try:
        # Since import_data in the script doesn't take parameters, 
        # we might need to modify it or just call it if it's safe.
        import asyncio
        from scripts.import_dataset import import_data
        await import_data()
        return {"message": "Import process finished. Check logs for details."}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Unified Gateway is active. All services integrated."}

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

# ✅ FIXED STARTUP
@app.on_event("startup")
async def startup():
    try:
        print("🚀 Starting app...")

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            # 🔄 AUTO-SYNC: Add missing columns if they don't exist
            print("🔄 Synchronizing database schema...")
            try:
                await conn.execute(text("ALTER TABLE duties ADD COLUMN IF NOT EXISTS status VARCHAR(50);"))
                await conn.execute(text("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);"))
                # Add doc_type to documents
                await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50);"))
                print("✅ Database columns synchronized.")
            except Exception as sync_err:
                print(f"⚠️ Schema sync warning: {sync_err}")

        print("✅ Tables created successfully")

        # Start the live tracking background task
        asyncio.create_task(listen_to_pg_tracking())
        print("✅ Live tracking listener initialized")

        # 🚀 PRE-LOAD HSN MODEL
        from hsn_service.service import load_hsn_model
        load_hsn_model()
        print("✅ HSN Model pre-loaded")

    except Exception as e:
        print("❌ Startup error:", e)

# ✅ FIXED EXCEPTION HANDLER
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("=== GATEWAY ERROR ===")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )