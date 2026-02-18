-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — Initial Database Schema
-- ═══════════════════════════════════════════════════════════════

-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    admin_email VARCHAR(255) NOT NULL,
    local_server_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Devices
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'OFFLINE',
    os_version VARCHAR(100),
    agent_version VARCHAR(20),
    last_seen TIMESTAMP,
    device_code VARCHAR(10) UNIQUE NOT NULL,
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id),
    app_name VARCHAR(255),
    app_path VARCHAR(500),
    category VARCHAR(50),
    duration_minutes INTEGER DEFAULT 0,
    timestamp TIMESTAMP NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rules
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    device_id UUID REFERENCES devices(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    target VARCHAR(255),
    limit_minutes INTEGER,
    schedule_start VARCHAR(10),
    schedule_end VARCHAR(10),
    schedule_days TEXT,
    auto_block BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id),
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    auto_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Focus Sessions
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    allowed_apps TEXT,
    blocked_apps TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    initiated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'FREE_TRIAL',
    device_limit INTEGER DEFAULT 5,
    price_per_device NUMERIC(10,2) DEFAULT 0,
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'TRIAL',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_device ON activity_logs(device_id);
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_alerts_device ON alerts(device_id);
CREATE INDEX idx_alerts_read ON alerts(read);
CREATE INDEX idx_devices_tenant ON devices(tenant_id);
CREATE INDEX idx_devices_code ON devices(device_code);
CREATE INDEX idx_rules_tenant ON rules(tenant_id);
CREATE INDEX idx_rules_device ON rules(device_id);
CREATE INDEX idx_focus_device ON focus_sessions(device_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
