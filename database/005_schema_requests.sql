-- ============================================================
-- Helping Hands Platform — Schema: Donation & Service Requests
-- Depends on 001 (users), 003 (childrens_homes), 004 (documents).
-- ============================================================

CREATE TABLE requests (
    id                  BIGSERIAL PRIMARY KEY,
    childrens_home_id   BIGINT NOT NULL,
    request_type        VARCHAR(20) NOT NULL,
    goods_category      VARCHAR(30),
    service_category    VARCHAR(30),
    title               VARCHAR(200) NOT NULL,
    description         VARCHAR(2000),
    quantity            INT,
    urgency             VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status              VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    pledged_by_user_id  BIGINT,
    cancellation_reason VARCHAR(1000),

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      VARCHAR(150),
    created_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     VARCHAR(150),
    modified_date   TIMESTAMP,

    CONSTRAINT fk_requests_home FOREIGN KEY (childrens_home_id) REFERENCES childrens_homes (id),
    CONSTRAINT fk_requests_pledged_by FOREIGN KEY (pledged_by_user_id) REFERENCES users (id),
    CONSTRAINT chk_requests_type CHECK (request_type IN ('GOODS', 'SERVICE')),
    CONSTRAINT chk_requests_goods_category CHECK (goods_category IS NULL OR goods_category IN (
        'FOOD', 'BOOKS', 'CLOTHING', 'MEDICAL_SUPPLIES', 'EDUCATIONAL_MATERIALS', 'OTHER_GOODS'
    )),
    CONSTRAINT chk_requests_service_category CHECK (service_category IS NULL OR service_category IN (
        'TUITION', 'COUNSELLING', 'HEALTHCARE', 'SPORTS_COACHING', 'MAINTENANCE', 'OTHER'
    )),
    CONSTRAINT chk_requests_urgency CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_requests_status CHECK (status IN (
        'CREATED', 'PLEDGED', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED'
    )),
    -- Exactly one category must be set, matching the request's own type.
    CONSTRAINT chk_requests_category_matches_type CHECK (
        (request_type = 'GOODS' AND goods_category IS NOT NULL AND service_category IS NULL) OR
        (request_type = 'SERVICE' AND service_category IS NOT NULL AND goods_category IS NULL)
    )
);

CREATE INDEX idx_requests_status ON requests (status);
CREATE INDEX idx_requests_category ON requests (goods_category, service_category);
CREATE INDEX idx_requests_home ON requests (childrens_home_id);


CREATE TABLE request_status_history (
    id              BIGSERIAL PRIMARY KEY,
    request_id      BIGINT NOT NULL,
    from_status     VARCHAR(20),
    to_status       VARCHAR(20) NOT NULL,
    changed_by      VARCHAR(150) NOT NULL,
    changed_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks         VARCHAR(500),

    CONSTRAINT fk_request_history_request FOREIGN KEY (request_id) REFERENCES requests (id)
);

CREATE INDEX idx_request_history_request ON request_status_history (request_id);


-- Extend the documents table's owner_type/document_type constraints to allow
-- request images. Postgres requires dropping and recreating a CHECK constraint
-- to widen it — there's no ALTER CHECK.
ALTER TABLE documents DROP CONSTRAINT chk_documents_owner_type;
ALTER TABLE documents ADD CONSTRAINT chk_documents_owner_type
    CHECK (owner_type IN ('CHILDRENS_HOME', 'SERVICE_PROVIDER', 'REQUEST'));

ALTER TABLE documents DROP CONSTRAINT chk_documents_type;
ALTER TABLE documents ADD CONSTRAINT chk_documents_type
    CHECK (document_type IN (
        'GOVERNMENT_REGISTRATION_CERTIFICATE', 'NCPA_DOCUMENT',
        'QUALIFICATION_CERTIFICATE', 'POLICE_CLEARANCE_REPORT', 'IDENTITY_DOCUMENT',
        'ADDITIONAL_PROOF', 'REQUEST_IMAGE'
    ));
