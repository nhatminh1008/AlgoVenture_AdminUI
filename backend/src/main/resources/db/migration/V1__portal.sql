CREATE TABLE app_users (
 id VARCHAR(36) PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL,
 password_hash VARCHAR(100) NOT NULL, role VARCHAR(20) NOT NULL CHECK (role IN ('admin','instructor','learner')),
 status VARCHAR(20) NOT NULL CHECK (status IN ('Active','Pending','Suspended')),
 joined TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE classrooms (
 id VARCHAR(36) PRIMARY KEY, instructor_id VARCHAR(36) NOT NULL REFERENCES app_users(id),
 name VARCHAR(100) NOT NULL, name_key VARCHAR(100) NOT NULL, description VARCHAR(500) NOT NULL,
 topic_id VARCHAR(40) NOT NULL, level VARCHAR(20) NOT NULL CHECK (level IN ('basic','advanced')),
 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE (instructor_id, name_key)
);
CREATE TABLE enrollments (
 id VARCHAR(36) PRIMARY KEY, class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
 user_id VARCHAR(36) NOT NULL REFERENCES app_users(id), UNIQUE(class_id,user_id)
);
CREATE TABLE assignments (
 id VARCHAR(36) PRIMARY KEY, class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
 title VARCHAR(100) NOT NULL, description VARCHAR(1000) NOT NULL, status VARCHAR(20) NOT NULL,
 due DATE, lesson_ids TEXT NOT NULL
);
CREATE TABLE materials (
 id VARCHAR(36) PRIMARY KEY, class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
 title VARCHAR(120) NOT NULL, description VARCHAR(500) NOT NULL, filename VARCHAR(255) NOT NULL,
 size BIGINT NOT NULL, type VARCHAR(150) NOT NULL, uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 content BYTEA NOT NULL
);
CREATE TABLE quizzes (
 id VARCHAR(36) PRIMARY KEY, class_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
 title VARCHAR(100) NOT NULL, description VARCHAR(1000) NOT NULL, status VARCHAR(20) NOT NULL,
 due DATE, questions TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE quiz_materials (
 quiz_id VARCHAR(36) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
 material_id VARCHAR(36) NOT NULL REFERENCES materials(id), PRIMARY KEY (quiz_id,material_id)
);
CREATE TABLE algorithms (
 id VARCHAR(50) PRIMARY KEY, topic_id VARCHAR(40) NOT NULL, name VARCHAR(100) NOT NULL,
 difficulty VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, config TEXT NOT NULL
);
CREATE TABLE feature_toggles (
 id VARCHAR(60) PRIMARY KEY, category VARCHAR(40) NOT NULL, title VARCHAR(100) NOT NULL,
 description VARCHAR(500) NOT NULL, enabled BOOLEAN NOT NULL
);
CREATE TABLE system_settings (id INTEGER PRIMARY KEY, platform_name VARCHAR(100) NOT NULL, maintenance BOOLEAN NOT NULL);
INSERT INTO system_settings(id,platform_name,maintenance) VALUES (1,'AlgoVenture',false);
CREATE TABLE audit_events (
 id VARCHAR(36) PRIMARY KEY, actor_id VARCHAR(36) REFERENCES app_users(id), action VARCHAR(100) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_classrooms_instructor ON classrooms(instructor_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_quizzes_class ON quizzes(class_id);
CREATE INDEX idx_materials_class ON materials(class_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
