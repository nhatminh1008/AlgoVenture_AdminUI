CREATE TABLE bubble_challenges (
 id VARCHAR(36) PRIMARY KEY,
 user_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
 input_json TEXT NOT NULL
);
