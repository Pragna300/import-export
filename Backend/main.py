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
from logger import log
import time

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

# ✅ REQUEST LOGGING MIDDLEWARE
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    log.debug(f"📥 Incoming: {request.method} {request.url.path}")
    response = await call_next(request)
    duration = time.time() - start_time
    
    log.info(
        f"📤 Outgoing: {request.method} {request.url.path} | Status: {response.status_code} | Duration: {duration:.3f}s"
    )
    return response

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
        log.info("🚀 Starting Shnoor Unified Gateway...")

        # 🚀 ROBUST STARTUP: Ensure tables exist (Fast)
        async with engine.connect() as conn:
            log.info("📦 Ensuring database tables exist...")
            await conn.run_sync(Base.metadata.create_all)
            await conn.commit()

        # 🔄 BACKGROUND SYNC: Add missing columns in a single fast block
        async def sync_columns_background():
            try:
                async with engine.connect() as conn:
                    print("🔄 Background Sync: Running fast schema update...")
                    # 1. Update Columns
                    columns_sql = """
                    DO $$ 
                    BEGIN 
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='duties' AND column_name='status') THEN
                            ALTER TABLE duties ADD COLUMN status VARCHAR(50);
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipments' AND column_name='created_by') THEN
                            ALTER TABLE shipments ADD COLUMN created_by VARCHAR(100);
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='doc_type') THEN
                            ALTER TABLE documents ADD COLUMN doc_type VARCHAR(50);
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='photo_url') THEN
                            ALTER TABLE users ADD COLUMN photo_url TEXT;
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipments' AND column_name='ai_insight') THEN
                            ALTER TABLE shipments ADD COLUMN ai_insight TEXT;
                        END IF;
                    END $$;
                    """
                    await conn.execute(text(columns_sql))

                    # 2. Performance Indexes (must be separate for asyncpg)
                    indexes = [
                        "CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at)",
                        "CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)",
                        "CREATE INDEX IF NOT EXISTS idx_documents_shipment_id ON documents(shipment_id)",
                        "CREATE INDEX IF NOT EXISTS idx_tracking_shipment_id ON shipment_tracking(shipment_id)",
                        "CREATE INDEX IF NOT EXISTS idx_risk_shipment_id ON risk_assessments(shipment_id)",
                        "CREATE INDEX IF NOT EXISTS idx_risk_level ON risk_assessments(risk_level)",
                        "CREATE INDEX IF NOT EXISTS idx_duty_shipment_id ON duties(shipment_id)",
                        "CREATE INDEX IF NOT EXISTS idx_hsn_shipment_id ON hsn_classifications(shipment_id)"
                    ]
                    
                    for idx_sql in indexes:
                        await conn.execute(text(idx_sql))

                    await conn.commit()
                    log.info("✅ Background Sync: Database fully optimized.")
            except Exception as e:
                log.error(f"⚠️ Background Sync Failed: {e}")

        asyncio.create_task(sync_columns_background())
        log.info("✅ Database initialization scheduled")

        # Start the live tracking background task
        asyncio.create_task(listen_to_pg_tracking())
        log.info("✅ Live tracking listener initialized")

        # 🚀 OPTIMIZATION: Model pre-loading is disabled for faster startup.
        # It will load lazily when the first HSN prediction is requested.
        # from hsn_service.service import load_hsn_model
        # load_hsn_model()
        log.info("⚡ Startup optimized: AI models will load lazily")

    except Exception as e:
        log.error(f"❌ Startup error: {e}")

# ✅ FIXED EXCEPTION HANDLER
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    log.error(f"=== GATEWAY ERROR ===\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )