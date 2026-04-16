from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from . import models, schemas, utils

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        return None
    if not user.is_active:
        return None
    if not utils.verify_password(password, user.password_hash):
        return None
    
    return user