-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — V6 Migration: Activity Logs Schema
-- ═══════════════════════════════════════════════════════════════

-- Drop old tables from V1 so this migration can rebuild them with new schema
DROP TABLE IF EXISTS activity_logs CASCADE;

-- ─── APP CATEGORY ENUM ───────────────────────────────────────────────────────
CREATE TYPE app_category AS ENUM (
  'EDUCATION',
  'SOCIAL_MEDIA',
  'GAMING',
  'ENTERTAINMENT',
  'PRODUCTIVITY',
  'COMMUNICATION',
  'NEWS',
  'OTHER'
);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
-- One row = one continuous app usage session
-- e.g. Chrome open from 10:00–10:23 = 1 row, duration_seconds = 1380
CREATE TABLE activity_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id        UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    app_name         VARCHAR(255) NOT NULL,
    process_name     VARCHAR(255),          -- e.g. chrome.exe
    window_title     VARCHAR(500),          -- e.g. "YouTube - Google Chrome"
    category         app_category NOT NULL DEFAULT 'OTHER',
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    started_at       TIMESTAMP NOT NULL,
    ended_at         TIMESTAMP,
    is_blocked       BOOLEAN DEFAULT FALSE,
    synced_at        TIMESTAMP DEFAULT NOW()
);

-- ─── APP CATEGORY MAPPINGS ────────────────────────────────────────────────────
-- Maps process names to categories
-- Agent uses this to tag logs before sending
CREATE TABLE app_category_map (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_name VARCHAR(255) UNIQUE NOT NULL,
    app_name     VARCHAR(255) NOT NULL,
    category     app_category NOT NULL,
    is_default   BOOLEAN DEFAULT TRUE   -- system default vs custom
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_activity_device      ON activity_logs(device_id);
CREATE INDEX idx_activity_tenant     ON activity_logs(tenant_id);
CREATE INDEX idx_activity_started_at ON activity_logs(started_at DESC);
CREATE INDEX idx_activity_category   ON activity_logs(category);
CREATE INDEX idx_activity_device_day ON activity_logs(device_id, started_at);
CREATE INDEX idx_category_map_process ON app_category_map(process_name);

-- ─── DEFAULT APP CATEGORY MAPPINGS ───────────────────────────────────────────
INSERT INTO app_category_map (process_name, app_name, category) VALUES
  -- Browsers (PRODUCTIVITY by default, overridden by window title analysis)
  ('chrome.exe',            'Google Chrome',       'PRODUCTIVITY'),
  ('firefox.exe',           'Mozilla Firefox',     'PRODUCTIVITY'),
  ('msedge.exe',            'Microsoft Edge',      'PRODUCTIVITY'),
  ('brave.exe',             'Brave Browser',       'PRODUCTIVITY'),
  ('opera.exe',             'Opera',               'PRODUCTIVITY'),

  -- Education
  ('code.exe',              'VS Code',             'EDUCATION'),
  ('devenv.exe',            'Visual Studio',       'EDUCATION'),
  ('pycharm64.exe',         'PyCharm',             'EDUCATION'),
  ('idea64.exe',            'IntelliJ IDEA',       'EDUCATION'),
  ('notepad++.exe',         'Notepad++',           'EDUCATION'),
  ('eclipse.exe',           'Eclipse',             'EDUCATION'),
  ('winword.exe',           'Microsoft Word',      'EDUCATION'),
  ('powerpnt.exe',          'PowerPoint',          'EDUCATION'),
  ('excel.exe',             'Microsoft Excel',     'EDUCATION'),
  ('acrobat.exe',           'Adobe Acrobat',       'EDUCATION'),
  ('sumatrapdf.exe',        'Sumatra PDF',         'EDUCATION'),
  ('onenote.exe',           'OneNote',             'EDUCATION'),

  -- Gaming
  ('freefire.exe',          'Free Fire',           'GAMING'),
  ('pubg.exe',              'PUBG',                'GAMING'),
  ('valorant.exe',          'Valorant',            'GAMING'),
  ('minecraft.exe',         'Minecraft',           'GAMING'),
  ('robloxplayerbeta.exe',  'Roblox',              'GAMING'),
  ('steam.exe',             'Steam',               'GAMING'),
  ('epicgameslauncher.exe', 'Epic Games',          'GAMING'),
  ('leagueoflegends.exe',   'League of Legends',   'GAMING'),
  ('gta5.exe',              'GTA V',               'GAMING'),
  ('csgo.exe',              'CS:GO',               'GAMING'),

  -- Social Media
  ('instagram.exe',         'Instagram',           'SOCIAL_MEDIA'),
  ('twitter.exe',           'Twitter/X',           'SOCIAL_MEDIA'),
  ('snapchat.exe',          'Snapchat',            'SOCIAL_MEDIA'),
  ('tiktok.exe',            'TikTok',              'SOCIAL_MEDIA'),
  ('facebook.exe',          'Facebook',            'SOCIAL_MEDIA'),

  -- Communication
  ('whatsapp.exe',          'WhatsApp',            'COMMUNICATION'),
  ('telegram.exe',          'Telegram',            'COMMUNICATION'),
  ('slack.exe',             'Slack',               'COMMUNICATION'),
  ('discord.exe',           'Discord',             'COMMUNICATION'),
  ('zoom.exe',              'Zoom',                'COMMUNICATION'),
  ('teams.exe',             'Microsoft Teams',     'COMMUNICATION'),
  ('skype.exe',             'Skype',               'COMMUNICATION'),

  -- Entertainment
  ('vlc.exe',               'VLC Media Player',    'ENTERTAINMENT'),
  ('netflix.exe',           'Netflix',             'ENTERTAINMENT'),
  ('spotify.exe',           'Spotify',             'ENTERTAINMENT'),
  ('mpc-hc.exe',            'Media Player Classic','ENTERTAINMENT'),
  ('wmplayer.exe',          'Windows Media Player','ENTERTAINMENT'),

  -- Productivity
  ('notepad.exe',           'Notepad',             'PRODUCTIVITY'),
  ('explorer.exe',          'File Explorer',       'PRODUCTIVITY'),
  ('taskmgr.exe',           'Task Manager',        'PRODUCTIVITY'),
  ('mspaint.exe',           'Paint',               'PRODUCTIVITY'),
  ('calc.exe',              'Calculator',          'PRODUCTIVITY'),
  ('cmd.exe',               'Command Prompt',      'PRODUCTIVITY'),
  ('powershell.exe',        'PowerShell',          'PRODUCTIVITY'),
  ('windowsterminal.exe',   'Windows Terminal',    'PRODUCTIVITY')
ON CONFLICT (process_name) DO NOTHING;
