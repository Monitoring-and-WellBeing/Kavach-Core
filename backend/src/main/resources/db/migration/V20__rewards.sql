-- ============================================================
-- V20 — Rewards & Redemptions System
-- ============================================================

CREATE TYPE reward_category AS ENUM (
  'SCREEN_TIME',
  'OUTING',
  'FOOD_TREAT',
  'PURCHASE',
  'PRIVILEGE',
  'CUSTOM'
);

CREATE TYPE redemption_status AS ENUM (
  'PENDING',
  'APPROVED',
  'DENIED',
  'FULFILLED'
);

CREATE TABLE IF NOT EXISTS rewards (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id),
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     reward_category NOT NULL DEFAULT 'CUSTOM',
  xp_cost      INTEGER     NOT NULL CHECK (xp_cost > 0),
  icon         VARCHAR(10) DEFAULT '🎁',
  active       BOOLEAN     NOT NULL DEFAULT true,
  created_by   UUID        NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id       UUID         NOT NULL REFERENCES rewards(id),
  device_id       UUID         NOT NULL REFERENCES devices(id),
  tenant_id       UUID         NOT NULL REFERENCES tenants(id),
  student_user_id UUID         NOT NULL REFERENCES users(id),
  xp_spent        INTEGER      NOT NULL,
  status          redemption_status NOT NULL DEFAULT 'PENDING',
  student_note    TEXT,
  parent_note     TEXT,
  requested_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  fulfilled_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rewards_tenant ON rewards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_redemptions_tenant ON reward_redemptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_redemptions_student ON reward_redemptions(student_user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_device ON reward_redemptions(device_id);

-- ── Seed predefined rewards for the demo tenant ───────────────────────────────
INSERT INTO rewards (id, tenant_id, title, description, category, xp_cost, icon, created_by)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  t.title, t.description, t.category::reward_category, t.xp_cost, t.icon,
  (SELECT id FROM users WHERE email = 'parent@demo.com' LIMIT 1)
FROM (VALUES
  ('30 min extra screen time', 'Earn extra screen time on any app',   'SCREEN_TIME', 200, '📱'),
  ('Pizza night',              'Choose your favourite pizza for dinner','FOOD_TREAT',  350, '🍕'),
  ('Park outing',              'A trip to the park or playground',    'OUTING',      400, '🌳'),
  ('Stay up 30 min late',      'On a Friday or Saturday night',       'PRIVILEGE',   300, '🌙'),
  ('Book of your choice',      'Pick any book up to ₹500',            'PURCHASE',    500, '📚'),
  ('Game of your choice',      'Pick any mobile game (parent approves)','PURCHASE',  800, '🎮')
) AS t(title, description, category, xp_cost, icon)
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'parent@demo.com')
ON CONFLICT DO NOTHING;
