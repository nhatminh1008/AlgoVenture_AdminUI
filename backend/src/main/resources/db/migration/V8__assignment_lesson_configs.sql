ALTER TABLE assignments ADD COLUMN lesson_configs TEXT NOT NULL DEFAULT '{}';
ALTER TABLE bubble_challenges ADD COLUMN assignment_id VARCHAR(36) REFERENCES assignments(id);
ALTER TABLE bubble_challenges ADD COLUMN difficulty VARCHAR(10) NOT NULL DEFAULT 'hard';
