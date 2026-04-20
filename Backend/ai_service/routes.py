from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from database import get_db
from . import service

router = APIRouter(prefix="/ai", tags=["AI & Chatbot"])

class ChatRequest(BaseModel):
    message: str
    history: list = []

class InsightRequest(BaseModel):
    product: str
    origin: str
    destination: str
    status: str

@router.post("/chatbot")
async def chatbot(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    content = await service.get_chatbot_response(db, request.message, request.history)
    return {"response": content}

@router.post("/predictive-insight")
async def predictive_insight(request: InsightRequest):
    content = await service.generate_predictive_insight(
        request.product, request.origin, request.destination, request.status
    )
    return {"insight": content}
