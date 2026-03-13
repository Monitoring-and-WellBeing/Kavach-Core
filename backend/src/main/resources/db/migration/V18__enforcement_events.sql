-- ═══════════════════════════════════════════════════════════════════
-- KAVACH AI — V18 Migration: Enforcement Events
-- Records every enforcement action taken by the desktop agent:
--   BLOCKED        → app was killed successfully
--   OVERLAY_SHOWN  → admin process could not be killed; overlay displayed
--   URL_BLOCKED    → browser tab with blocked URL was closed
--   KILL_TOOL_DETECTED → Task Manager / Process Explorer was opened
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS enforcement_events (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID        NOT NULL REFERENCES devices(id)        ON DELETE CASCADE,
    rule_id         UUID                 REFERENCES block_rules(id)    ON DELETE SET NULL,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id)        ON DELETE CASCADE,
    process_name    VARCHAR(255),
    action          VARCHAR(50) NOT NULL
                      CHECK (action IN (
                        'BLOCKED',
                        'OVERLAY_SHOWN',
                        'URL_BLOCKED',
                        'KILL_TOOL_DETECTED'
                      )),
    detail          VARCHAR(500),           -- optional free-text context
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Dashboard queries: "events for device X, newest first"
CREATE INDEX idx_enforcement_events_device
    ON enforcement_events(device_id, timestamp DESC);

-- Dashboard queries: "all events for tenant, newest first"
CREATE INDEX idx_enforcement_events_tenant
    ON enforcement_events(tenant_id, timestamp DESC);

-- Alert queries: quickly find KILL_TOOL_DETECTED events
CREATE INDEX idx_enforcement_events_action
    ON enforcement_events(action, timestamp DESC);
