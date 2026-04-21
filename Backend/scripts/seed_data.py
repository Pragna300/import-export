import asyncio
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from database import async_session, engine, Base
from models.models import CountryTaxRule, HSNRateRule, RiskRule, HSNMaster, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed():
    async with engine.begin() as conn:
        # Ensure tables exist
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # 1. Seed Users
        # NOTE: Passwords here are for development seeding only.
        # In a production environment, users should be invited or register themselves.
        users_to_seed = [
            {
                "name": "System Admin",
                "email": "admin@shnoor.ai",
                "password": "admin123",
                "role": "admin"
            },
            {
                "name": "Praneeth",
                "email": "praneeth@shnoor.ai",
                "password": "password123",
                "role": "analyst"
            }
        ]

        from sqlalchemy import select
        for user_data in users_to_seed:
            user_stmt = select(User).where(User.email == user_data["email"])
            user_res = await db.execute(user_stmt)
            if not user_res.scalars().first():
                new_user = User(
                    name=user_data["name"],
                    email=user_data["email"],
                    password_hash=pwd_context.hash(user_data["password"]),
                    role=user_data["role"]
                )
                db.add(new_user)
                print(f"Added user: {user_data['email']} ({user_data['role']})")

        # 2. Seed Country Tax Rules
        countries = [
            ("india", 18.0, 250.0),
            ("usa", 7.5, 175.0),
            ("germany", 19.0, 220.0),
            ("uae", 5.0, 150.0),
            ("china", 13.0, 300.0)
        ]
        for code, rate, other in countries:
            stmt = select(CountryTaxRule).where(CountryTaxRule.country_code == code)
            res = await db.execute(stmt)
            if not res.scalars().first():
                db.add(CountryTaxRule(country_code=code, tax_rate=Decimal(str(rate)), other_charges=Decimal(str(other))))
        print("Seeded Country Tax Rules.")

        # 3. Seed HSN Rate Rules
        hsn_rates = [
            ("84", 15.0), # Nuclear reactors, boilers, machinery
            ("85", 18.0), # Electrical machinery
            ("73", 12.5), # Articles of iron or steel
            ("30", 5.0),  # Pharmaceutical products
            ("90", 20.0)  # Optical, medical instruments
        ]
        for prefix, rate in hsn_rates:
            stmt = select(HSNRateRule).where(HSNRateRule.hsn_prefix == prefix)
            res = await db.execute(stmt)
            if not res.scalars().first():
                db.add(HSNRateRule(hsn_prefix=prefix, duty_rate=Decimal(str(rate))))
        print("Seeded HSN Rate Rules.")

        # 4. Seed Risk Rules
        risk_rules = [
            ("country", "afghanistan", "High", 45.0),
            ("country", "iran", "High", 45.0),
            ("country", "russia", "Medium", 25.0),
            ("hsn", "93", "High", 25.0), # Weapons
            ("hsn", "36", "High", 25.0), # Explosives
        ]
        for rtype, rval, rlvl, impact in risk_rules:
            stmt = select(RiskRule).where(RiskRule.entity_type == rtype, RiskRule.entity_value == rval)
            res = await db.execute(stmt)
            if not res.scalars().first():
                db.add(RiskRule(entity_type=rtype, entity_value=rval, risk_level=rlvl, score_impact=Decimal(str(impact))))
        print("Seeded Risk Rules.")

        # 5. Seed HSN Master
        hsn_master = [
            ("841459", "Electric Fans", "Electronics", 15.0),
            ("851713", "Smartphones", "Telecommunications", 18.0),
            ("300490", "Medicines", "Healthcare", 5.0),
            ("732690", "Steel Brackets", "Hardware", 12.5)
        ]
        for code, desc, cat, rate in hsn_master:
            stmt = select(HSNMaster).where(HSNMaster.hsn_code == code)
            res = await db.execute(stmt)
            if not res.scalars().first():
                db.add(HSNMaster(hsn_code=code, description=desc, category=cat, base_duty_rate=Decimal(str(rate))))
        print("Seeded HSN Master.")

        await db.commit()
        print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
