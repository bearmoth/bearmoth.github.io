-- PostgreSQL 17 Schema for Orders Database

-- Create ENUM type for order status
CREATE TYPE order_status AS ENUM ('pending', 'shipped', 'cancelled');

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255),
    items JSONB NOT NULL,
    status order_status NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_id ON orders(customer_id);
