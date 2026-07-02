-- ============================================================
-- Helping Hands Platform — Schema: SRS Gap Closure Batch
-- ============================================================

-- 1. Delivery Volunteer role
INSERT INTO roles (name, created_by) VALUES ('DELIVERY_VOLUNTEER', 'system')
ON CONFLICT (name) DO NOTHING;

-- 2. Delivery method / courier details on requests (goods logistics)
ALTER TABLE requests ADD COLUMN delivery_method VARCHAR(30);
ALTER TABLE requests ADD COLUMN courier_details VARCHAR(300);
ALTER TABLE requests ADD CONSTRAINT chk_requests_delivery_method
    CHECK (delivery_method IS NULL OR delivery_method IN ('SELF_DELIVERY', 'VOLUNTEER_PICKUP', 'COURIER'));

-- 3. Last login tracking (MFA + inactivity sweep both depend on this)
ALTER TABLE users ADD COLUMN last_login_date TIMESTAMP;

-- 4. MFA: widen verification_tokens to accept the new token type
ALTER TABLE verification_tokens DROP CONSTRAINT chk_tokens_type;
ALTER TABLE verification_tokens ADD CONSTRAINT chk_tokens_type
    CHECK (token_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'MFA_LOGIN'));

-- 5. Failed login attempts — brute-force tracking + admin alerting
CREATE TABLE failed_login_attempts (
    id              BIGSERIAL PRIMARY KEY,
    identifier      VARCHAR(150) NOT NULL,
    attempted_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_failed_login_identifier ON failed_login_attempts (identifier, attempted_at);

-- 6. Widen notifications to accept the new notification types
ALTER TABLE notifications DROP CONSTRAINT chk_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_type
    CHECK (type IN (
        'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED',
        'REQUEST_PLEDGED', 'REQUEST_ACCEPTED', 'REQUEST_DELIVERED', 'REQUEST_COMPLETED', 'REQUEST_CANCELLED',
        'RATING_RECEIVED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_REINSTATED', 'CONTENT_FLAGGED',
        'SUSPICIOUS_LOGIN_ACTIVITY', 'POSSIBLE_MISUSE_DETECTED', 'REQUEST_REMINDER'
    ));
