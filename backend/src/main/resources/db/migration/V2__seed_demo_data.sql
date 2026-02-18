-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — Demo Seed Data
-- ═══════════════════════════════════════════════════════════════

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
);

-- Demo Users (passwords are BCrypt hashes of 'demo123')
-- Institute Admin: admin@demo.com
INSERT INTO users (id, tenant_id, name, email, password_hash, phone, role)
VALUES (
    'b1c2d3e4-f5a6-7890-bcde-f12345678901',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Institute Admin',
    'admin@demo.com',
    '$2a$10$GI5GBE7yiLzGqXlRYwGrXuQk1BIhvvPJhVKpnMxYIOoV.5/CswTKK',
    '+91-9000000001',
    'INSTITUTE_ADMIN'
);

-- Parent: parent@demo.com
INSERT INTO users (id, tenant_id, name, email, password_hash, phone, role)
VALUES (
    'c1d2e3f4-a5b6-7890-cdef-123456789012',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Demo Parent',
    'parent@demo.com',
    '$2a$10$GI5GBE7yiLzGqXlRYwGrXuQk1BIhvvPJhVKpnMxYIOoV.5/CswTKK',
    '+91-9000000002',
    'PARENT'
);

-- Student: student@demo.com
INSERT INTO users (id, tenant_id, name, email, password_hash, phone, role)
VALUES (
    'd1e2f3a4-b5c6-7890-defa-234567890123',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Demo Student',
    'student@demo.com',
    '$2a$10$GI5GBE7yiLzGqXlRYwGrXuQk1BIhvvPJhVKpnMxYIOoV.5/CswTKK',
    '+91-9000000003',
    'STUDENT'
);

-- Demo Devices
INSERT INTO devices (id, tenant_id, name, type, status, os_version, agent_version, device_code, assigned_to)
VALUES
    ('dev00001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lab PC - Row A1', 'DESKTOP', 'ONLINE', 'Windows 11 Pro', '1.2.4', 'KV3X9A', 'Rahul Sharma'),
    ('dev00002-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lab PC - Row A2', 'DESKTOP', 'FOCUS_MODE', 'Windows 10 Pro', '1.2.4', 'KV7B2C', 'Priya Verma'),
    ('dev00003-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lab PC - Row B1', 'LAPTOP', 'OFFLINE', 'Windows 11 Home', '1.2.3', 'KV1D5E', 'Arjun Singh'),
    ('dev00004-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lab PC - Row B2', 'DESKTOP', 'PAUSED', 'Windows 11 Pro', '1.2.4', 'KV4F8G', 'Sneha Patel'),
    ('dev00005-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Home Laptop - Rohan', 'LAPTOP', 'ONLINE', 'Windows 11 Home', '1.2.4', 'KV9H3J', 'Rohan Gupta');

-- Demo Subscription
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
);
