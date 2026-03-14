-- ================================================================
-- KAVACH AI -- V7 Migration: Alerts System Schema
-- ================================================================

-- Drop old alerts table from V1 so this migration can rebuild it with new schema
DROP TABLE IF EXISTS alerts CASCADE;

-- ALERT RULES --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alert_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(255) NOT NULL,
    rule_type       VARCHAR(50) NOT NULL CHECK (rule_type IN (
                      'SCREEN_TIME_EXCEEDED',
                      'APP_USAGE_EXCEEDED',
                      'CATEGORY_USAGE_EXCEEDED',
                      'LATE_NIGHT_USAGE',
                      'BLOCKED_APP_ATTEMPT',
                      'FOCUS_MODE_BROKEN'
                    )),
    -- Threshold config stored as JSON
    -- e.g. {"appName":"Free Fire","thresholdMinutes":30}
    -- e.g. {"category":"GAMING","thresholdMinutes":60}
    -- e.g. {"totalMinutes":240}
    -- e.g. {"startHour":22,"endHour":6}
    config          JSONB NOT NULL DEFAULT '{}',
    applies_to      VARCHAR(20) NOT NULL DEFAULT 'ALL_DEVICES'
                      CHECK (applies_to IN ('ALL_DEVICES','SPECIFIC_DEVICE')),
    device_id       UUID REFERENCES devices(id) ON DELETE SET NULL,
    severity        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
                      CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    is_active       BOOLEAN DEFAULT TRUE,
    -- Notification channels
    notify_push     BOOLEAN DEFAULT TRUE,
    notify_email    BOOLEAN DEFAULT FALSE,
    notify_sms      BOOLEAN DEFAULT FALSE,
    -- Cooldown: don't re-alert for same rule within X minutes
    cooldown_minutes INTEGER DEFAULT 60,
    last_triggered  TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ALERTS (triggered instances) ---------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id         UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    device_id       UUID REFERENCES devices(id) ON DELETE SET NULL,
    rule_type       VARCHAR(50) NOT NULL,
    severity        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    -- Snapshot of what triggered it
    -- e.g. {"appName":"Free Fire","usageMinutes":47,"thresholdMinutes":30}
    metadata        JSONB DEFAULT '{}',
    is_read         BOOLEAN DEFAULT FALSE,
    is_dismissed    BOOLEAN DEFAULT FALSE,
    triggered_at    TIMESTAMP DEFAULT NOW()
);

-- INDEXES ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant  ON alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active  ON alert_rules(is_active, tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_tenant       ON alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read      ON alerts(tenant_id, is_read, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_device_time  ON alerts(device_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered    ON alerts(triggered_at DESC);

-- SEED DEMO RULES ----------------------------------------------------------
-- Using actual tenant and user IDs from seed data
INSERT INTO alert_rules (tenant_id, created_by, name, rule_type, config, severity, notify_push, cooldown_minutes)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Gaming > 1 hour/day',
   'CATEGORY_USAGE_EXCEEDED',
   '{"category":"GAMING","thresholdMinutes":60}',
   'HIGH', TRUE, 120),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Total screen time > 4 hours',
   'SCREEN_TIME_EXCEEDED',
   '{"totalMinutes":240}',
   'MEDIUM', TRUE, 180),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Late night usage after 10 PM',
   'LATE_NIGHT_USAGE',
   '{"startHour":22,"endHour":6}',
   'HIGH', TRUE, 60),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'YouTube > 45 minutes/day',
   'APP_USAGE_EXCEEDED',
   '{"appName":"YouTube","thresholdMinutes":45}',
   'MEDIUM', TRUE, 90);

-- SEED DEMO ALERTS ---------------------------------------------------------
INSERT INTO alerts (tenant_id, device_id, rule_type, severity, title, message, metadata, is_read, triggered_at)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd1111111-1111-1111-1111-111111111111',
   'CATEGORY_USAGE_EXCEEDED', 'HIGH',
   'Gaming limit exceeded on Lab PC - Row A1',
   'Rahul Sharma has used gaming apps for 72 minutes today, exceeding the 60 minute limit.',
   '{"appName":"Free Fire","usageMinutes":72,"thresholdMinutes":60,"deviceName":"Lab PC - Row A1"}',
   FALSE,
   NOW() - INTERVAL '2 hours'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd2222222-2222-2222-2222-222222222222',
   'LATE_NIGHT_USAGE', 'HIGH',
   'Late night usage detected',
   'Device activity detected at 11:30 PM on Lab PC - Row A2. Consider setting a bedtime rule.',
   '{"hour":23,"deviceName":"Lab PC - Row A2"}',
   FALSE,
   NOW() - INTERVAL '5 hours'),

  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'd1111111-1111-1111-1111-111111111111',
   'APP_USAGE_EXCEEDED', 'MEDIUM',
   'YouTube usage limit reached',
   'YouTube has been used for 52 minutes today, exceeding the 45 minute daily limit.',
   '{"appName":"YouTube","usageMinutes":52,"thresholdMinutes":45}',
   TRUE,
   NOW() - INTERVAL '1 day');
