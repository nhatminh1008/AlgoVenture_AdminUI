CREATE TABLE learning_attempts (
 user_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
 client_attempt_id VARCHAR(36) NOT NULL,
 lesson_id VARCHAR(50) NOT NULL REFERENCES algorithms(id),
 metadata TEXT NOT NULL,
 started_at TIMESTAMP WITH TIME ZONE NOT NULL,
 received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress','completed','abandoned','timed_out')),
 event_count INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
 PRIMARY KEY(user_id,client_attempt_id)
);
CREATE INDEX idx_learning_attempts_user ON learning_attempts(user_id,received_at);
CREATE TABLE learning_interactions (
 user_id VARCHAR(36) NOT NULL,
 client_attempt_id VARCHAR(36) NOT NULL,
 sequence_no INTEGER NOT NULL CHECK (sequence_no > 0),
 event_id VARCHAR(36) NOT NULL,
 kind VARCHAR(20) NOT NULL,
 occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
 raw_event TEXT NOT NULL,
 evaluation TEXT NOT NULL,
 received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,client_attempt_id,sequence_no),
 UNIQUE(user_id,client_attempt_id,event_id),
 FOREIGN KEY(user_id,client_attempt_id) REFERENCES learning_attempts(user_id,client_attempt_id) ON DELETE CASCADE
);
