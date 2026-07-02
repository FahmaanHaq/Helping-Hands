-- ============================================================
-- Helping Hands Platform — Schema: Content Moderation
-- Adds independent flagging to requests (separate from lifecycle status).
-- Document soft-delete needs no schema change — is_active already exists
-- per the platform-wide audit column rule.
-- ============================================================

ALTER TABLE requests ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE requests ADD COLUMN flag_reason VARCHAR(500);
ALTER TABLE requests ADD COLUMN flagged_by VARCHAR(150);
ALTER TABLE requests ADD COLUMN flagged_date TIMESTAMP;

CREATE INDEX idx_requests_flagged ON requests (flagged);
