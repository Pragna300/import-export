-- USERS
CREATE TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(150) UNIQUE,
password_hash TEXT,
role VARCHAR(50),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SHIPMENTS (CORE)
CREATE TABLE shipments (
id SERIAL PRIMARY KEY,
shipment_code VARCHAR(50) UNIQUE,
product_name TEXT,
description TEXT,
quantity INT,
unit_price NUMERIC,
total_value NUMERIC,
currency VARCHAR(10),
origin_country VARCHAR(50),
destination_country VARCHAR(50),
status VARCHAR(50),
current_location TEXT,
created_by INT REFERENCES users(id),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DOCUMENTS
CREATE TABLE documents (
id SERIAL PRIMARY KEY,
shipment_id INT REFERENCES shipments(id),
file_url TEXT,
doc_type VARCHAR(50),
status VARCHAR(50),
extracted_data JSONB,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TRACKING
CREATE TABLE shipment_tracking (
id SERIAL PRIMARY KEY,
shipment_id INT REFERENCES shipments(id),
status VARCHAR(50),
location TEXT,
remarks TEXT,
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HSN
CREATE TABLE hsn_classifications (
id SERIAL PRIMARY KEY,
shipment_id INT REFERENCES shipments(id),
product_name TEXT,
hsn_code VARCHAR(20),
confidence_score NUMERIC,
model_version VARCHAR(20),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DUTY
CREATE TABLE duties (
id SERIAL PRIMARY KEY,
shipment_id INT REFERENCES shipments(id),
hsn_code VARCHAR(20),
duty_amount NUMERIC,
tax_amount NUMERIC,
other_charges NUMERIC,
total_cost NUMERIC,
currency VARCHAR(10),
calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RISK
CREATE TABLE risk_assessments (
id SERIAL PRIMARY KEY,
shipment_id INT REFERENCES shipments(id),
risk_score NUMERIC,
risk_level VARCHAR(20),
reason TEXT,
model_version VARCHAR(20),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);