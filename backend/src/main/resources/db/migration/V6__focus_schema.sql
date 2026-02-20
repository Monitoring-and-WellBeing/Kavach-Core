-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — V6 Migration: Focus Mode Schema
-- ═══════════════════════════════════════════════════════════════

-- ─── FOCUS SESSIONS ──────────────────────────────────────────────────────────
CREATE TABLE focus_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id       UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    initiated_by    UUID REFERENCES users(id),  -- null if student self-start
    initiated_role  VARCHAR(20) NOT NULL DEFAULT 'STUDENT'
                      CHECK (initiated_role IN ('PARENT','INSTITUTE_ADMIN','STUDENT')),
    title           VARCHAR(255) DEFAULT 'Focus Session',
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    started_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    ends_at         TIMESTAMP NOT NULL,
    ended_at        TIMESTAMP,          -- actual end time (if ended early)
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED','EXPIRED')),
    -- What triggered the end
    end_reason      VARCHAR(30) CHECK (end_reason IN (
                      'COMPLETED','CANCELLED_BY_PARENT','CANCELLED_BY_STUDENT',
                      'CANCELLED_BY_ADMIN','EXPIRED','DEVICE_OFFLINE'
                    )),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── FOCUS APP WHITELIST ──────────────────────────────────────────────────────
-- Apps allowed during focus mode (per tenant)
-- During focus, ONLY whitelisted apps are allowed — everything else is blocked
CREATE TABLE focus_whitelist (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    process_name VARCHAR(255) NOT NULL,
    app_name     VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, process_name)
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_focus_device        ON focus_sessions(device_id, status);
CREATE INDEX idx_focus_tenant        ON focus_sessions(tenant_id, started_at DESC);
CREATE INDEX idx_focus_active        ON focus_sessions(status, ends_at);
CREATE INDEX idx_whitelist_tenant    ON focus_whitelist(tenant_id);

-- ─── DEFAULT WHITELIST APPS (study-safe apps) ────────────────────────────────
-- These are seeded per demo tenant
INSERT INTO focus_whitelist (tenant_id, process_name, app_name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'code.exe',         'VS Code'),
  ('11111111-1111-1111-1111-111111111111', 'notepad.exe',      'Notepad'),
  ('11111111-1111-1111-1111-111111111111', 'notepad++.exe',    'Notepad++'),
  ('11111111-1111-1111-1111-111111111111', 'winword.exe',      'Microsoft Word'),
  ('11111111-1111-1111-1111-111111111111', 'excel.exe',        'Microsoft Excel'),
  ('11111111-1111-1111-1111-111111111111', 'acrobat.exe',      'Adobe Acrobat'),
  ('11111111-1111-1111-1111-111111111111', 'sumatrapdf.exe',   'Sumatra PDF'),
  ('11111111-1111-1111-1111-111111111111', 'onenote.exe',      'OneNote'),
  ('11111111-1111-1111-1111-111111111111', 'calculator.exe',   'Calculator'),
  ('11111111-1111-1111-1111-111111111111', 'explorer.exe',     'File Explorer');

-- ─── SEED DEMO COMPLETED SESSION ─────────────────────────────────────────────
INSERT INTO focus_sessions (tenant_id, device_id, initiated_role, title, duration_minutes,
  started_at, ends_at, ended_at, status, end_reason)
VALUES
  ('11111111-1111-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'PARENT', '45-minute Study Session', 45,
   NOW() - INTERVAL '2 hours',
   NOW() - INTERVAL '75 minutes',
   NOW() - INTERVAL '75 minutes',
   'COMPLETED', 'COMPLETED'),

  ('11111111-1111-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'STUDENT', 'Pomodoro — Math', 25,
   NOW() - INTERVAL '1 hour',
   NOW() - INTERVAL '35 minutes',
   NOW() - INTERVAL '35 minutes',
   'COMPLETED', 'COMPLETED');
