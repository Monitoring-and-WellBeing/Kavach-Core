-- =====================================================================
-- KAVACH AI -- V26: Remove demo seed data for production
--
-- Deletes in strict leaf-to-root dependency order.
-- Safe to run on a DB that never had demo data (WHERE clauses are no-ops).
-- =====================================================================

DO $$
DECLARE
  demo_tenant UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  demo_emails TEXT[] := ARRAY['admin@demo.com','parent@demo.com','student@demo.com'];
BEGIN

  -- All tenant-scoped leaf tables ----------------------------------------
  -- Also clean up V20-seeded rewards tenant (11111111-...) created during migration
  DELETE FROM reward_redemptions  WHERE tenant_id IN (demo_tenant, '11111111-1111-1111-1111-111111111111');
  DELETE FROM xp_transactions     WHERE tenant_id = demo_tenant;
  DELETE FROM daily_challenges    WHERE tenant_id = demo_tenant;
  DELETE FROM mood_checkins       WHERE tenant_id = demo_tenant;
  DELETE FROM daily_motivation    WHERE tenant_id = demo_tenant;
  DELETE FROM student_ai_usage    WHERE tenant_id = demo_tenant;
  DELETE FROM mobile_app_usage    WHERE tenant_id = demo_tenant;
  DELETE FROM daily_app_usage     WHERE tenant_id = demo_tenant;
  DELETE FROM screenshots         WHERE tenant_id = demo_tenant;
  DELETE FROM screenshot_settings WHERE tenant_id = demo_tenant;  -- tenant_id is PK here
  DELETE FROM student_badges      WHERE tenant_id = demo_tenant;

  -- Device-child tables (no tenant_id column, scoped via devices) --------
  DELETE FROM streak_recoveries
    WHERE device_id IN (SELECT id FROM devices WHERE tenant_id = demo_tenant);
  DELETE FROM geo_fence_events
    WHERE device_id IN (SELECT id FROM devices WHERE tenant_id = demo_tenant);
  DELETE FROM device_locations
    WHERE device_id IN (SELECT id FROM devices WHERE tenant_id = demo_tenant);
  DELETE FROM enforcement_state
    WHERE device_id IN (SELECT id FROM devices WHERE tenant_id = demo_tenant);
  DELETE FROM enforcement_events
    WHERE device_id IN (SELECT id FROM devices WHERE tenant_id = demo_tenant);
  DELETE FROM blocking_violations
    WHERE device_id IN (SELECT id FROM devices WHERE tenant_id = demo_tenant);
  DELETE FROM activity_logs
    WHERE device_id IN (SELECT id FROM devices WHERE tenant_id = demo_tenant);
  DELETE FROM focus_sessions
    WHERE device_id IN (SELECT id FROM devices WHERE tenant_id = demo_tenant);

  -- focus_whitelist is tenant-scoped (tenant_id column) ------------------
  DELETE FROM focus_whitelist     WHERE tenant_id = demo_tenant;

  -- Remaining tenant-scoped tables ---------------------------------------
  DELETE FROM time_limit_rules    WHERE tenant_id = demo_tenant;
  DELETE FROM block_rules         WHERE tenant_id = demo_tenant;
  DELETE FROM geo_fences          WHERE tenant_id = demo_tenant;
  DELETE FROM alert_rules         WHERE tenant_id = demo_tenant;
  DELETE FROM rewards             WHERE tenant_id IN (demo_tenant, '11111111-1111-1111-1111-111111111111');
  DELETE FROM ai_insights         WHERE tenant_id = demo_tenant;
  DELETE FROM payment_orders      WHERE tenant_id = demo_tenant;
  DELETE FROM subscriptions       WHERE tenant_id = demo_tenant;
  DELETE FROM device_link_codes   WHERE tenant_id = demo_tenant;
  DELETE FROM devices             WHERE tenant_id = demo_tenant;

  -- User-referencing tables ----------------------------------------------
  DELETE FROM goal_progress
    WHERE goal_id IN (
      SELECT id FROM goals
      WHERE created_by IN (SELECT id FROM users WHERE tenant_id = demo_tenant)
    );
  DELETE FROM goals
    WHERE created_by IN (SELECT id FROM users WHERE tenant_id = demo_tenant);
  DELETE FROM refresh_tokens
    WHERE user_id IN (SELECT id FROM users WHERE tenant_id = demo_tenant);
  DELETE FROM tasks
    WHERE student_id IN (SELECT id FROM users WHERE tenant_id = demo_tenant);

  -- Users then tenants ---------------------------------------------------
  DELETE FROM users   WHERE tenant_id = demo_tenant OR email = ANY(demo_emails);
  DELETE FROM tenants WHERE id IN (demo_tenant, '11111111-1111-1111-1111-111111111111');

END $$;
