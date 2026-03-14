-- ============================================================
-- V19 — Location tracking, geo-fences, mobile app usage
-- ============================================================

-- ── Device GPS locations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS device_locations (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     UUID            NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  tenant_id     UUID            NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  accuracy      DOUBLE PRECISION,
  speed         DOUBLE PRECISION,
  altitude      DOUBLE PRECISION,
  recorded_at   TIMESTAMPTZ     NOT NULL,
  synced_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_location_device_time
  ON device_locations(device_id, recorded_at DESC);

CREATE INDEX idx_location_tenant_time
  ON device_locations(tenant_id, recorded_at DESC);

-- ── Geo-fence zones (defined by parents / admins) ────────────────────────────
CREATE TABLE IF NOT EXISTS geo_fences (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  radius_meters  INTEGER      NOT NULL DEFAULT 200,
  fence_type     VARCHAR(20)  NOT NULL DEFAULT 'SAFE',  -- SAFE | ALERT
  active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_geofence_tenant
  ON geo_fences(tenant_id) WHERE active = TRUE;

-- ── Geo-fence enter/exit events ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS geo_fence_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID        NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  fence_id     UUID        REFERENCES geo_fences(id) ON DELETE SET NULL,
  region_id    VARCHAR(100) NOT NULL,   -- fence UUID string from the mobile app
  event_type   VARCHAR(10) NOT NULL,   -- ENTERED | EXITED
  occurred_at  TIMESTAMPTZ NOT NULL,
  notified_at  TIMESTAMPTZ
);

CREATE INDEX idx_geofence_events_device
  ON geo_fence_events(device_id, occurred_at DESC);

-- ── Mobile app-usage stats (from Android UsageStatsManager) ──────────────────
CREATE TABLE IF NOT EXISTS mobile_app_usage (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id     UUID         NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  package_name  VARCHAR(255) NOT NULL,
  app_name      VARCHAR(255),
  duration_ms   BIGINT       NOT NULL,
  last_used     TIMESTAMPTZ,
  period_start  TIMESTAMPTZ  NOT NULL,
  period_end    TIMESTAMPTZ  NOT NULL,
  recorded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mobile_usage_device
  ON mobile_app_usage(device_id, period_start DESC);

CREATE INDEX idx_mobile_usage_tenant
  ON mobile_app_usage(tenant_id, period_start DESC);
