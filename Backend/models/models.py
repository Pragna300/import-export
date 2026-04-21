from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base # Assuming your declarative_base() is in database.py

# ---------------- USERS ----------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(150), unique=True, index=True)
    password_hash = Column(Text)
    role = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationship to Shipments
    shipments = relationship("Shipment", back_populates="creator")


# ---------------- SHIPMENTS (CORE) ----------------
class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    shipment_code = Column(String(100), unique=True, index=True)
    product_name = Column(Text)
    description = Column(Text)
    quantity = Column(Integer)
    unit_price = Column(Numeric)
    total_value = Column(Numeric)
    currency = Column(String(10))
    origin_country = Column(String(50))
    destination_country = Column(String(50))
    status = Column(String(50))
    current_location = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships to other modules
    creator = relationship("User", back_populates="shipments")
    documents = relationship("Document", back_populates="shipment", cascade="all, delete-orphan")
    tracking = relationship("ShipmentTracking", back_populates="shipment", cascade="all, delete-orphan")
    hsn_classification = relationship("HSNClassification", back_populates="shipment", uselist=False, cascade="all, delete-orphan")
    duty = relationship("Duty", back_populates="shipment", uselist=False, cascade="all, delete-orphan")
    risk_assessment = relationship("RiskAssessment", back_populates="shipment", uselist=False, cascade="all, delete-orphan")


# ---------------- DOCUMENTS ----------------
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"))
    file_url = Column(Text)
    doc_type = Column(String(50))
    status = Column(String(50))
    extracted_data = Column(JSONB) # Using Postgres specific JSONB for better performance
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationship back to Shipment
    shipment = relationship("Shipment", back_populates="documents")


# ---------------- TRACKING ----------------
class ShipmentTracking(Base):
    __tablename__ = "shipment_tracking"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"))
    status = Column(String(50))
    location = Column(Text)
    remarks = Column(Text)
    timestamp = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationship back to Shipment
    shipment = relationship("Shipment", back_populates="tracking")


# ---------------- HSN ----------------
class HSNClassification(Base):
    __tablename__ = "hsn_classifications"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"))
    product_name = Column(Text)
    hsn_code = Column(String(100))
    confidence_score = Column(Numeric)
    model_version = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationship back to Shipment
    shipment = relationship("Shipment", back_populates="hsn_classification")


# ---------------- DUTY ----------------
class Duty(Base):
    __tablename__ = "duties"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"))
    hsn_code = Column(String(100))
    duty_amount = Column(Numeric)
    tax_amount = Column(Numeric)
    other_charges = Column(Numeric)
    total_cost = Column(Numeric)
    currency = Column(String(10))
    calculated_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationship back to Shipment
    shipment = relationship("Shipment", back_populates="duty")


# ---------------- RISK ----------------
class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"))
    risk_score = Column(Numeric)
    risk_level = Column(String(50))
    reason = Column(Text)
    model_version = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationship back to Shipment
    shipment = relationship("Shipment", back_populates="risk_assessment")


# ---------------- CONFIGURATION / RULES (DYNAMISM) ----------------
class CountryTaxRule(Base):
    __tablename__ = "country_tax_rules"

    id = Column(Integer, primary_key=True, index=True)
    country_code = Column(String(50), unique=True, index=True) # e.g. "india", "usa"
    tax_rate = Column(Numeric)
    other_charges = Column(Numeric)
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


class HSNRateRule(Base):
    __tablename__ = "hsn_rate_rules"

    id = Column(Integer, primary_key=True, index=True)
    hsn_prefix = Column(String(10), unique=True, index=True) # e.g. "84", "85"
    duty_rate = Column(Numeric)
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


class RiskRule(Base):
    __tablename__ = "risk_rules"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50)) # "country" or "hsn"
    entity_value = Column(String(100)) # e.g. "afghanistan" or "93"
    risk_level = Column(String(20)) # "High", "Medium", "Low"
    score_impact = Column(Numeric)
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


class HSNMaster(Base):
    __tablename__ = "hsn_master"

    id = Column(Integer, primary_key=True, index=True)
    hsn_code = Column(String(20), unique=True, index=True)
    description = Column(Text)
    category = Column(String(100))
    base_duty_rate = Column(Numeric)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
