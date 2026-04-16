from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import traceback

from auth.routes import router as auth_router

app = FastAPI(title="AI Import-Export Intelligence System")

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
    return {"message": "AI Import-Export System Backend is Running ✅"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("=== INTERNAL SERVER ERROR ===")
    print(traceback.format_exc())
    return {"detail": "Internal Server Error"}