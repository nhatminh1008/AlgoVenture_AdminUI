CREATE TABLE game_classroom_accounts (
 game_user_id BIGINT PRIMARY KEY,
 portal_user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES app_users(id)
);
