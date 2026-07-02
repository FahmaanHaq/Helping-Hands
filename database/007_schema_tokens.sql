-- ============================================================
-- Helping Hands Platform — Schema: Verification Tokens
-- Shared table for email verification and password reset tokens.
-- ============================================================

CREATE TABLE verification_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    token_hash      VARCHAR(64) NOT NULL,
    token_type      VARCHAR(30) NOT NULL,
    expiry_date     TIMESTAMP NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT chk_tokens_type CHECK (token_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);

CREATE INDEX idx_tokens_hash ON verification_tokens (token_hash);
CREATE INDEX idx_tokens_user ON verification_tokens (user_id);
