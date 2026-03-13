-- ═══════════════════════════════════════════════════════════════════════════
-- KAVACH AI — V19 Migration: AI Study Buddy + Mood Check-ins
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Student AI Usage (topic log — NOT raw conversations) ──────────────────
CREATE TABLE IF NOT EXISTS student_ai_usage (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    topic           VARCHAR(100),                   -- e.g. "Math/Fractions"
    question_hash   VARCHAR(64),                    -- SHA-256 of message — dedup only
    used_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_student_date
    ON student_ai_usage(student_id, used_at DESC);

CREATE INDEX idx_ai_usage_tenant_date
    ON student_ai_usage(tenant_id, used_at DESC);

-- ── Mood Check-ins ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_checkins (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    device_id       UUID        NOT NULL REFERENCES devices(id)  ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
    mood            INTEGER     NOT NULL CHECK (mood BETWEEN 1 AND 5),
    mood_label      VARCHAR(20),    -- 'great','good','okay','tired','stressed'
    note            TEXT,
    checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mood_student
    ON mood_checkins(student_id, checked_in_at DESC);

CREATE INDEX idx_mood_device
    ON mood_checkins(device_id, checked_in_at DESC);

-- ── Daily Motivation Cache ───────────────────────────────────────────────
-- Cache one AI motivation message per device per day, no extra cost
CREATE TABLE IF NOT EXISTS daily_motivation (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID        NOT NULL REFERENCES devices(id)  ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
    message         TEXT        NOT NULL,
    cache_date      DATE        NOT NULL DEFAULT CURRENT_DATE
);

CREATE UNIQUE INDEX idx_daily_motivation_device_date
    ON daily_motivation(device_id, cache_date);
