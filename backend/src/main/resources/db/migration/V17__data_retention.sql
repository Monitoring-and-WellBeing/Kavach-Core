-- ═══════════════════════════════════════════════════════════════
-- KAVACH AI — V17 Migration: Data Retention Policy
-- ═══════════════════════════════════════════════════════════════

-- Create archive table for old activity logs
CREATE TABLE IF NOT EXISTS activity_logs_archive (LIKE activity_logs INCLUDING ALL);

-- Function to archive activity logs older than 90 days
CREATE OR REPLACE FUNCTION archive_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move logs older than 90 days to archive table
  WITH moved AS (
    DELETE FROM activity_logs
    WHERE started_at < NOW() - INTERVAL '90 days'
    RETURNING *
  )
  INSERT INTO activity_logs_archive SELECT * FROM moved;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
