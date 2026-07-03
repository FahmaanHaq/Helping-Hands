-- ============================================================
-- Helping Hands Platform — Schema: Resubmission Support
-- ============================================================

ALTER TABLE childrens_homes ADD COLUMN resubmission_count INT NOT NULL DEFAULT 0;
ALTER TABLE service_providers ADD COLUMN resubmission_count INT NOT NULL DEFAULT 0;
