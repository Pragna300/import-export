from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from starlette.concurrency import run_in_threadpool
from dotenv import load_dotenv
import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "your-refresh-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using direct bcrypt."""
    try:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        
        return await run_in_threadpool(
            bcrypt.checkpw, 
            plain_password.encode('utf-8'), 
            hashed_password
        )
    except Exception:
        return False

async def get_password_hash(password: str) -> str:
    """Hash a password using direct bcrypt with the 72-byte limit handled."""
    # Bcrypt has a hard 72-byte limit. 
    pw_bytes = password.encode('utf-8')
    if len(pw_bytes) > 71:
        # Safely truncate to 71 bytes
        pw_bytes = pw_bytes[:71]
    
    # Generate salt (using 10 rounds for faster performance in demo/dev) and hash
    salt = await run_in_threadpool(bcrypt.gensalt, rounds=10)
    hashed = await run_in_threadpool(bcrypt.hashpw, pw_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | int | None = None):
    """Create short-lived access token"""
    to_encode = data.copy()
    if isinstance(expires_delta, int):
        expires_delta = timedelta(minutes=expires_delta)
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    if "type" not in to_encode:
        to_encode.update({"type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_access_token(token: str):
    """Verify access token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    """Create long-lived refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def verify_refresh_token(token: str):
    """Verify refresh token"""
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None

# --- EMAIL CONFIGURATION ---

async def send_reset_email(email: str, reset_link: str):
    """Send a real password reset email asynchronously"""
    # Clean password from spaces (sometimes copied with spaces from Google)
    mail_password = os.getenv("MAIL_PASSWORD", "").replace(" ", "")
    
    conf = ConnectionConfig(
        MAIL_USERNAME = os.getenv("MAIL_USERNAME", ""),
        MAIL_PASSWORD = mail_password,
        MAIL_FROM = os.getenv("MAIL_FROM", "support@shnoor.com"),
        MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
        MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Shnoor Logistics"),
        MAIL_STARTTLS = True,
        MAIL_SSL_TLS = False,
        USE_CREDENTIALS = True,
        VALIDATE_CERTS = True
    )

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #2563eb;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your Shnoor Logistics account. Click the button below to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>If you didn't request this, you can safely ignore this email. This link will expire in 30 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">Shnoor International Logistics &copy; 2026</p>
        </div>
    </body>
    </html>
    """
    
    message = MessageSchema(
        subject="Password Reset Request - Shnoor Logistics",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"✅ EMAIL SENT SUCCESSFULLY to {email}")
        return True
    except Exception as e:
        print("\n" + "!"*50)
        print(f"❌ EMAIL SENDING FAILED to {email}")
        print(f"ERROR: {str(e)}")
        print("!"*50 + "\n")
        return False
