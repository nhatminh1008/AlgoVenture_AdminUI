ALTER TABLE classrooms ADD COLUMN invite_code VARCHAR(8);
UPDATE classrooms SET invite_code = UPPER(SUBSTRING(REPLACE(id, '-', ''), 1, 8));
ALTER TABLE classrooms ALTER COLUMN invite_code SET NOT NULL;
CREATE UNIQUE INDEX uq_classroom_invite ON classrooms(invite_code);
CREATE TABLE quiz_attempts (
 id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
 quiz_id VARCHAR(36) NOT NULL REFERENCES quizzes(id), client_id VARCHAR(36) NOT NULL,
 submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 result TEXT NOT NULL, score INTEGER NOT NULL, UNIQUE(user_id,client_id)
);
CREATE INDEX idx_quiz_attempt_user ON quiz_attempts(user_id,quiz_id);
CREATE TABLE lesson_completions (
 id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
 lesson_id VARCHAR(50) NOT NULL REFERENCES algorithms(id), stage INTEGER NOT NULL,
 completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,lesson_id,stage)
);
CREATE TABLE assignment_completions (
 assignment_id VARCHAR(36) NOT NULL REFERENCES assignments(id),
 user_id VARCHAR(36) NOT NULL REFERENCES app_users(id), lesson_id VARCHAR(50) NOT NULL REFERENCES algorithms(id),
 completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(assignment_id,user_id,lesson_id)
);
