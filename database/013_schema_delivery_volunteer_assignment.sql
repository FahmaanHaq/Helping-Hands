-- ============================================================
-- Helping Hands Platform — Schema: Delivery Volunteer Assignment
-- ============================================================

-- Fixes a real gap: a Donor could request "a delivery volunteer" at pledge
-- time, but nothing let an actual Delivery Volunteer discover or claim that
-- task — the request simply left the public marketplace once pledged, with
-- no queue for volunteers to see it.
ALTER TABLE requests ADD COLUMN delivery_volunteer_id BIGINT REFERENCES users (id);
CREATE INDEX idx_requests_delivery_volunteer ON requests (delivery_volunteer_id);
