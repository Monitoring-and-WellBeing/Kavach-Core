-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — V9 Migration: AI Insights Schema
-- ═══════════════════════════════════════════════════════════════

-- Drop old ai_insights table if it exists (from V3)
DROP TABLE IF EXISTS ai_insights CASCADE;

-- ─── AI INSIGHTS ─────────────────────────────────────────────────────────────
CREATE TABLE ai_insights (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id       UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    -- Raw JSON from Claude
    raw_response    TEXT,
    -- Parsed fields
    weekly_summary  TEXT,
    risk_level      VARCHAR(20) DEFAULT 'LOW'
                      CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    risk_tags       TEXT[],          -- e.g. {"late_night","excessive_gaming"}
    positive_tags   TEXT[],          -- e.g. {"study_streak","focus_sessions"}
    insights        JSONB,           -- array of insight cards
    generated_at    TIMESTAMP DEFAULT NOW(),
    data_from       TIMESTAMP,       -- start of data window used
    data_to         TIMESTAMP        -- end of data window used
);

CREATE INDEX idx_insights_device ON ai_insights(device_id, generated_at DESC);
CREATE INDEX idx_insights_tenant ON ai_insights(tenant_id, generated_at DESC);
