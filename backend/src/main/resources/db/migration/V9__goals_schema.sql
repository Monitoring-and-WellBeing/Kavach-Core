-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — V9 Migration: Goals System Schema
-- ═══════════════════════════════════════════════════════════════

-- ─── GOALS ───────────────────────────────────────────────────────────────────
CREATE TABLE goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id       UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(255) NOT NULL,
    goal_type       VARCHAR(30) NOT NULL CHECK (goal_type IN (
                      'FOCUS_MINUTES', 'SCREEN_TIME_LIMIT', 'EDUCATION_MINUTES',
                      'GAMING_LIMIT',  'FOCUS_SESSIONS',    'NO_LATE_NIGHT'
                    )),
    period          VARCHAR(10) NOT NULL DEFAULT 'DAILY'
                      CHECK (period IN ('DAILY','WEEKLY')),
    target_value    INTEGER NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── GOAL PROGRESS ───────────────────────────────────────────────────────────
CREATE TABLE goal_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id         UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    device_id       UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    period_date     DATE NOT NULL,
    current_value   INTEGER DEFAULT 0,
    target_value    INTEGER NOT NULL,
    met             BOOLEAN DEFAULT FALSE,
    evaluated_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(goal_id, period_date)
);

CREATE INDEX idx_goals_device    ON goals(device_id, is_active);
CREATE INDEX idx_goals_tenant    ON goals(tenant_id);
CREATE INDEX idx_progress_goal   ON goal_progress(goal_id, period_date DESC);
CREATE INDEX idx_progress_device ON goal_progress(device_id, period_date DESC);

-- ─── SEED DEMO GOALS ─────────────────────────────────────────────────────────
INSERT INTO goals (tenant_id, device_id, created_by, title, goal_type, period, target_value)
VALUES
  ('11111111-1111-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Daily Focus Goal',   'FOCUS_MINUTES',     'DAILY', 45),
  ('11111111-1111-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Screen Time Limit',  'SCREEN_TIME_LIMIT', 'DAILY', 240),
  ('11111111-1111-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Study Time Goal',    'EDUCATION_MINUTES', 'DAILY', 60),
  ('11111111-1111-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Gaming Limit',       'GAMING_LIMIT',      'DAILY', 60);
