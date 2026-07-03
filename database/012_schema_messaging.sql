-- ============================================================
-- Helping Hands Platform — Schema: Request Messaging
-- ============================================================

CREATE TABLE request_messages (
    id              BIGSERIAL PRIMARY KEY,
    request_id      BIGINT NOT NULL REFERENCES requests (id),
    sender_id       BIGINT NOT NULL REFERENCES users (id),
    content         VARCHAR(2000) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_request_messages_request ON request_messages (request_id, created_date);

-- Widen notifications to accept the two new notification types
ALTER TABLE notifications DROP CONSTRAINT chk_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type
    CHECK (type IN (
        'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED',
        'REQUEST_PLEDGED', 'REQUEST_ACCEPTED', 'REQUEST_DELIVERED', 'REQUEST_COMPLETED', 'REQUEST_CANCELLED',
        'RATING_RECEIVED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REINSTATED', 'CONTENT_FLAGGED',
        'SUSPICIOUS_LOGIN_ACTIVITY', 'POSSIBLE_MISUSE_DETECTED', 'REQUEST_REMINDER',
        'MESSAGE_RECEIVED', 'DELIVERY_ALTERNATIVE_ARRANGED'
    ));
