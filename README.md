# Helping Hands — Auth & RBAC Skeleton

This is the **foundation slice** of the Helping Hands platform: a working,
runnable skeleton covering user registration, login, JWT issuance, and
role-based access control (Donor / Service Provider / Children's Home /
Administrator). Every later module (verification workflows, donation
requests, tracking, reputation, admin oversight, reports) is designed to
be built as an additional vertical slice on top of this same skeleton —
same patterns, same conventions, no rewrites needed.

## What's included

```
helping-hands/
├── backend/           Spring Boot 3 (Java 17), clean-architecture layout
│   ├── domain/        Entities (User, Role, BaseEntity w/ audit columns)
│   ├── application/   DTOs, services (AuthService, UserDetailsService)
│   ├── infrastructure/ Repositories, JWT + Spring Security config
│   └── api/           Controllers, global exception handling
├── frontend/          React 18 + Vite, Context API auth, protected routes
└── database/          SQL schema + seed scripts (PostgreSQL)
```

## Why these choices

- **Clean Architecture on the backend** — domain entities never depend on
  Spring or persistence details; controllers stay thin; business rules
  live in `application/service`. This is what lets you add the next 8
  modules without touching this one.
- **Stateless JWT auth** — no server-side session store, so this scales
  horizontally behind a load balancer with zero sticky-session concerns.
- **`BaseEntity` with mandatory audit columns** — every future entity
  (ChildrensHome, DonationRequest, ServiceProvider, etc.) extends it, so
  `IsActive` / `CreatedBy` / `CreatedDate` / `ModifiedBy` / `ModifiedDate`
  and the soft-delete rule are enforced by inheritance, not convention.
- **Role model as a many-to-many join**, not a single column — mirrors
  how real platforms eventually need a user in more than one role
  (e.g. a Service Provider who is also a Donor).
- **React Context + protected routes** — no Redux needed at this size;
  swap in a state library later only if the app genuinely outgrows Context.

## Prerequisites

- Java 17+, Maven 3.9+
- Node.js 18+
- PostgreSQL 14+ (or adjust `pom.xml` + `application.yml` for MySQL)

## Backend setup

```bash
cd backend
cp .env.example .env        # then edit values, especially JWT_SECRET

# Create the database, then apply the schema:
psql -U postgres -c "CREATE DATABASE helping_hands;"
psql -U postgres -d helping_hands -f ../database/001_schema_auth.sql
psql -U postgres -d helping_hands -f ../database/002_seed_roles.sql

# Export the .env vars into your shell, or use a tool like direnv, then:
mvn spring-boot:run
```

API comes up on `http://localhost:8080`. Swagger UI at
`http://localhost:8080/swagger-ui.html`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App comes up on `http://localhost:5173`. The Vite dev server proxies
`/api/*` to `http://localhost:8080` (see `vite.config.js`), so no CORS
juggling in local dev.

## Try it end-to-end

1. `POST /api/v1/auth/register` with a `DONOR` role, or use the Register page.
2. Log in — you get back a JWT plus your granted roles (e.g. `ROLE_DONOR`).
3. Every subsequent request from the frontend automatically carries
   `Authorization: Bearer <token>` (see `src/services/api.js`).
4. Hit `GET /api/v1/admin/ping` with a non-admin token → `403`. Register
   an `ADMINISTRATOR`-role user directly in the DB (admins are
   provisioned, not self-registered — see `RegisterPage.jsx` comment) and
   the same call succeeds.

## Security notes baked in

- Passwords hashed with BCrypt, never stored or logged in plaintext.
- Generic "Invalid username/email or password" message on auth failure —
  never reveals which field was wrong (prevents username enumeration).
- JWT secret and DB credentials are environment-driven; nothing sensitive
  is hardcoded or committed (`.env` is gitignored).
- `ddl-auto: validate` in the default profile — schema changes go through
  reviewed SQL scripts in `/database`, not silent Hibernate auto-generation.

## Extending this skeleton (next slices)

Each new module should follow the same four-folder pattern:
1. Entity extending `BaseEntity` in `domain/entity`
2. Service in `application/service`, DTOs in `application/dto`
3. Repository in `infrastructure/repository`
4. Controller in `api/controller`, secured via `SecurityConfig` path rules
   and/or `@PreAuthorize`

Suggested build order, given the dependencies between modules:
1. Children's Home registration + verification workflow
2. Service Provider registration + verification workflow (police clearance rule)
3. Document upload module (used by both of the above)
4. Donation & Service Request management
5. Request lifecycle tracking + status history
6. Reputation & feedback
7. Admin oversight & moderation + audit log
8. Reports & dashboard

## Not included yet (by design, per your chosen scope)

The **Notification system** (spec calls for notifications on status changes —
verification approved/rejected, request pledged, etc.) is not built yet.
Status changes are currently silent until someone refreshes the page. That's
explicitly the next planned piece of work.

## Content Moderation

- **Flagging is independent of lifecycle status.** A `Request` can be
  `flagged` (with a reason, who flagged it, and when) without touching its
  `CREATED`/`PLEDGED`/etc. status — so an admin investigating a
  questionable listing doesn't have to force it into `CANCELLED` just to
  hide it. Flagged requests are excluded from the public marketplace
  browse for everyone except Administrators (`RequestSpecifications.notFlagged()`
  in `RequestService.browse`).
- **Individual document removal** — `DELETE /api/v1/admin/moderation/documents/{id}`
  soft-deletes a single image/document (e.g. an inappropriate request photo)
  without cancelling the request or profile it belongs to. Consistent with
  the platform's no-hard-delete rule — `is_active = false`, not a real DELETE.
- Both document removal (`DOCUMENT_REMOVED`) and flagging/unflagging
  (`REQUEST_FLAGGED` / `REQUEST_UNFLAGGED`) are logged to the audit trail.

## Marketplace search & filters

`GET /api/v1/requests` now accepts `requestType`, `goodsCategory`,
`serviceCategory`, and `urgency` as optional query params, combined with
`status` via Spring Data JPA Specifications (`RequestSpecifications`) rather
than a growing pile of derived-query methods. Donors filter by goods
category, Service Providers by service category, both by urgency — the
frontend fixes `requestType` to match the logged-in role automatically
rather than exposing a redundant type selector.

## PDF export (implemented)

`GET /api/v1/admin/reports/export/pdf` — a real PDF, not a placeholder.
Built with **Apache PDFBox** (Apache 2.0 license — no legal complications
for production use, unlike some PDF libraries with AGPL/commercial terms).
There's no table-layout engine in plain PDFBox, so `PdfReportService` hand-tracks
a Y-cursor and starts new pages as content overflows — adequate for this
report's shape (summary stats + a plain-text request listing); would need a
proper reporting library (JasperReports etc.) if this grows into multi-column
layouts or embedded images. CSV export remains available too, for
spreadsheet-style consumption of the raw data rather than a formatted report.

## Bug fix: unverified Service Providers could pledge

Found while reviewing the spec's "prevent unverified providers from offering
services" rule: the pledge check only verified the *role* (`SERVICE_PROVIDER`),
not whether that provider's own profile was actually `APPROVED` or had police
clearance verified where required. A rejected or still-pending provider could
pledge to a SERVICE request. Fixed in `RequestService` — pledging to a
SERVICE request now also calls `ServiceProvider.isEligibleToOfferServices()`.
Donors are unaffected (they're never subject to a verification workflow by
design).

## Email Verification & Forgot Password

- **Real SMTP email sending** via `spring-boot-starter-mail`, not just token
  generation with nowhere for it to go. `EmailService` is an interface
  (`SmtpEmailService` the only implementation today) so swapping in a
  transactional email provider (SendGrid, SES, Postmark) later is additive.
- **Shared `VerificationToken` table** for both email verification and
  password reset — same shape, different `TokenType`. Tokens are stored as
  a SHA-256 hash, never in plaintext, mirroring how passwords are handled.
  Requesting a new token invalidates any previous unused one of that type.
- Email verification: 24-hour expiry. Password reset: 1-hour expiry
  (shorter, since a compromised reset link is more immediately dangerous).
- **Login is not gated on email verification** — a deliberate product
  choice to reduce friction; unverified users see a persistent banner
  (`EmailVerificationBanner`) with a resend option instead of being locked
  out. Change this in `SecurityConfig`/`AuthService` if you'd rather block
  login entirely until verified.
- **Forgot-password never reveals whether an email exists** — the endpoint
  returns the same response either way, and only sends an email if a match
  is found. This is the same enumeration-prevention principle already used
  for login failures.
- Administrator accounts (via `/register-admin`) are marked verified
  immediately — they're provisioned, not self-registered, so there's no
  inbox to confirm.

**Required setup**: you need real SMTP credentials for this to work. See
`backend/.env.example` for the `MAIL_*` variables and a couple of free
options (Gmail App Password, Brevo's free SMTP tier). Without them, the
app still runs — sends just fail silently into the logs rather than
blocking registration.

## Reputation & Feedback module

- Children's Homes rate the Donor/Service Provider who fulfilled a request,
  but only after it reaches `COMPLETED`, and only once per request
  (`POST /api/v1/requests/{id}/rating`, 1–5 stars + optional comment).
- Reputation is computed on read (`GET /api/v1/users/{userId}/reputation`)
  rather than stored as a running total — simpler and always correct, at the
  cost of an aggregate query per lookup. Fine at this scale; revisit if this
  table ever gets large.
- **Low-reputation restriction**: a user with 3+ ratings and an average
  below 2.5 is blocked from pledging to new requests
  (`RatingService.MIN_RATINGS_FOR_RESTRICTION` / `MIN_AVERAGE_SCORE`) —
  enforced server-side in `RequestService`, not just hidden in the UI.

## Admin Oversight & Moderation

- **Suspend / reinstate accounts** — `PATCH /api/v1/admin/users/{id}/suspend`
  and `/reinstate`. A suspended account can't log in (`LockedException` is
  now handled distinctly in `GlobalExceptionHandler`) and — importantly —
  an *already-issued* JWT stops working immediately too, since
  `JwtAuthenticationFilter` now re-checks `isAccountNonLocked()` /
  `isEnabled()` on every request, not just at login.
- Administrator accounts can't be suspended through this endpoint, and you
  can't suspend yourself — both throw a 403/400 rather than silently no-op'ing.
- **Dispute resolution**: Administrators can cancel a request from *any*
  non-terminal status (not just `CREATED`/`PLEDGED` like a normal home can),
  via the same `PATCH /api/v1/requests/{id}/status` endpoint everyone else
  uses — one override rule in `RequestService`, not a parallel admin-only path.
- **Audit log** — `AuditLogEntry` is an intentionally minimal, append-only
  table (no soft-delete columns — an audit trail that can be edited isn't
  one). Currently logged: verification approvals/rejections, user
  suspensions/reinstatements, and admin account provisioning.
  `GET /api/v1/admin/audit-log` for the read-only view.

## Reports & Dashboard

- `GET /api/v1/admin/reports/summary` — request counts by type/status,
  user counts by role, suspended-user count, and platform-wide average
  rating, all in one call.
- **CSV export** of all requests (`GET /api/v1/admin/reports/requests/export`)
  — opens natively in Excel/Sheets, satisfying the spec's "Excel export"
  requirement. **PDF export is not implemented** — flagging that honestly
  rather than half-building it; adding a PDF library later is additive, not
  a rework of this controller.
- Reports page includes two pie charts (request type breakdown, request
  outcome breakdown) alongside the stat cards.

## Document Upload module (added)

- Generic `documents` table with polymorphic ownership (`owner_type` +
  `owner_id`), covering both Children's Home and Service Provider documents
  with one schema.
- Storage is abstracted behind `FileStorageService` — `LocalFileStorageService`
  is the only implementation today, writing to `storage.local.base-path`.
  Swapping in S3/Azure Blob/GCS later is a new class + a Spring profile,
  no changes to `DocumentService` or any controller.
- Validation: 10MB max, PDF/JPG/PNG only, duplicate (same type + filename)
  rejected.
- Ownership enforced server-side: only the profile's own user or an
  Administrator can upload, list, or download a given document.

**Important limitation if deployed on Render's free tier (or similar
ephemeral-disk hosts):** uploaded files live on local disk and are wiped on
every redeploy or restart. Fine for a demo/walkthrough, not fine for anything
persistent. The fix when you're ready is a `CloudFileStorageService`
implementation (e.g. backed by S3-compatible storage like Cloudflare R2 or
Backblaze B2, both of which have free tiers) — the interface is already
shaped for that swap.

## Dashboard (redesigned)

Role-aware stat cards and a chart, not just a static welcome message:
- **Administrator** — pending/approved/rejected counts across both Homes and
  Providers, plus a bar chart breakdown (`VerificationStatusChart`, via
  `recharts`), backed by `GET /api/v1/admin/dashboard/verification-stats`.
  Also links to the full request overview.
- **Children's Home** — verification status, active/completed request counts,
  and documents uploaded, all pulled from real data.
- **Service Provider** — verification + police clearance status, pledge
  count, and documents uploaded.
- **Donor** — open goods-request count and pledge count, both real numbers
  now that the Request module exists.

## Navigation (sidebar)

Replaced the old top navbar with a persistent left sidebar (desktop) /
slide-out drawer (mobile), role-based menu items, active-route highlighting,
and a small custom "helping hands" logomark reused as the site favicon
(`frontend/public/favicon.svg`).

## Donation & Service Request module

The core product loop: Children's Homes post requests, Donors/Service
Providers pledge to fulfil them, and both sides track the request through
its full lifecycle.

- **Lifecycle**: `CREATED → PLEDGED → ACCEPTED → IN_PROGRESS → DELIVERED →
  COMPLETED`, with `CANCELLED` reachable from `CREATED` or `PLEDGED`.
- **Single state-machine endpoint** — `PATCH /api/v1/requests/{id}/status`
  handles every transition. The legal-transition table and the "who's
  allowed to make this specific change" rules both live in one place
  (`RequestService`), rather than being spread across one endpoint per
  transition.
- **Role rules enforced server-side**: only the owning home can accept a
  pledge or confirm completion; only a Donor can pledge to a GOODS request
  and only a Service Provider to a SERVICE request; only the pledged user
  can mark delivery; Administrators can override any transition (dispute
  resolution).
- **Full audit trail** — every transition is recorded in
  `request_status_history` with who changed it, when, and any remarks.
  `GET /api/v1/requests/{id}/history` returns the timeline.
- **Request images** reuse the Document module (`DocumentOwnerType.REQUEST`)
  rather than a separate upload path — same validation, same storage
  abstraction. Unlike verification documents, request images are viewable
  by any authenticated user (it's a public marketplace listing), while
  upload stays restricted to the owning home.
- **Pages**: `/requests` (role-adaptive: own requests for Homes, open
  marketplace + pledges for Donors/Providers, full filterable list for
  Admins), `/requests/new` (create), `/requests/:id` (detail, status
  actions, image gallery, history timeline).

## Formal project documentation

`docs/PROJECT_DOCUMENTATION.md` covers the full 18-section documentation set
originally specified (architecture, database design, API docs, deployment
guide, security best practices, etc.) — this README stays focused on
"get it running"; that file is the complete formal reference.

## Testing

- **Backend**: `cd backend && mvn test` — unit tests (JUnit 5 + Mockito, no
  database required) covering the highest-risk logic: the full Request
  lifecycle state machine and role-permission rules
  (`RequestServiceTest`), the reputation restriction threshold
  (`RatingServiceTest`), token hashing/expiry/replay-protection
  (`TokenServiceTest`), and Service Provider eligibility
  (`ServiceProviderTest`).
- **Frontend**: `cd frontend && npm test` — Vitest + React Testing Library,
  covering `Pagination` (the component resolving the fake-pagination gap),
  `RequestStatusBadge`, and `AuthContext`'s role-checking logic.
- Neither suite is exhaustive — they're deliberately aimed at the logic
  most likely to silently break something important (permission checks,
  state transitions, security-sensitive token handling) rather than
  chasing 100% coverage on presentational code.

## This round's fixes

- **Rate limiting** — `forgot-password` and `resend-verification` now
  enforce a 2-minute cooldown (`RateLimiterService`, in-memory — fine for
  one instance, would need Redis if this ever runs as more than one).
  Closes an email-spam / SMTP-quota-abuse gap that had been sitting open.
- **Flagged Content queue** — a dedicated admin page (`/admin/flagged`)
  listing everything currently flagged, across all lifecycle statuses,
  rather than requiring an admin to manually page through every status
  filter looking for flag icons.
- **Real pagination everywhere** — Requests (marketplace, my-requests,
  pledges), Users, Audit Log, and the Verification Queue all now page
  through the backend's real `Page` support (10 items/page) via a shared
  `Pagination` component, instead of fetching up to 50 records flat with
  no navigation.

## Earlier polish pass

- **Admin provisioning** — replaced the "register normally, then manually
  UPDATE the role in SQL" workaround with a real endpoint:
  `POST /api/v1/auth/register-admin`, gated by an `X-Admin-Bootstrap-Token`
  header that must match the `ADMIN_BOOTSTRAP_SECRET` environment variable.
  This keeps admin creation out of the public registration form entirely
  while still being a proper API call rather than a manual DB edit.
  **Set a real secret before deploying** — generate one with
  `openssl rand -base64 32`.
- **Dashboard stats are now real data** everywhere, not placeholders (see
  above).
- **Favicon** added, matching the sidebar brand mark.
