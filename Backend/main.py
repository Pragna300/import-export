from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import traceback
from dotenv import load_dotenv

from database import engine, Base
from routers import document, shipment, tracking
from auth.routes import router as auth_router
import asyncio
from services.websocket_service import listen_to_pg_tracking

# Load env
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY")
print("API KEY LOADED:", OPENROUTER_API_KEY is not None)

app = FastAPI(title="AI Import-Export Intelligence System")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(document.router)
app.include_router(auth_router)
app.include_router(shipment.router)
app.include_router(tracking.router)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "AI Import-Export System Backend is Running ✅"}

# Create tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Start WebSocket PG listener background task
    asyncio.create_task(listen_to_pg_tracking())

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("=== INTERNAL SERVER ERROR ===")
    print(traceback.format_exc())
    return {"detail": "Internal Server Error"}
