-- ═══════════════════════════════════════════════════════════════════
-- KAVACH AI — V25 Migration: Unified Rule Enforcement Engine
-- Adds:
--   • daily_app_usage      — cross-platform usage accumulator
--   • time_limit_rules     — soft daily limits per category/app
--   • enforcement_state    — per-device rules version + focus state
--   • platform column      — on enforcement_events for Android events
-- ═══════════════════════════════════════════════════════════════════

-- ── Daily app usage accumulator (updated by both desktop + Android) ──────────
CREATE TABLE IF NOT EXISTS daily_app_usage (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID        NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usage_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
    app_category    VARCHAR(50) NOT NULL,      -- GAMING, SOCIAL, ENTERTAINMENT, etc.
    package_name    VARCHAR(255),              -- specific app (optional)
    duration_seconds INTEGER    NOT NULL DEFAULT 0,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (device_id, usage_date, app_category, COALESCE(package_name, ''))
);

CREATE INDEX idx_daily_usage_device_date
    ON daily_app_usage(device_id, usage_date DESC);

CREATE INDEX idx_daily_usage_tenant_date
    ON daily_app_usage(tenant_id, usage_date DESC);

-- ── Time limit rules (soft daily limits — distinct from block rules) ──────────
CREATE TABLE IF NOT EXISTS time_limit_rules (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id            UUID        REFERENCES devices(id) ON DELETE CASCADE,  -- NULL = all devices
    app_category         VARCHAR(50),           -- GAMING, SOCIAL, ENTERTAINMENT, EDUCATION
    package_name         VARCHAR(255),          -- specific app (overrides category if set)
    daily_limit_seconds  INTEGER     NOT NULL,
    warning_at_seconds   INTEGER,               -- warn at this usage level (e.g. 80% of limit)
    schedule_days        INTEGER[],             -- days this applies (0=Sun…6=Sat), NULL=all
    schedule_start       TIME,                  -- enforce only within this window
    schedule_end         TIME,
    active               BOOLEAN     NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_limit_rules_device
    ON time_limit_rules(tenant_id, device_id, active);

-- ── Per-device enforcement state (rules version + focus cache) ────────────────
CREATE TABLE IF NOT EXISTS enforcement_state (
    device_id           UUID        PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    rules_version       INTEGER     NOT NULL DEFAULT 0,
    focus_mode_active   BOOLEAN     NOT NULL DEFAULT false,
    focus_session_id    UUID        REFERENCES focus_sessions(id) ON DELETE SET NULL,
    focus_ends_at       TIMESTAMPTZ,
    last_synced         TIMESTAMPTZ
);

-- ── Add platform column to enforcement_events ────────────────────────────────
ALTER TABLE enforcement_events
    ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'WINDOWS';

-- ── Relax action CHECK on enforcement_events to allow new actions ─────────────
ALTER TABLE enforcement_events
    DROP CONSTRAINT IF EXISTS enforcement_events_action_check;

ALTER TABLE enforcement_events
    ADD CONSTRAINT enforcement_events_action_check
    CHECK (action IN (
        'BLOCKED',
        'OVERLAY_SHOWN',
        'URL_BLOCKED',
        'KILL_TOOL_DETECTED',
        'APP_BLOCKED',
        'FOCUS_VIOLATION',
        'TIME_LIMIT_REACHED'
    ));
