-- ============================================================
-- Seed: Platform roles (must match RoleName enum in the backend)
-- ============================================================

INSERT INTO roles (name, created_by) VALUES
    ('DONOR', 'system'),
    ('SERVICE_PROVIDER', 'system'),
    ('CHILDRENS_HOME', 'system'),
    ('ADMINISTRATOR', 'system')
ON CONFLICT (name) DO NOTHING;

-- Optional: a single seeded administrator for first-run bootstrap.
-- Password below is a bcrypt hash of "ChangeMe123!" — rotate immediately after first login.
-- INSERT INTO users (full_name, username, email, password_hash, email_verified, created_by)
-- VALUES ('Platform Admin', 'admin', 'admin@helpinghands.local',
--         '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5Xq5tYJPjJj9V4W2Ci2gGgV2N9SsW',
--         TRUE, 'system');
--
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT u.id, r.id FROM users u, roles r
-- WHERE u.username = 'admin' AND r.name = 'ADMINISTRATOR';
