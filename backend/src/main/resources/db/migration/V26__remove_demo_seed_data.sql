-- ═══════════════════════════════════════════════════════════════════
-- KAVACH AI — V26: Remove demo seed data for production
--
-- ROOT CAUSE: users.tenant_id has REFERENCES tenants(id) WITHOUT ON DELETE CASCADE
-- (from V1). So we must delete users BEFORE tenants. Users are referenced by
-- rewards, reward_redemptions, goals, block_rules, alert_rules, tasks, achievements.
-- Deletion order must respect all FK constraints.
--
-- Safe to run on a DB that never had demo data (WHERE clauses are no-ops).
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Delete tables that reference users (no CASCADE) — must run before deleting users
DELETE FROM reward_redemptions WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM focus_sessions WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM rewards WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM goal_progress WHERE goal_id IN (SELECT id FROM goals WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
DELETE FROM goals WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM blocking_violations WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM block_rules WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM alerts WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM alert_rules WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM tasks WHERE student_id IN (SELECT id FROM users WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
DELETE FROM achievements WHERE student_id IN (SELECT id FROM users WHERE tenant_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Step 2: Delete users (unblocks tenant delete; refresh_tokens CASCADE automatically)
DELETE FROM users
WHERE email IN ('admin@demo.com', 'parent@demo.com', 'student@demo.com');

-- Step 3: Delete tenant (devices, subscriptions, etc. cascade via their FKs where applicable)
DELETE FROM tenants
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND admin_email = 'admin@demo.com';
