-- ShedLock distributed scheduling lock table.
-- Prevents @Scheduled jobs (focus session expiry, stale device sweep, alert evaluation,
-- subscription expiry) from executing on every Railway instance simultaneously.
-- Required by the JdbcTemplateLockProvider configured in KavachApplication.

CREATE TABLE IF NOT EXISTS shedlock (
    name       VARCHAR(64)  NOT NULL,
    lock_until TIMESTAMP    NOT NULL,
    locked_at  TIMESTAMP    NOT NULL,
    locked_by  VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
