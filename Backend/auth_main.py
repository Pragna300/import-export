from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import traceback

from database import engine, Base
from auth.routes import router as auth_router
from models import models  # noqa: F401


app = FastAPI(title="AI Import-Export Auth Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/")
async def root():
    return {"message": "Auth service is running"}


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("=== INTERNAL SERVER ERROR ===")
    print(traceback.format_exc())
    return {"detail": "Internal Server Error"}
