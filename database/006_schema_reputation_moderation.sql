-- ============================================================
-- Helping Hands Platform — Schema: Reputation, Moderation, Audit
-- ============================================================

-- Reputation & Feedback
CREATE TABLE ratings (
    id              BIGSERIAL PRIMARY KEY,
    request_id      BIGINT NOT NULL,
    rated_user_id   BIGINT NOT NULL,
    score           INT NOT NULL,
    comment         VARCHAR(1000),

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      VARCHAR(150),
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     VARCHAR(150),
    modified_date   TIMESTAMP,

    CONSTRAINT uk_ratings_request UNIQUE (request_id),
    CONSTRAINT fk_ratings_request FOREIGN KEY (request_id) REFERENCES requests (id),
    CONSTRAINT fk_ratings_rated_user FOREIGN KEY (rated_user_id) REFERENCES users (id),
    CONSTRAINT chk_ratings_score CHECK (score BETWEEN 1 AND 5)
);

CREATE INDEX idx_ratings_rated_user ON ratings (rated_user_id);


-- Admin Moderation: suspension tracking on users
ALTER TABLE users ADD COLUMN suspension_reason VARCHAR(500);
ALTER TABLE users ADD COLUMN suspended_by VARCHAR(150);
ALTER TABLE users ADD COLUMN suspended_date TIMESTAMP;


-- Audit Log — append-only, deliberately has no is_active/modified columns
-- (see AuditLogEntry.java for rationale).
CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    action_type     VARCHAR(50) NOT NULL,
    performed_by    VARCHAR(150) NOT NULL,
    target_type     VARCHAR(40),
    target_id       BIGINT,
    details         VARCHAR(1000),
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_target ON audit_log (target_type, target_id);
CREATE INDEX idx_audit_log_date ON audit_log (created_date);
