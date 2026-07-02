-- ============================================================
-- Helping Hands Platform — Schema: Auth & Role-Based Access
-- Target: PostgreSQL (MySQL-compatible notes inline where it differs)
-- ============================================================

CREATE TABLE roles (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(40) NOT NULL,

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      VARCHAR(150),
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     VARCHAR(150),
    modified_date   TIMESTAMP,

    CONSTRAINT uk_roles_name UNIQUE (name)
);

CREATE TABLE users (
    id                BIGSERIAL PRIMARY KEY,
    full_name         VARCHAR(150) NOT NULL,
    username          VARCHAR(60)  NOT NULL,
    email             VARCHAR(150) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    phone_number      VARCHAR(20),
    email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    account_locked    BOOLEAN NOT NULL DEFAULT FALSE,

    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_by        VARCHAR(150),
    created_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       VARCHAR(150),
    modified_date     TIMESTAMP,

    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username)
);

CREATE TABLE user_roles (
    user_id  BIGINT NOT NULL,
    role_id  BIGINT NOT NULL,

    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- Indexes required by spec: Email, Name, RegistrationNumber, RequestCategory.
-- RegistrationNumber / RequestCategory belong to later modules (Children's Home,
-- Requests) and will be added in their own migration scripts.
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_full_name ON users (full_name);

-- Soft-delete convention used everywhere in this platform:
--   UPDATE <table> SET is_active = FALSE, modified_by = :actor, modified_date = NOW()
--   WHERE id = :id;
-- No DELETE statements are issued against business tables from application code.
