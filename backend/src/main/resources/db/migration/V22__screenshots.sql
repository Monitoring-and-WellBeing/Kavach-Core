-- =====================================================================
-- KAVACH AI -- V22 Migration: Screenshots + Screenshot Settings
-- Stores evidence screenshots (on rule violation or periodic) in
-- Cloudflare R2.  Table only holds metadata; binary lives in R2.
-- =====================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'screenshot_trigger') THEN
    CREATE TYPE screenshot_trigger AS ENUM ('VIOLATION', 'PERIODIC');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS screenshots (
    id              UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID               NOT NULL REFERENCES devices(id)  ON DELETE CASCADE,
    tenant_id       UUID               NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
    r2_key          VARCHAR(500)       NOT NULL,        -- storage path in R2 bucket
    trigger_type    screenshot_trigger NOT NULL,
    rule_id         UUID               REFERENCES block_rules(id) ON DELETE SET NULL,
    app_name        VARCHAR(255),                       -- active app when captured
    file_size_kb    INTEGER,
    captured_at     TIMESTAMPTZ        NOT NULL,
    created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- Dashboard queries: "screenshots for device X on date Y, newest first"
CREATE INDEX IF NOT EXISTS idx_screenshots_device_date
    ON screenshots(device_id, captured_at DESC);

-- Tenant-level queries
CREATE INDEX IF NOT EXISTS idx_screenshots_tenant
    ON screenshots(tenant_id, captured_at DESC);

-- Screenshot settings per tenant ------------------------------------------
-- OFF by default -- parent must explicitly enable (opt-in privacy model)
CREATE TABLE IF NOT EXISTS screenshot_settings (
    tenant_id               UUID        PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    enabled                 BOOLEAN     NOT NULL DEFAULT false,
    periodic_enabled        BOOLEAN     NOT NULL DEFAULT false,
    periodic_interval_min   INTEGER     NOT NULL DEFAULT 5,
    violation_enabled       BOOLEAN     NOT NULL DEFAULT true,
    school_hours_only       BOOLEAN     NOT NULL DEFAULT true,
    school_start            TIME        NOT NULL DEFAULT '08:00',
    school_end              TIME        NOT NULL DEFAULT '16:00',
    retention_days          INTEGER     NOT NULL DEFAULT 7,
    student_notified        BOOLEAN     NOT NULL DEFAULT false,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
