-- Link block_rules to rules table for institute dual-write: when a Rule is deleted, its BlockRule is removed.
ALTER TABLE block_rules
  ADD COLUMN IF NOT EXISTS source_rule_id UUID REFERENCES rules(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_block_rules_source_rule_id ON block_rules(source_rule_id);
