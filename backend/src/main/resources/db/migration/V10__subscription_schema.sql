-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — V10 Migration: Subscription & Plan Management
-- ═══════════════════════════════════════════════════════════════

-- ─── DROP OLD SUBSCRIPTIONS TABLE ─────────────────────────────
DROP TABLE IF EXISTS subscriptions CASCADE;

-- ─── PLAN TYPE ENUM ───────────────────────────────────────────
CREATE TYPE plan_type AS ENUM ('B2C', 'B2B');

-- ─── PLANS ─────────────────────────────────────────────────────
CREATE TABLE plans (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code             VARCHAR(20) UNIQUE NOT NULL,   -- BASIC, STANDARD, INSTITUTE
    name             VARCHAR(100) NOT NULL,
    plan_type        plan_type NOT NULL DEFAULT 'B2C',
    price_flat       INTEGER NOT NULL,              -- flat monthly price in paise
                                                    -- ₹149 = 14900, ₹299 = 29900, ₹3500 = 350000
    max_devices      INTEGER NOT NULL DEFAULT 3,    -- -1 = unlimited
    features         TEXT[] NOT NULL,
    is_active        BOOLEAN DEFAULT TRUE
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id              UUID NOT NULL REFERENCES plans(id),
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                           CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED','TRIAL')),
    trial_ends_at        TIMESTAMP,
    current_period_start TIMESTAMP DEFAULT NOW(),
    current_period_end   TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
    device_count         INTEGER DEFAULT 0,         -- cached, synced on each API call
    razorpay_customer_id VARCHAR(100),              -- stored after first payment
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);

-- ─── PAYMENT ORDERS ───────────────────────────────────────────
-- One row per Razorpay order. Status transitions: CREATED → PAID / FAILED.
CREATE TABLE payment_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id             UUID NOT NULL REFERENCES plans(id),
    razorpay_order_id   VARCHAR(100) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(100),               -- filled after payment success
    razorpay_signature  VARCHAR(255),               -- filled after verification
    amount              INTEGER NOT NULL,            -- paise (flat plan price)
    currency            VARCHAR(10) DEFAULT 'INR',
    status              VARCHAR(20) DEFAULT 'CREATED'
                          CHECK (status IN ('CREATED','PAID','FAILED','REFUNDED')),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_orders_tenant    ON payment_orders(tenant_id);
CREATE INDEX idx_payment_orders_razorpay  ON payment_orders(razorpay_order_id);

-- ─── SEED PLANS ───────────────────────────────────────────────
INSERT INTO plans (code, name, plan_type, price_flat, max_devices, features) VALUES
  ('BASIC', 'Basic', 'B2C', 14900, 3,
   ARRAY['device_monitoring','app_blocking','alerts','focus_mode','parent_dashboard']),

  ('STANDARD', 'Standard', 'B2C', 29900, 4,
   ARRAY['device_monitoring','app_blocking','alerts','focus_mode','parent_dashboard',
         'ai_insights','goals','achievements','reports']),

  ('INSTITUTE', 'Institute', 'B2B', 350000, 75,
   ARRAY['device_monitoring','app_blocking','alerts','focus_mode','parent_dashboard',
         'ai_insights','goals','achievements','reports',
         'institute_dashboard','priority_support','unlimited_history']);

-- ─── SEED DEMO SUBSCRIPTION (30-day trial on STANDARD for demo tenant) ───────
-- Using tenant '11111111-1111-1111-1111-111111111111' from V1__auth_schema
INSERT INTO subscriptions (tenant_id, plan_id, status, trial_ends_at,
  current_period_end, device_count)
SELECT
  '11111111-1111-1111-1111-111111111111',
  p.id, 'TRIAL',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '30 days',
  2
FROM plans p WHERE p.code = 'STANDARD'
ON CONFLICT (tenant_id) DO NOTHING;
