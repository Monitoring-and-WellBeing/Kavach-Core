-- ═══════════════════════════════════════════════════════════════════
-- KAVACH AI — V26: Remove demo seed data for production
--
-- All child rows cascade automatically via ON DELETE CASCADE FKs:
--   users, devices, device_link_codes, activity_logs, alerts,
--   block_rules, violations, focus_sessions, focus_whitelist,
--   goals, goal_progress, subscriptions, payment_orders,
--   geo_fences, geo_fence_events, device_locations, mobile_app_usage,
--   screenshots, screenshot_settings, enforcement_events,
--   enforcement_state, time_limit_usage, student_ai_usage,
--   mood_entries, rewards, reward_redemptions, daily_challenges,
--   device_streaks, ai_motivations, ai_insights
--
-- Safe to run on a DB that never had demo data (WHERE clause is a no-op).
-- ═══════════════════════════════════════════════════════════════════

-- Guard: only delete the known demo tenant (idempotent)
DELETE FROM tenants
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND admin_email = 'admin@demo.com';

-- The DELETE above cascades to every child table.
-- The two statements below are safety nets for any remaining rows
-- that might reference the demo emails directly (e.g. stale V1 data
-- in environments that ran the very first schema without cascade).
DELETE FROM users
WHERE email IN ('admin@demo.com', 'parent@demo.com', 'student@demo.com');

-- Remove demo plan seeds that are no longer valid for production
-- (plans themselves are kept — they are product config, not demo data)
