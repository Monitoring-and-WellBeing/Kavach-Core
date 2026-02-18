-- PostgreSQL initialization script
-- The actual schema is managed by Flyway migrations in the Spring Boot app
-- This file runs when the container first starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kavach_db TO kavach;
