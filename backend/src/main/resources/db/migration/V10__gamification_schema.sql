-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — V10 Migration: Achievements & Gamification
-- ═══════════════════════════════════════════════════════════════

-- ─── BADGE DEFINITIONS ───────────────────────────────────────────────────────
CREATE TABLE badges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon        VARCHAR(10) NOT NULL,  -- emoji
    category    VARCHAR(30) NOT NULL CHECK (category IN (
                  'FOCUS','STREAK','USAGE','REDUCTION','MILESTONE','SPECIAL'
                )),
    tier        VARCHAR(20) NOT NULL DEFAULT 'BRONZE'
                  CHECK (tier IN ('BRONZE','SILVER','GOLD','PLATINUM')),
    -- Criteria stored as JSONB
    -- e.g. {"type":"focus_sessions","threshold":5}
    -- e.g. {"type":"streak_days","threshold":7}
    -- e.g. {"type":"gaming_reduction","threshold":50}
    criteria    JSONB NOT NULL,
    xp_reward   INTEGER DEFAULT 50,
    is_active   BOOLEAN DEFAULT TRUE
);

-- ─── EARNED BADGES ───────────────────────────────────────────────────────────
CREATE TABLE student_badges (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id   UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    badge_id    UUID NOT NULL REFERENCES badges(id),
    earned_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(device_id, badge_id)  -- can't earn same badge twice
);

CREATE INDEX idx_student_badges_device ON student_badges(device_id, earned_at DESC);
CREATE INDEX idx_student_badges_tenant ON student_badges(tenant_id);

-- ─── SEED BADGE DEFINITIONS ──────────────────────────────────────────────────
INSERT INTO badges (code, name, description, icon, category, tier, criteria, xp_reward)
VALUES
  -- FOCUS badges
  ('first_focus',      'First Focus',       'Complete your first focus session',
   '🎯', 'FOCUS', 'BRONZE', '{"type":"focus_sessions_total","threshold":1}', 25),

  ('focus_5',          'Getting Focused',   'Complete 5 focus sessions',
   '🔥', 'FOCUS', 'BRONZE', '{"type":"focus_sessions_total","threshold":5}', 50),

  ('focus_25',         'Focus Master',      'Complete 25 focus sessions',
   '⚡', 'FOCUS', 'SILVER', '{"type":"focus_sessions_total","threshold":25}', 150),

  ('focus_100',        'Focus Legend',      'Complete 100 focus sessions',
   '👑', 'FOCUS', 'GOLD',   '{"type":"focus_sessions_total","threshold":100}', 500),

  ('deep_work',        'Deep Work',         'Complete a 60-minute focus session',
   '🧠', 'FOCUS', 'SILVER', '{"type":"long_session_minutes","threshold":60}', 100),

  -- STREAK badges
  ('streak_3',         '3-Day Streak',      'Use focus mode 3 days in a row',
   '📅', 'STREAK', 'BRONZE', '{"type":"streak_days","threshold":3}', 75),

  ('streak_7',         'Week Warrior',      'Maintain a 7-day focus streak',
   '🗓️', 'STREAK', 'SILVER', '{"type":"streak_days","threshold":7}', 200),

  ('streak_30',        'Monthly Champion',  'Maintain a 30-day focus streak',
   '🏆', 'STREAK', 'GOLD',   '{"type":"streak_days","threshold":30}', 1000),

  -- REDUCTION badges
  ('gaming_reducer',   'Gamer Reformed',    'Reduce gaming time by 50% vs last week',
   '🎮', 'REDUCTION', 'SILVER', '{"type":"gaming_reduction_percent","threshold":50}', 150),

  ('screen_balance',   'Screen Balance',    'Keep total screen time under 4 hours for 3 days',
   '⚖️', 'REDUCTION', 'BRONZE', '{"type":"healthy_screen_days","threshold":3}', 100),

  -- USAGE badges
  ('study_hour',       'Study Hour',        'Spend 1 hour on education apps in a day',
   '📚', 'USAGE', 'BRONZE', '{"type":"education_hours_day","threshold":1}', 50),

  ('study_champion',   'Study Champion',    'Spend 3+ hours on education apps in a day',
   '🎓', 'USAGE', 'SILVER', '{"type":"education_hours_day","threshold":3}', 200),

  -- MILESTONE badges
  ('early_bird',       'Early Bird',        'Start a focus session before 8 AM',
   '🌅', 'MILESTONE', 'BRONZE', '{"type":"early_morning_focus","threshold":1}', 75),

  ('night_owl_free',   'Night Owl Free',    '7 days with no device usage after 10 PM',
   '🌙', 'MILESTONE', 'SILVER', '{"type":"no_late_night_days","threshold":7}', 250),

  ('century',          'Century',           'Earn 100 XP total',
   '💯', 'MILESTONE', 'BRONZE', '{"type":"total_xp","threshold":100}', 25),

  ('xp_500',           'XP Hoarder',        'Earn 500 XP total',
   '💎', 'MILESTONE', 'GOLD',   '{"type":"total_xp","threshold":500}', 100);
