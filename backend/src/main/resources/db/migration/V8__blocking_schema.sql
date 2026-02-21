-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — V8 Migration: App & Site Blocking Schema
-- ═══════════════════════════════════════════════════════════════

-- ─── BLOCK RULES ─────────────────────────────────────────────────────────────
CREATE TABLE block_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(255) NOT NULL,
    rule_type       VARCHAR(30) NOT NULL CHECK (rule_type IN (
                      'APP',        -- block specific app by process name
                      'CATEGORY',   -- block entire category (GAMING, SOCIAL_MEDIA, etc.)
                      'WEBSITE',    -- block domain (future — browser extension)
                      'KEYWORD'     -- block window title containing keyword
                    )),
    -- target: process name / category / domain / keyword
    target          VARCHAR(255) NOT NULL,
    -- Optional: applies to specific device or all devices
    applies_to      VARCHAR(20) NOT NULL DEFAULT 'ALL_DEVICES'
                      CHECK (applies_to IN ('ALL_DEVICES','SPECIFIC_DEVICE')),
    device_id       UUID REFERENCES devices(id) ON DELETE SET NULL,
    -- Schedule: null = always blocked, otherwise block only during window
    schedule_enabled BOOLEAN DEFAULT FALSE,
    schedule_days    VARCHAR(50) DEFAULT 'MON,TUE,WED,THU,FRI,SAT,SUN',
    schedule_start   TIME,        -- e.g. 09:00
    schedule_end     TIME,        -- e.g. 17:00
    -- Behaviour when blocked
    show_message     BOOLEAN DEFAULT TRUE,
    block_message    VARCHAR(500) DEFAULT 'This app has been blocked by your parent/institute.',
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

-- ─── BLOCKING VIOLATIONS ─────────────────────────────────────────────────────
-- Every time the agent blocks an app, it logs here
CREATE TABLE blocking_violations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id       UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    rule_id         UUID REFERENCES block_rules(id) ON DELETE SET NULL,
    app_name        VARCHAR(255) NOT NULL,
    process_name    VARCHAR(255),
    window_title    VARCHAR(500),
    category        VARCHAR(50),
    attempted_at    TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_block_rules_tenant   ON block_rules(tenant_id, is_active);
CREATE INDEX idx_block_rules_device   ON block_rules(device_id);
CREATE INDEX idx_violations_device    ON blocking_violations(device_id, attempted_at DESC);
CREATE INDEX idx_violations_tenant    ON blocking_violations(tenant_id, attempted_at DESC);

-- ─── SEED DEMO BLOCK RULES ───────────────────────────────────────────────────
-- Using actual tenant and user IDs from seed data
INSERT INTO block_rules (tenant_id, created_by, name, rule_type, target, applies_to, show_message)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Block all gaming apps',
   'CATEGORY', 'GAMING', 'ALL_DEVICES', TRUE),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Block Free Fire',
   'APP', 'freefire.exe', 'ALL_DEVICES', TRUE),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Block social media during study hours',
   'CATEGORY', 'SOCIAL_MEDIA', 'ALL_DEVICES', TRUE),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Block YouTube (scheduled 9AM-5PM)',
   'APP', 'chrome.exe', 'ALL_DEVICES', TRUE);

-- Update last rule with schedule
UPDATE block_rules
SET schedule_enabled = TRUE,
    schedule_days = 'MON,TUE,WED,THU,FRI',
    schedule_start = '09:00',
    schedule_end = '17:00'
WHERE name = 'Block YouTube (scheduled 9AM-5PM)'
  AND tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
