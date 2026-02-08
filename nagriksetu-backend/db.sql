-- 1. Create the Database
CREATE DATABASE nagriksetu;

-- 2. Connect to the database (if using psql: \c nagriksetu)

-- 3. Create the Tickets Table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);