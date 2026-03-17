-- ================================================================
-- KAVACH AI -- V16 Migration: Performance Indexes
-- ================================================================

-- Activity logs: most queried table ----------------------------------------
-- Used in: reports, dashboard, goal evaluation, AI insights
CREATE INDEX IF NOT EXISTS idx_activity_device_started
  ON activity_logs(device_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_tenant_started
  ON activity_logs(tenant_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_device_category
  ON activity_logs(device_id, category, started_at DESC);

-- Alerts: frequent reads for unread count -----------------------------------
CREATE INDEX IF NOT EXISTS idx_alerts_tenant_unread
  ON alerts(tenant_id, is_read, is_dismissed, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_device_triggered
  ON alerts(device_id, triggered_at DESC);

-- Focus sessions: streak and stats queries ----------------------------------
CREATE INDEX IF NOT EXISTS idx_focus_device_status_started
  ON focus_sessions(device_id, status, started_at DESC);

-- Goal progress: daily evaluation queries -----------------------------------
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_date
  ON goal_progress(goal_id, period_date DESC);

-- Blocking violations: frequent inserts ------------------------------------
CREATE INDEX IF NOT EXISTS idx_violations_device_attempted
  ON blocking_violations(device_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_violations_tenant_attempted
  ON blocking_violations(tenant_id, attempted_at DESC);

-- Subscriptions: checked on every device API call --------------------------
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant
  ON subscriptions(tenant_id, status);
