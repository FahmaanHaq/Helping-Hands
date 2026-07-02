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

Donation/service requests, request lifecycle tracking, reputation, reports,
and admin moderation (suspend/ban) screens are **not** in this slice — they're
the next pieces of work, built on exactly this foundation.

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

## Polish pass

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
