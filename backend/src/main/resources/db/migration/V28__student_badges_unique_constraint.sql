-- Prevent duplicate badge awards that can occur when @Scheduled BadgeEvaluationService
-- runs on multiple Railway instances simultaneously (split-brain scheduler scenario).
-- The application-level existsByDeviceIdAndBadgeId check has a TOCTOU race; this
-- constraint is the last line of defence.

ALTER TABLE student_badges
    ADD CONSTRAINT uq_student_badges_device_badge
    UNIQUE (device_id, badge_id);
