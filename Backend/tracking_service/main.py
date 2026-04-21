import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from tracking_service.routes import router as tracking_router

app = FastAPI(title="AI Import-Export Tracking Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tracking_router)

@app.get("/")
async def root():
    return {"message": "Tracking service is running"}

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("=== INTERNAL SERVER ERROR ===")
    print(traceback.format_exc())
    return {"detail": "Internal Server Error"}
