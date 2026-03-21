-- ================================================================
-- V27: Convert activity_logs.category from app_category ENUM
--      to VARCHAR(50) so Hibernate EnumType.STRING inserts work
--      without PostgreSQL type-mismatch errors.
-- ================================================================

-- Cast existing enum values to their string representation
ALTER TABLE activity_logs
    ALTER COLUMN category TYPE VARCHAR(50) USING category::VARCHAR;

-- Set the default to the string literal (no longer an enum default)
ALTER TABLE activity_logs
    ALTER COLUMN category SET DEFAULT 'OTHER';

-- Also fix app_category_map for consistency (not used by Hibernate,
-- but prevents confusion when querying across both tables)
ALTER TABLE app_category_map
    ALTER COLUMN category TYPE VARCHAR(50) USING category::VARCHAR;
