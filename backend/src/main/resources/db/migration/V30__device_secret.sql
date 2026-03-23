ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_secret VARCHAR(36);

UPDATE devices
SET device_secret = gen_random_uuid()::text
WHERE device_secret IS NULL;

ALTER TABLE devices ALTER COLUMN device_secret SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_devices_device_id_secret ON devices(id, device_secret);
-- GAP-5 FIXED
