-- ============================================================
-- Helping Hands Platform — Schema: Children's Home & Service Provider
-- Verification workflows. Depends on 001_schema_auth.sql (users table).
-- ============================================================

CREATE TABLE childrens_homes (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    home_name           VARCHAR(200) NOT NULL,
    registration_number VARCHAR(80)  NOT NULL,
    contact_number      VARCHAR(20)  NOT NULL,
    contact_email       VARCHAR(150) NOT NULL,
    address             VARCHAR(500) NOT NULL,
    description         VARCHAR(2000),

    verification_status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    rejection_reason    VARCHAR(1000),
    reviewed_by         VARCHAR(150),
    reviewed_date       TIMESTAMP,

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      VARCHAR(150),
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     VARCHAR(150),
    modified_date   TIMESTAMP,

    CONSTRAINT uk_homes_registration_number UNIQUE (registration_number),
    CONSTRAINT uk_homes_user_id UNIQUE (user_id),
    CONSTRAINT fk_homes_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT chk_homes_verification_status
        CHECK (verification_status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_homes_registration_number ON childrens_homes (registration_number);
CREATE INDEX idx_homes_name ON childrens_homes (home_name);
CREATE INDEX idx_homes_status ON childrens_homes (verification_status);


CREATE TABLE service_providers (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT NOT NULL,
    skills                      VARCHAR(500) NOT NULL,
    qualifications              VARCHAR(2000),
    service_mode                VARCHAR(20) NOT NULL,
    police_clearance_required   BOOLEAN NOT NULL,
    police_clearance_verified   BOOLEAN NOT NULL DEFAULT FALSE,

    verification_status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    rejection_reason    VARCHAR(1000),
    reviewed_by         VARCHAR(150),
    reviewed_date       TIMESTAMP,

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      VARCHAR(150),
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     VARCHAR(150),
    modified_date   TIMESTAMP,

    CONSTRAINT uk_providers_user_id UNIQUE (user_id),
    CONSTRAINT fk_providers_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT chk_providers_service_mode CHECK (service_mode IN ('ONSITE', 'ONLINE_ONLY')),
    CONSTRAINT chk_providers_verification_status
        CHECK (verification_status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_providers_status ON service_providers (verification_status);

-- One row per (provider, category) — a provider can offer more than one category.
CREATE TABLE service_provider_categories (
    provider_id BIGINT NOT NULL,
    category    VARCHAR(30) NOT NULL,

    PRIMARY KEY (provider_id, category),
    CONSTRAINT fk_provider_categories_provider FOREIGN KEY (provider_id) REFERENCES service_providers (id),
    CONSTRAINT chk_provider_categories_value
        CHECK (category IN ('TUITION', 'COUNSELLING', 'HEALTHCARE', 'SPORTS_COACHING', 'MAINTENANCE', 'OTHER'))
);
