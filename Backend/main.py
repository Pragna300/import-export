import os
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware
import traceback
import asyncio
from sqlalchemy import text

from database import engine, Base, get_db

# ✅ IMPORTANT: Import models so tables get registered
from auth import models  # ADD THIS LINE

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

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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

        print("✅ Tables created successfully")

    except Exception as e:
        print("❌ DB error:", e)

# ✅ FIXED EXCEPTION HANDLER
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("=== GATEWAY ERROR ===")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )