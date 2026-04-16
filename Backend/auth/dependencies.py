# auth/dependencies.py
from sqlalchemy.orm import Session
from database import SessionLocal   # ← Make sure this is correct

def get_db():                       # ← This must be a FUNCTION
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()