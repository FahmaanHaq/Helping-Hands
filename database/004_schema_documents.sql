-- ============================================================
-- Helping Hands Platform — Schema: Documents
-- Polymorphic ownership: (owner_type, owner_id) points at either
-- childrens_homes.id or service_providers.id. No FK constraint here
-- by design (see Document.java entity comment) — ownership is
-- validated in application code before any access.
-- ============================================================

CREATE TABLE documents (
    id                  BIGSERIAL PRIMARY KEY,
    owner_type          VARCHAR(30) NOT NULL,
    owner_id            BIGINT NOT NULL,
    document_type       VARCHAR(40) NOT NULL,
    original_file_name  VARCHAR(255) NOT NULL,
    stored_file_name    VARCHAR(255) NOT NULL,
    content_type        VARCHAR(100) NOT NULL,
    file_size_bytes     BIGINT NOT NULL,
    remarks             VARCHAR(500),

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      VARCHAR(150),
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     VARCHAR(150),
    modified_date   TIMESTAMP,

    CONSTRAINT chk_documents_owner_type CHECK (owner_type IN ('CHILDRENS_HOME', 'SERVICE_PROVIDER')),
    CONSTRAINT chk_documents_type CHECK (document_type IN (
        'GOVERNMENT_REGISTRATION_CERTIFICATE', 'NCPA_DOCUMENT',
        'QUALIFICATION_CERTIFICATE', 'POLICE_CLEARANCE_REPORT', 'IDENTITY_DOCUMENT',
        'ADDITIONAL_PROOF'
    ))
);

CREATE INDEX idx_documents_owner ON documents (owner_type, owner_id);
