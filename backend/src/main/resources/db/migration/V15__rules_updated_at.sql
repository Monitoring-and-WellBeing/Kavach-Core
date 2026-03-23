-- ================================================================
-- KAVACH AI -- V15 Migration: Add rules_updated_at to devices
-- ================================================================

-- Add column to track when rules were last updated for a device
ALTER TABLE devices ADD COLUMN IF NOT EXISTS rules_updated_at TIMESTAMP;

-- Set initial value to current timestamp for existing devices
UPDATE devices SET rules_updated_at = NOW() WHERE rules_updated_at IS NULL;
