# Helping Hands Platform — Project Documentation

This document covers all 18 sections requested in the original project
specification. It complements, rather than replaces, the top-level
`README.md` (which is the faster "get it running" reference) and the live
Swagger UI at `/swagger-ui.html` on the deployed backend (which is the
authoritative, always-up-to-date API contract).

---

## 1. Project Overview

Helping Hands is a platform connecting government-registered children's
homes with donors and service providers, built around verification,
transparency, and child safety. Four roles interact on the platform:

- **Children's Home** — registers, gets verified, posts donation/service
  requests, tracks fulfilment, rates fulfillers on completion.
- **Donor** — browses and pledges to fulfil goods requests.
- **Service Provider** — registers with a police-clearance workflow for
  onsite work, browses and pledges to fulfil service requests.
- **Administrator** — verifies Homes and Providers, moderates content,
  suspends misbehaving accounts, resolves disputes, views platform-wide
  reports.

The system was built incrementally as a demo/MVP: authentication → identity
verification workflows → document uploads → the request marketplace →
reputation → admin oversight → reporting → email flows → content moderation
→ testing and documentation. Every module beyond authentication builds on
the ones before it; none were built in isolation from the others.

**Current status:** every functional module in the original spec is
implemented except a notification system (status changes are visible on
refresh but nothing pushes a notification yet).

---

## 2. Architecture Diagram Explanation

```
                    ┌─────────────────────┐
                    │   Browser (User)    │
                    └──────────┬──────────┘
                               │ HTTPS
                    ┌──────────▼──────────┐
                    │  React SPA (Vite)   │   Vercel
                    │  - React Router     │
                    │  - Context API auth │
                    │  - Axios + JWT      │
                    └──────────┬──────────┘
                               │ REST/JSON (+ multipart for uploads)
                    ┌──────────▼──────────┐
                    │ Spring Boot 3 API   │   Render
                    │  Clean Architecture │
                    │  (see Section 5)    │
                    └──────┬───────┬──────┘
                           │       │
              ┌────────────▼──┐ ┌──▼─────────────┐
              │  PostgreSQL   │ │  Local Disk /   │
              │  (Neon)       │ │  Storage        │
              └───────────────┘ └─────────────────┘
                           │
                    ┌──────▼──────┐
                    │  SMTP (Mail) │  Gmail / Brevo etc.
                    └─────────────┘
```

Three independently-hosted pieces (Vercel, Render, Neon) rather than one
monolith host — this was a deliberate demo-hosting choice (each has a
usable free tier) but the same architecture works unchanged on a single VPS
via the provided `docker-compose.yml`, or split across dedicated
infrastructure at real scale. The frontend never talks to the database or
storage directly — everything goes through the API, which is the only
component with credentials to either.

---

## 3. Database Design

Eight migrations, applied in order, build the schema:

| Migration | Adds |
|---|---|
| `001_schema_auth.sql` | `users`, `roles`, `user_roles` |
| `002_seed_roles.sql` | Seeds the four `RoleName` values |
| `003_schema_verification.sql` | `childrens_homes`, `service_providers`, `service_provider_categories` |
| `004_schema_documents.sql` | `documents` (polymorphic owner) |
| `005_schema_requests.sql` | `requests`, `request_status_history`; widens `documents` constraints for `REQUEST` |
| `006_schema_reputation_moderation.sql` | `ratings`, `audit_log`; suspension columns on `users` |
| `007_schema_tokens.sql` | `verification_tokens` (email verification + password reset) |
| `008_schema_moderation.sql` | Flagging columns on `requests` |

**Platform-wide rules enforced on every business table** (per the original
spec): `is_active BIT DEFAULT 1`, `created_by`, `created_date`,
`modified_by`, `modified_date` — implemented once via `BaseEntity`, which
every JPA entity except three deliberately-immutable audit-style tables
(`request_status_history`, `audit_log`, `verification_tokens`) extends. No
table is ever hard-deleted; suspension, rejection, and moderation are all
soft-delete or status-flag operations.

**Unique constraints:** `users.email`, `users.username`,
`childrens_homes.registration_number`, `ratings.request_id` (one rating per
request), `verification_tokens.token_hash`.

---

## 4. Relationships

```
User ──1:1── ChildrensHome        (a Home account has exactly one profile)
User ──1:1── ServiceProvider      (a Provider account has exactly one profile)
User ──M:N── Role                 (via user_roles)

ChildrensHome ──1:N── Request           (a Home posts many requests)
Request ──N:1── User (pledgedBy)        (nullable until PLEDGED)
Request ──1:N── RequestStatusHistory    (full audit trail)
Request ──1:1── Rating                  (optional, only after COMPLETED)
Request ──1:N── Document (owner_type=REQUEST)

ChildrensHome ──1:N── Document (owner_type=CHILDRENS_HOME)
ServiceProvider ──1:N── Document (owner_type=SERVICE_PROVIDER)
ServiceProvider ──1:N── ServiceCategory (via service_provider_categories)

User ──1:N── VerificationToken     (email verification / password reset)
Rating ──N:1── User (ratedUser)    (the Donor/Provider being rated)
```

The `documents` table is intentionally polymorphic (`owner_type` +
`owner_id`, no FK constraint) rather than three separate tables — see the
`Document` entity's own code comment for why a real foreign key isn't used
there, and how ownership is validated in application code instead.

---

## 5. Backend Architecture

Clean Architecture, four layers, one-directional dependency flow:

```
domain/         Entities only. No Spring, no persistence annotations beyond
                JPA mapping. Business rules that belong to the entity itself
                live here (e.g. ServiceProvider.isEligibleToOfferServices()).

application/    Services (business logic, transactions) and DTOs (the only
                objects that cross the API boundary — entities never do).

infrastructure/ Repositories, security (JWT, filters), storage, email —
                anything that talks to the outside world.

api/            Controllers (thin — validate input, call a service, wrap
                the response) and global exception handling.
```

Controllers depend on services; services depend on repositories and each
other; nothing depends "upward." This is what let 8+ modules get added
without ever needing to restructure earlier ones.

---

## 6. Frontend Architecture

React 18 + Vite, no Redux — Context API (`AuthContext`) is sufficient at
this size. Structure:

```
components/   Reusable, mostly presentational (StatCard, Pagination,
              RequestStatusBadge, DocumentUploadWidget, etc.)
components/Layout/  Sidebar, TopBar, AppShell (the authenticated app frame)
pages/        One file per route, owns its own data-fetching
services/     One file per backend resource, thin axios wrappers — pages
              never call axios directly
context/      AuthContext — session, roles, login/register/logout
hooks/        useAuth (thin wrapper around AuthContext)
routes/       ProtectedRoute (auth + role gating)
```

Role-based UI is driven entirely by `hasRole()` reading the JWT-derived
roles out of `AuthContext` — the same source of truth the backend uses for
`@PreAuthorize`, so the two can't drift into showing UI for actions the
backend will actually reject (though the backend check is what's
authoritative; the frontend check is purely for UX).

---

## 7. API Documentation

Full, always-current API documentation is served live by the backend at
`/swagger-ui.html` (OpenAPI spec at `/v3/api-docs`) — every endpoint,
request/response shape, and validation rule is generated directly from the
code, so it can't drift out of sync the way a hand-written doc would.

Endpoint groups (see Swagger for full detail on each):

| Base path | Covers |
|---|---|
| `/api/v1/auth` | Register, login, email verification, password reset, admin bootstrap |
| `/api/v1/childrens-homes` | Home registration and self-profile |
| `/api/v1/service-providers` | Provider registration and self-profile |
| `/api/v1/documents` | Upload, list, download |
| `/api/v1/requests` | Full request lifecycle, browsing, history |
| `/api/v1/users/{id}/reputation` | Reputation lookup |
| `/api/v1/admin/verification` | Approve/reject Homes and Providers |
| `/api/v1/admin/users` | List, suspend, reinstate |
| `/api/v1/admin/moderation` | Flag requests, remove documents |
| `/api/v1/admin/reports` | Summary stats, CSV/PDF export |
| `/api/v1/admin/audit-log` | Read-only action history |
| `/api/v1/admin/dashboard` | Verification stat aggregates |

---

## 8. Authentication Flow

1. **Register** (`POST /auth/register`) — creates the account with the
   chosen role (Administrator excluded from self-selection), issues a JWT
   immediately (login isn't blocked on verification), and fires off an
   email-verification email in the background.
2. **Login** (`POST /auth/login`) — Spring Security's
   `AuthenticationManager` validates credentials; a JWT is issued containing
   the user's roles as claims.
3. **Every subsequent request** carries `Authorization: Bearer <token>`.
   `JwtAuthenticationFilter` validates the signature/expiry *and*
   re-checks `isAccountNonLocked()`/`isEnabled()` against the live DB record
   on every request — so a suspension takes effect immediately, even for a
   token issued before the suspension happened.
4. **Email verification** — a SHA-256-hashed, 24-hour token; clicking the
   emailed link calls `GET /auth/verify-email?token=...`.
5. **Forgot/reset password** — a separate 1-hour token of the same shape;
   `POST /auth/forgot-password` never reveals whether the email exists,
   and both this endpoint and `resend-verification` are rate-limited
   (2-minute cooldown) to prevent email-spam abuse.
6. **Admin provisioning** — `POST /auth/register-admin`, gated by an
   `X-Admin-Bootstrap-Token` header matched against the `ADMIN_BOOTSTRAP_SECRET`
   env var, replacing any need for manual database edits to create the
   first admin.

---

## 9. File Upload Flow

1. Frontend sends a `multipart/form-data` POST to `/api/v1/documents` with
   `ownerType`, `ownerId`, `documentType`, optional `remarks`, and the file.
2. `DocumentService` validates size (≤10MB) and type (PDF/JPG/PNG only),
   checks for an exact duplicate, and confirms the caller is either the
   resource's owner or an Administrator (`assertCanUpload`).
3. The file is handed to `FileStorageService` (interface) —
   `LocalFileStorageService` is the only implementation today, writing to
   `storage.local.base-path`. A cloud implementation (S3, R2, etc.) is a
   drop-in replacement; nothing else in the codebase knows or cares which
   storage backend is active.
4. Only metadata is stored in Postgres (`documents` table) — never the file
   bytes themselves.
5. **Viewing rules differ by owner type**: verification documents
   (Children's Home / Service Provider) stay private to the owner and
   Administrators. Request images are part of a public marketplace listing
   and are viewable by any authenticated user — only upload stays
   restricted to the owning Home.
6. **Known limitation**: on ephemeral-disk hosts (Render's free tier),
   uploaded files are wiped on every redeploy. The database records
   survive; the files don't. Documented clearly rather than silently broken.

---

## 10. Module Explanations

1. **Auth & RBAC** — registration, login, JWT, four roles, protected routes.
2. **Children's Home Verification** — registration → `SUBMITTED` →
   admin decision → `APPROVED`/`REJECTED`. Only approved homes can post requests.
3. **Service Provider Verification** — same shape, plus a police-clearance
   rule: onsite providers can't be approved (or pledge to requests) without
   verified clearance; online-only providers bypass it.
4. **Document Upload** — generic, reusable across Homes, Providers, and
   Requests; cloud-ready storage abstraction.
5. **Donation & Service Requests** — the core loop: Homes post, Donors/
   Providers pledge, both track through a 6-state lifecycle with a single
   state-machine endpoint enforcing legal transitions and role permissions.
6. **Reputation & Feedback** — post-completion ratings, computed reputation,
   and a real enforcement rule blocking low-reputation users from pledging.
7. **Admin Oversight & Moderation** — user suspension (with immediate JWT
   invalidation), admin dispute-resolution override on request cancellation,
   append-only audit log.
8. **Reports & Dashboard** — role-aware stat cards, charts, CSV and PDF export.
9. **Content Moderation** — flagging independent of lifecycle status,
   per-document removal without cancelling the parent request.
10. **Email Verification & Password Reset** — real SMTP sending, hashed
    single-use tokens, rate-limited.
11. **Marketplace Search/Filters** — category and urgency filtering via
    JPA Specifications.
12. **Testing** — unit tests covering the highest-risk logic (request
    transitions, reputation restriction, token handling) plus a small
    frontend test suite (see Section 16 for tooling).

---

## 11. Folder Structure

```
helping-hands/
├── backend/
│   ├── src/main/java/com/helpinghands/
│   │   ├── domain/entity/          All JPA entities + enums
│   │   ├── application/
│   │   │   ├── dto/                Grouped by feature (request/, rating/, admin/, ...)
│   │   │   └── service/            Business logic
│   │   ├── infrastructure/
│   │   │   ├── repository/         Spring Data repositories + Specifications
│   │   │   ├── security/           JWT filter, security config
│   │   │   ├── storage/            FileStorageService + local impl
│   │   │   └── email/              EmailService + SMTP impl
│   │   └── api/
│   │       ├── controller/         One per resource
│   │       └── exception/          Global handler
│   ├── src/main/resources/application.yml
│   ├── src/test/java/...           Unit tests, mirrors main structure
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/ (+ Layout/, __tests__/)
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/ (+ __tests__/)
│   │   ├── hooks/
│   │   ├── routes/
│   │   └── styles/index.css
│   ├── public/favicon.svg
│   ├── vercel.json
│   ├── Dockerfile
│   └── package.json
├── database/                       8 numbered SQL migrations, run in order
├── docs/PROJECT_DOCUMENTATION.md   This file
├── docker-compose.yml
└── README.md
```

---

## 12. Setup Guide

See `README.md` → **Backend setup** / **Frontend setup** for the full
step-by-step (Java 17, Node 18, PostgreSQL 14+ prerequisites; `.env`
configuration; running migrations; `mvn spring-boot:run` / `npm run dev`).
Repeating it here would just create a second copy to keep in sync — the
README is the maintained source for local setup.

---

## 13. Deployment Guide

Two documented paths:

- **Single VPS** — `docker-compose.yml` brings up Postgres + backend +
  frontend + Caddy (automatic HTTPS) with one command. Full walkthrough in
  the README's hosting section.
- **Free-tier managed platforms** (what this project actually runs on) —
  Neon (Postgres) + Render (Spring Boot backend, Docker-based) + Vercel
  (React frontend, auto-deploy on `git push`). Full env-var-by-env-var setup
  is in the README.

---

## 14. Environment Config

**Backend** (`backend/.env.example` is the maintained source of truth):

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSL_MODE` | Postgres connection |
| `JWT_SECRET`, `JWT_EXPIRATION_MS` | Token signing |
| `ADMIN_BOOTSTRAP_SECRET` | Gates `/auth/register-admin` |
| `STORAGE_BASE_PATH` | Local file storage root |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` | SMTP |
| `FRONTEND_URL` | Used to build links inside emails |

**Frontend:**

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend origin in production (local dev uses Vite's proxy instead) |

---

## 15. Run Instructions

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm run dev

# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
npm test
```

---

## 16. Dependencies

**Backend (key ones, see `pom.xml` for the full list):**

| Dependency | Why |
|---|---|
| Spring Boot 3 (Web, Security, Data JPA, Validation, Mail) | Core framework |
| PostgreSQL JDBC driver | Production database |
| JJWT | JWT signing/parsing |
| springdoc-openapi | Live Swagger UI |
| Apache PDFBox | PDF report generation (Apache 2.0 — no licensing complications) |
| Lombok | Boilerplate reduction (getters/setters/constructors) |
| H2 *(test scope, available for future integration tests)* | In-memory DB for tests |

**Frontend:**

| Dependency | Why |
|---|---|
| React 18 + React Router | UI + routing |
| Axios | HTTP client with a JWT interceptor |
| Recharts | Admin dashboard/reports charts |
| lucide-react | Icon set |
| Vitest + React Testing Library | Test runner (see Section 12 above) |

---

## 17. Scalability Suggestions

Honest, in priority order if this ever needs to handle real load:

1. **File storage → cloud** (S3/R2/Backblaze). Local disk doesn't survive
   redeploys and can't be shared across multiple backend instances.
2. **Rate limiter → Redis.** The current `RateLimiterService` is an
   in-memory map — correct for one instance, wrong the moment there's more
   than one, since each instance would track its own independent cooldowns.
3. **Read replicas / connection pooling tuning** once request volume grows
   — HikariCP defaults are fine for a demo, not for sustained high concurrency.
4. **CDN in front of the frontend** — Vercel already does this; if
   self-hosting via the VPS path, add Cloudflare or similar in front of Caddy.
5. **Database indexing is already in place** for the columns that matter
   today (status, category, owner lookups) — revisit with real query plans
   (`EXPLAIN ANALYZE`) once there's production traffic to profile.
6. **Horizontal scaling of the API itself** is already low-friction: JWT
   auth is stateless, so adding more backend instances behind a load
   balancer needs no session-affinity — the only current blocker to true
   multi-instance operation is items 1 and 2 above.

*(Async email sending, originally listed here as a suggestion, is now
implemented — see Section 8/9 above and `SmtpEmailService`'s `@Async`
methods. A hung SMTP connection can no longer block an API request.)*

---

## 18. Security Best Practices

**Implemented:**
- Passwords hashed with BCrypt; never logged or returned in any response.
- JWTs signed with HS256; secret is environment-provided, never hardcoded.
- Role-based access control enforced server-side at two layers (URL-pattern
  rules in `SecurityConfig` + method-level `@PreAuthorize`), not just hidden
  in the frontend.
- Verification/reset tokens stored as SHA-256 hashes, never in plaintext;
  single-use (marked consumed on validation); short expiries (1–24h).
- Enumeration prevention: login failures, forgot-password, and the
  bad-credentials path all return identical responses regardless of which
  part was wrong or whether the account exists.
- Suspended accounts are locked out immediately — even a JWT issued before
  the suspension is rejected on the very next request, not just at the next login.
- Rate limiting on password-reset and resend-verification (2-minute cooldown).
- No hard deletes anywhere — every removal is a soft-delete or status flag,
  preserving a full audit trail by construction.
- CORS locked to known frontend origins (`localhost` in dev, the deployed
  Vercel domain pattern in production) rather than `*`.
- File upload validation on both size and MIME type, with duplicate detection.
- SQL injection is structurally avoided — all queries go through JPA/JPQL
  or parameterized `@Query` methods, no string-concatenated SQL anywhere.

**Known gaps, stated plainly rather than glossed over:**
- No login-attempt rate limiting (only password-reset/verification are
  limited) — brute-force protection on the login endpoint itself isn't built.
- No CSRF token — acceptable here because the API is stateless JWT-auth
  (no cookies), which sidesteps the classic CSRF threat model, but worth
  being explicit about rather than assuming.
- No secrets manager integration — env vars are the only mechanism; fine
  for Render/Vercel's built-in encrypted env storage, would need a Vault/AWS
  Secrets Manager equivalent at larger organizational scale.
- No dependency vulnerability scanning wired into a CI pipeline (there is
  no CI pipeline at all yet — every deploy is a manual `git push`).
