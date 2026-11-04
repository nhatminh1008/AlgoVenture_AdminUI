CREATE TABLE adaptive_recommendations (
 id VARCHAR(36) PRIMARY KEY,
 user_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
 client_request_id VARCHAR(36) NOT NULL,
 context_json TEXT NOT NULL,
 response_json TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,client_request_id)
);
CREATE INDEX idx_adaptive_user_created ON adaptive_recommendations(user_id,created_at);
