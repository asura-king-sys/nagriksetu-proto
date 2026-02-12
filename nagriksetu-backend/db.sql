-- 1. Create the Database
CREATE DATABASE nagriksetu;

-- 2. Connect to the database (if using psql: \c nagriksetu)

-- 3. Create the Tickets Table
CREATE TABLE civic_tickets (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    image_path TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    upvotes INTEGER DEFAULT 0,
    reopen_count INTEGER DEFAULT 0, -- Needed for the Raise Issue feature
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);