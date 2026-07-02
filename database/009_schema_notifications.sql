-- ============================================================
-- Helping Hands Platform — Schema: Notifications
-- ============================================================

CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    recipient_id    BIGINT NOT NULL,
    type            VARCHAR(40) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         VARCHAR(1000) NOT NULL,
    link            VARCHAR(300),
    read            BOOLEAN NOT NULL DEFAULT FALSE,

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      VARCHAR(150),
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     VARCHAR(150),
    modified_date   TIMESTAMP,

    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id),
    CONSTRAINT chk_notifications_type CHECK (type IN (
        'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED',
        'REQUEST_PLEDGED', 'REQUEST_ACCEPTED', 'REQUEST_DELIVERED', 'REQUEST_COMPLETED', 'REQUEST_CANCELLED',
        'RATING_RECEIVED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REINSTATED', 'CONTENT_FLAGGED'
    ))
);

CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, read);
