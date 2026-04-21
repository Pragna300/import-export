import os
import smtplib
from email.message import EmailMessage
import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from . import service
from pydantic import BaseModel

class EmailSetupRequest(BaseModel):
    email: str
    frequency: str

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary")
async def get_summary(
    start_date: str = None, 
    end_date: str = None, 
    db: AsyncSession = Depends(get_db)
):
    return await service.get_dashboard_summary(db, start_date=start_date, end_date=end_date)

def send_report_email(recipient: str, frequency: str, summary_data: dict):
    sender_email = os.getenv("SMTP_EMAIL", "praneeth@shnoor.com") 
    sender_password = os.getenv("SMTP_PASSWORD", "bpbt jdls auck myga") 
    
    msg = EmailMessage()
    msg['Subject'] = f'Your {frequency} Analytics Report - Shnoor AI Dashboard'
    msg['From'] = sender_email
    msg['To'] = recipient

    # Extract real metrics from the database response
    data = summary_data.get("summary", {})
    revenue = data.get("total_revenue", "₹0")
    invoices = data.get("total_invoices", "0")
    paid_percent = data.get("paid_percent", "0%")
    pending = data.get("pending_amount", "₹0")

    # Create a beautifully formatted HTML email
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Shnoor AI Import-Export Dashboard</h2>
        <p>Hello,</p>
        <p>You have successfully configured <strong>{frequency}</strong> automated analytics reports. Here is your initial snapshot:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Financial Summary</h3>
            <table style="width: 100%; text-align: left; border-collapse: collapse;">
                <tr><th style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Total Revenue</th><td style="font-weight: bold; color: #10b981; border-bottom: 1px solid #f1f5f9;">{revenue}</td></tr>
                <tr><th style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Total Invoices</th><td style="font-weight: bold; border-bottom: 1px solid #f1f5f9;">{invoices}</td></tr>
                <tr><th style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Payment Success</th><td style="font-weight: bold; border-bottom: 1px solid #f1f5f9;">{paid_percent}</td></tr>
                <tr><th style="padding: 10px 0; color: #64748b;">Pending Amount</th><td style="font-weight: bold; color: #ef4444;">{pending}</td></tr>
            </table>
        </div>
        
        <p>You will receive these updates automatically based on your selected frequency.</p>
        <p>Best,<br><strong>The Analytics Team</strong></p>
      </body>
    </html>
    """
    
    msg.set_content("Please enable HTML to view this report.") # Plain text fallback
    msg.add_alternative(html_content, subtype='html')

    try:
        # Connect to Gmail's secure SMTP server
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False

@router.post("/setup-email")
async def setup_automated_email(request: EmailSetupRequest, db: AsyncSession = Depends(get_db)):
    # TODO: can save this to db to manage user preferences
    print("\n" + "="*50)
    print("AUTOMATED EMAIL REPORTS CONFIGURED")
    print(f"Recipient: {request.email}")
    print(f"Frequency: {request.frequency}")
    print("="*50 + "\n")
    
    # 1. Fetch the actual dashboard summary data from the database!
    summary_data = await service.get_dashboard_summary(db)
    
    # Actually send the email in a background thread to avoid blocking the API
    email_sent = await asyncio.to_thread(send_report_email, request.email, request.frequency, summary_data)
    if email_sent:
        print(f" Real email successfully dispatched to {request.email}!")
    
    return {
        "message": "Email configured successfully", 
        "email": request.email,
        "frequency": request.frequency
    }

@router.get("/risk")
async def get_risk(db: AsyncSession = Depends(get_db)):
    return await service.get_risk_analytics(db)

@router.get("/hsn")
async def get_hsn(db: AsyncSession = Depends(get_db)):
    return await service.get_hsn_analytics(db)
