-- ═══════════════════════════════════════════════════════════════════════════
-- KAVACH AI — V23 Migration: Daily Challenges, Mood Check-ins & Engagement
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── MOOD CHECK-INS ──────────────────────────────────────────────────────────
-- Student-submitted daily mood: 1=very bad, 2=bad, 3=neutral, 4=good, 5=great
CREATE TABLE IF NOT EXISTS mood_checkins (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID        NOT NULL REFERENCES devices(id)  ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
    mood            SMALLINT    NOT NULL CHECK (mood BETWEEN 1 AND 5),
    note            TEXT,
    checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mood_device_date ON mood_checkins(device_id, checked_in_at DESC);
CREATE INDEX idx_mood_tenant      ON mood_checkins(tenant_id, checked_in_at DESC);

-- ─── XP TRANSACTIONS ─────────────────────────────────────────────────────────
-- Tracks XP earned from challenges (supplementing badge XP)
CREATE TABLE IF NOT EXISTS xp_transactions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id   UUID        NOT NULL REFERENCES devices(id)  ON DELETE CASCADE,
    tenant_id   UUID        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
    amount      INTEGER     NOT NULL,
    reason      VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_transactions_device ON xp_transactions(device_id, created_at DESC);

-- ─── CHALLENGE TEMPLATES ─────────────────────────────────────────────────────
-- Admin-defined challenge definitions that get rotated daily
CREATE TABLE IF NOT EXISTS challenge_templates (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    description     TEXT         NOT NULL,
    challenge_type  VARCHAR(50)  NOT NULL,
        -- FOCUS_MINUTES, NO_GAMING, STUDY_BUDDY_QUESTIONS,
        -- MOOD_CHECKIN, EARLY_START, STREAK_MAINTAIN
    target_value    INTEGER      NOT NULL DEFAULT 1,
    xp_reward       INTEGER      NOT NULL DEFAULT 30,
    icon            VARCHAR(10)  DEFAULT '⚡',
    difficulty      VARCHAR(10)  DEFAULT 'EASY'
                      CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    active          BOOLEAN      NOT NULL DEFAULT true
);

-- ─── DAILY CHALLENGES ────────────────────────────────────────────────────────
-- Per-device challenges assigned each day (3 per day: 2 easy/medium + 1 hard)
CREATE TABLE IF NOT EXISTS daily_challenges (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       UUID        NOT NULL REFERENCES devices(id)  ON DELETE CASCADE,
    tenant_id       UUID        NOT NULL REFERENCES tenants(id)  ON DELETE CASCADE,
    template_id     UUID        NOT NULL REFERENCES challenge_templates(id),
    challenge_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
    target_value    INTEGER     NOT NULL,
    current_value   INTEGER     NOT NULL DEFAULT 0,
    xp_reward       INTEGER     NOT NULL,
    completed       BOOLEAN     NOT NULL DEFAULT false,
    completed_at    TIMESTAMPTZ,
    UNIQUE (device_id, template_id, challenge_date)
);

CREATE INDEX idx_challenges_device_date ON daily_challenges(device_id, challenge_date DESC);
CREATE INDEX idx_challenges_tenant_date ON daily_challenges(tenant_id, challenge_date DESC);

-- ─── STREAK RECOVERY TOKENS ──────────────────────────────────────────────────
-- Tokens earned via achievements; used to recover a broken streak
CREATE TABLE IF NOT EXISTS streak_recoveries (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id           UUID        NOT NULL UNIQUE REFERENCES devices(id) ON DELETE CASCADE,
    tokens_available    INTEGER     NOT NULL DEFAULT 0,
    last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SEED CHALLENGE TEMPLATES ────────────────────────────────────────────────
INSERT INTO challenge_templates (title, description, challenge_type, target_value, xp_reward, icon, difficulty)
VALUES
  ('Focus for 25 minutes',        'Complete one focused study session',                   'FOCUS_MINUTES',          25,  30,  '🎯', 'EASY'),
  ('Morning starter',             'Start a focus session before 10am',                    'EARLY_START',             1,  40,  '🌅', 'EASY'),
  ('Check in your mood',          'Tell us how you are feeling today',                    'MOOD_CHECKIN',            1,  10,  '😊', 'EASY'),
  ('Study for an hour',           'Complete 60 minutes of focus time',                    'FOCUS_MINUTES',          60,  60,  '📚', 'MEDIUM'),
  ('Ask Study Buddy 3 questions', 'Learn something new with AI help',                     'STUDY_BUDDY_QUESTIONS',   3,  50,  '🤖', 'MEDIUM'),
  ('Gaming-free afternoon',       'No gaming apps after school until dinner',             'NO_GAMING',               1,  80,  '🚫', 'HARD'),
  ('3-day streak',                'Maintain your focus streak for 3 days',               'STREAK_MAINTAIN',         3, 100,  '🔥', 'HARD'),
  ('Focus marathon',              'Complete 90 minutes of focused study',                 'FOCUS_MINUTES',          90,  90,  '🏃', 'HARD')
ON CONFLICT DO NOTHING;
