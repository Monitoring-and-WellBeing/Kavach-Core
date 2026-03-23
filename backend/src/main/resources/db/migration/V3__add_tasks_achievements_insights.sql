-- ================================================================
-- KAVACH AI -- V3 Migration: Tasks, Achievements, AI Insights
-- ================================================================

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    label VARCHAR(255) NOT NULL,
    scheduled_time TIME,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    CONSTRAINT fk_tasks_student FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) NOT NULL,
    earned_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_achievements_student FOREIGN KEY (student_id) REFERENCES users(id)
);

-- AI Insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    risk_level VARCHAR(20) NOT NULL,
    action_suggested TEXT,
    generated_at TIMESTAMP NOT NULL,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_student ON tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_achievements_student ON achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_insights_device ON ai_insights(device_id);
CREATE INDEX IF NOT EXISTS idx_insights_dismissed ON ai_insights(dismissed);
