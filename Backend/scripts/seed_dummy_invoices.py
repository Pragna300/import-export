import asyncio
import os
import random
import sys
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Base, async_session, engine
from models.models import Document, Shipment


PRODUCTS = [
    "Industrial Solar Panel",
    "Coffee Beans Premium Grade",
    "Electronic Control Unit",
    "Medical Diagnostic Kit",
    "Cotton Textile Rolls",
    "Smart Home Sensor Pack",
    "Ceramic Tile Bundle",
    "Automotive Brake Assembly",
]

COUNTRIES = ["India", "China", "Germany", "USA", "Brazil", "Indonesia", "UAE", "Japan"]
CURRENCIES = ["USD", "INR", "EUR"]
STATUSES = ["Completed", "Processing", "Failed"]


def build_extracted_data(index: int, status: str, shipment_code: str):
    product_name = random.choice(PRODUCTS)
    currency = random.choice(CURRENCIES)
    quantity = random.randint(10, 500)
    price = round(random.uniform(12, 900), 2)
    hsn_code = f"{random.randint(10, 99)}{random.randint(1000, 9999)}"
    duty_amount = round(quantity * price * random.uniform(0.05, 0.2), 2)
    tax_amount = round(quantity * price * random.uniform(0.08, 0.18), 2)
    other_charges = round(random.uniform(20, 350), 2)
    total_cost = round((quantity * price) + duty_amount + tax_amount + other_charges, 2)
    risk_score = round(random.uniform(8, 85), 2)

    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 35:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    extracted_data = {
        "doc_type": "Invoice",
        "shipment_code": shipment_code,
        "product_name": product_name,
        "hsn_code": hsn_code,
        "quantity": quantity,
        "price": price,
        "country": random.choice(COUNTRIES),
        "destination_country": random.choice(COUNTRIES),
        "currency": currency,
        "description": f"Dummy invoice row {index} for export validation.",
    }

    if status == "Completed":
        extracted_data["hsn_result"] = {
            "hsn_code": hsn_code,
            "confidence_score": round(random.uniform(70, 99), 2),
            "model_version": "seed-generator-v1",
        }
        extracted_data["duty_result"] = {
            "shipment_id": None,
            "hsn_code": hsn_code,
            "currency": currency,
            "assessable_value": round(quantity * price, 2),
            "duty_rate": round(random.uniform(5, 18), 2),
            "tax_rate": round(random.uniform(8, 18), 2),
            "duty_amount": duty_amount,
            "tax_amount": tax_amount,
            "other_charges": other_charges,
            "total_cost": total_cost,
            "rule_source": "dummy-seed-rulebook",
        }
        extracted_data["risk_result"] = {
            "shipment_id": None,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reason": "Synthetic test sample for invoice export.",
            "model_version": "seed-risk-v1",
        }
    elif status == "Failed":
        extracted_data = {
            "error": "Synthetic processing error for export testing.",
            "raw": extracted_data,
        }
    else:
        extracted_data["status"] = "Analyzing Content..."

    return extracted_data


async def seed_dummy_invoices(total_count: int = 100):
    print(f"Starting dummy invoice seeding for {total_count} rows...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        existing_count_result = await db.execute(select(func.count(Document.id)))
        existing_count = existing_count_result.scalar_one()
        seed_base = existing_count + 1

        created_documents = 0
        for offset in range(total_count):
            serial = seed_base + offset
            shipment_code = f"DUMMY-INV-{serial:05d}"
            quantity = random.randint(10, 500)
            unit_price = round(random.uniform(12, 900), 2)

            shipment = Shipment(
                shipment_code=shipment_code,
                product_name=random.choice(PRODUCTS),
                description=f"Auto-generated shipment for invoice seed #{serial}",
                quantity=quantity,
                unit_price=Decimal(str(unit_price)),
                total_value=Decimal(str(round(quantity * unit_price, 2))),
                currency=random.choice(CURRENCIES),
                origin_country=random.choice(COUNTRIES),
                destination_country=random.choice(COUNTRIES),
                status="Pending Review",
            )
            db.add(shipment)
            await db.flush()

            status = random.choice(STATUSES)
            extracted_data = build_extracted_data(serial, status, shipment_code)

            if "duty_result" in extracted_data:
                extracted_data["duty_result"]["shipment_id"] = shipment.id
            if "risk_result" in extracted_data:
                extracted_data["risk_result"]["shipment_id"] = shipment.id

            document = Document(
                shipment_id=shipment.id,
                file_url=f"document_uploads/dummy_invoice_{serial:05d}.pdf",
                doc_type="Invoice",
                status=status,
                extracted_data=extracted_data,
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 120)),
            )
            db.add(document)
            created_documents += 1

        await db.commit()
        print(f"Done. Inserted {created_documents} dummy invoice documents.")


if __name__ == "__main__":
    random.seed(42)
    asyncio.run(seed_dummy_invoices(100))
