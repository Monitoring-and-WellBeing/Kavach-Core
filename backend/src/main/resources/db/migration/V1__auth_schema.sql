-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — Auth System Schema (V1)
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TENANTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255) NOT NULL,
    type         VARCHAR(50) NOT NULL,
    city         VARCHAR(100),
    state        VARCHAR(100),
    admin_email  VARCHAR(255) NOT NULL,
    local_server BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    phone          VARCHAR(20),
    role           VARCHAR(50) NOT NULL,
    is_active      BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);

-- ─── REFRESH TOKENS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant  ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_user  ON refresh_tokens(user_id);

-- ─── SEED DEMO DATA ─────────────────────────────────────────────────────────
INSERT INTO tenants (id, name, type, city, state, admin_email)
VALUES ('11111111-1111-1111-1111-111111111111', 'Sunrise Academy', 'SCHOOL', 'Lucknow', 'Uttar Pradesh', 'admin@demo.com')
ON CONFLICT DO NOTHING;

-- password_hash is bcrypt of 'demo123'
INSERT INTO users (id, tenant_id, name, email, password_hash, phone, role, email_verified)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111',
   'Dr. Vikram Nair', 'admin@demo.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
   '+91 87654 32109', 'INSTITUTE_ADMIN', TRUE),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '11111111-1111-1111-1111-111111111111',
   'Meena Singh', 'parent@demo.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
   '+91 98765 43210', 'PARENT', TRUE),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   '11111111-1111-1111-1111-111111111111',
   'Rahul Sharma', 'student@demo.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
   '', 'STUDENT', TRUE)
ON CONFLICT DO NOTHING;
