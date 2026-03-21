-- ================================================================
-- KAVACH AI -- Auth System Migration
-- ================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Update tenants table to match auth requirements
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Guard: add check_tenant_type only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'tenants' AND constraint_name = 'check_tenant_type'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT check_tenant_type
      CHECK (type IN ('SCHOOL','COACHING','TRAINING','CORPORATE'));
  END IF;
END $$;

-- Update users table to match auth requirements
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Guard: add check_user_role only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'users' AND constraint_name = 'check_user_role'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT check_user_role CHECK (role IN (
        'SUPER_ADMIN','INSTITUTE_ADMIN','IT_HEAD','PRINCIPAL','PARENT','STUDENT'
      ));
  END IF;
END $$;

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(500) UNIQUE NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    revoked         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes for refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

-- Update existing users to be active and verified
UPDATE users SET is_active = TRUE, email_verified = TRUE WHERE is_active IS NULL;
