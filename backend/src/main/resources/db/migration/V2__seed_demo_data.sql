-- ================================================================
-- KAVACH AI -- Demo Seed Data
-- ================================================================

-- Demo Tenant
INSERT INTO tenants (id, name, type, city, state, admin_email, local_server_enabled)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Demo Academy',
    'COACHING',
    'Mumbai',
    'Maharashtra',
    'admin@demo.com',
    false
)
ON CONFLICT DO NOTHING;

-- Demo Users (passwords are BCrypt hashes of 'demo123')
-- Use stable UUIDs that later migrations (V9, V11, V12) reference directly.
-- Institute Admin: admin@demo.com
INSERT INTO users (id, tenant_id, name, email, password_hash, phone, role)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Institute Admin',
    'admin@demo.com',
    '$2b$10$d3MKymoJ8EgeaZZKB8Va7ufSSqViP/nfbk3c9obfjbkf0nf4xRbUG',
    '+91-9000000001',
    'INSTITUTE_ADMIN'
)
ON CONFLICT (email) DO NOTHING;

-- Parent: parent@demo.com
INSERT INTO users (id, tenant_id, name, email, password_hash, phone, role)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Demo Parent',
    'parent@demo.com',
    '$2b$10$d3MKymoJ8EgeaZZKB8Va7ufSSqViP/nfbk3c9obfjbkf0nf4xRbUG',
    '+91-9000000002',
    'PARENT'
)
ON CONFLICT (email) DO NOTHING;

-- Student: student@demo.com
INSERT INTO users (id, tenant_id, name, email, password_hash, phone, role)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Demo Student',
    'student@demo.com',
    '$2b$10$d3MKymoJ8EgeaZZKB8Va7ufSSqViP/nfbk3c9obfjbkf0nf4xRbUG',
    '+91-9000000003',
    'STUDENT'
)
ON CONFLICT (email) DO NOTHING;

-- Demo Devices
INSERT INTO devices (id, tenant_id, name, type, status, os_version, agent_version, device_code, assigned_to)
VALUES
    ('de000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lab PC - Row A1', 'DESKTOP', 'ONLINE', 'Windows 11 Pro', '1.2.4', 'KV3X9A', 'Rahul Sharma'),
    ('de000002-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lab PC - Row A2', 'DESKTOP', 'FOCUS_MODE', 'Windows 10 Pro', '1.2.4', 'KV7B2C', 'Priya Verma'),
    ('de000003-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lab PC - Row B1', 'LAPTOP', 'OFFLINE', 'Windows 11 Home', '1.2.3', 'KV1D5E', 'Arjun Singh'),
    ('de000004-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lab PC - Row B2', 'DESKTOP', 'PAUSED', 'Windows 11 Pro', '1.2.4', 'KV4F8G', 'Sneha Patel'),
    ('de000005-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Home Laptop - Rohan', 'LAPTOP', 'ONLINE', 'Windows 11 Home', '1.2.4', 'KV9H3J', 'Rohan Gupta')
ON CONFLICT DO NOTHING;

-- Demo Subscription
-- ON CONFLICT DO NOTHING guards against duplicate-key failure on re-run
-- (subscriptions.tenant_id has a UNIQUE constraint from V1)
INSERT INTO subscriptions (tenant_id, plan, device_limit, price_per_device, billing_cycle, start_date, end_date, status)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'FREE_TRIAL',
    5,
    0,
    'MONTHLY',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    'TRIAL'
)
ON CONFLICT (tenant_id) DO NOTHING;
