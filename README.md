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

## Notification System

The last module from the original spec — every module now fires a
notification through two channels: an in-app record (bell icon in the top
bar, dropdown list, unread badge) and an email (reusing the same
`EmailService`/SMTP infrastructure as verification and password reset,
and inheriting the same `@Async` fix that stops a slow mail server from
ever blocking a request).

**Events that notify:**
- Children's Home / Service Provider verification approved or rejected
- Request pledged (→ notifies the Home), accepted (→ notifies the
  pledged Donor/Provider), delivered (→ notifies the Home), completed
  (→ notifies the pledged user), cancelled (→ notifies both sides)
- A rating is received (→ notifies the rated Donor/Provider)
- Content flagged by an admin (→ notifies the owning Home)
- Account suspended or reinstated

**Design notes:**
- `NotificationService.notify(...)` is the single entry point every other
  service calls — the "who gets told what" logic lives in the caller
  (e.g. `RequestService.notifyOnStatusChange`), not duplicated per event.
- No preference system yet — every event notifies via both channels for
  every user. A "don't email me for every pledge" opt-out is a reasonable
  next step, deliberately out of scope here.
- No real-time push (WebSockets/SSE) — the bell polls
  `GET /api/v1/notifications/unread-count` every 30 seconds. Honest
  trade-off for this scale; a websocket connection would be the natural
  upgrade if instant delivery ever matters.
- Suspended users still get their `ACCOUNT_SUSPENDED` notification stored
  in-app (visible once reinstated) — but since they can't log in while
  suspended, the email is the channel that actually reaches them.

## Email hang fix (Mail sending)

Found via a "Sending..." button that never resolved: there were no SMTP
timeouts configured anywhere, so a slow/unreachable mail server blocked
the *entire HTTP request* — potentially for minutes. Fixed two ways:
explicit 10-second SMTP timeouts (`application.yml`), and making every
`SmtpEmailService` method `@Async` so the calling request returns as soon
as the token/notification is persisted, completely decoupled from SMTP
latency. A broken mail configuration can now only ever show up in server
logs, never as a hung frontend request.

## SPA fallback restored

`frontend/vercel.json` (the rewrite that tells Vercel to serve `index.html`
for any client-side route) had gone missing from the project, causing
*every* direct page load or refresh to 404 unpredictably depending on
which static asset Vercel happened to have cached. Restored and verified
present in the packaged zip.

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

## SRS Gap Closure Batch

A full comparison against the original SRS (see `docs/PROJECT_DOCUMENTATION.md`)
surfaced 13 gaps. All are now closed:

- **Delivery Volunteer role** — a transport-only Donor variant per the SRS
  (no child contact, no police clearance); can pledge to GOODS requests
  exactly like a Donor.
- **Public homepage** (`/` when logged out) — hero, CTAs, a live "Featured
  Requests" section pulling from a genuinely public endpoint
  (`GET /api/v1/public/featured-requests`, no auth), and a "How It Works"
  section. Logged-in visitors are redirected straight to their dashboard.
- **MFA for Administrators** — email-based OTP (6-digit code, 5-minute
  expiry) as a second factor after password verification. `POST /auth/login`
  returns `{mfaRequired: true, userId}` for admins instead of a token;
  `POST /auth/verify-mfa` completes the login. Reuses the same hashed-token
  infrastructure as email verification/password reset (`TokenType.MFA_LOGIN`).
- **Encryption at rest for documents** — every uploaded file is now
  AES-256-GCM encrypted before it touches disk (`STORAGE_ENCRYPTION_KEY` env
  var) and decrypted on read. Losing that key makes existing files
  permanently unreadable — treat it like a database credential.
- **Failed login tracking + brute-force protection + admin alerts** — 5
  failed attempts in 15 minutes temporarily blocks further attempts on that
  identifier *and* notifies every Administrator (`LoginSecurityService`).
  Closes the "no login rate limiting" gap flagged earlier at the same time.
- **Auto-match ("Recommended For You")** — `GET /api/v1/requests/recommended`
  ranks open requests by the caller's past pledge categories, urgency as
  tiebreaker. Shown on Donor/Provider/Delivery-Volunteer dashboards.
- **Fraud/misuse detection** — a bounded heuristic, not a black box: 3+
  cancelled requests tied to the same Home or fulfiller flags that account
  for admin review (`RequestService.checkForMisusePattern`), audit-logged
  and notified to all admins.
- **Inactive user removal** — daily scheduled sweep
  (`SystemMaintenanceService`) soft-deactivates accounts with no login in
  365 days. Administrators are exempt from automatic deactivation.
- **Scheduled reminders** — daily sweep nudges Homes about requests with no
  pledges after 7 days, and nudges fulfillers about stalled
  accepted/in-progress requests after 14 days.
- **"View Donors" directory** — `GET /api/v1/directory/donors` (Children's
  Homes only), exposing only name/username/reputation — never contact info.
- **Delivery method / courier details** — captured on GOODS requests when
  marking IN_PROGRESS or DELIVERED, matching the SRS class diagram's
  `Donation.deliveryMethod`/`courierDetails` fields.
- **Reputation history** — already implicitly satisfied: every `Rating` row
  *is* a timestamped historical entry; no separate table needed.

### Required new setup for this batch

1. Run `database/010_schema_srs_gaps.sql` on Neon.
2. Set `STORAGE_ENCRYPTION_KEY` on Render — generate with `openssl rand -base64 32`.
   **Important**: existing uploaded files were encrypted with the old
   (insecure default) key baked into `application.yml`. If you set a new
   key now, previously-uploaded documents will fail to decrypt. For a demo
   this is fine (re-upload); for anything real, migrate old files before rotating.
3. No new env vars needed for MFA, failed-login tracking, or scheduled
   jobs — they use existing SMTP/DB config.

## Real fix for emails never arriving (root cause found)

The "Sending..." hang was fixed earlier (async + timeouts), but that only
made the *symptom* go away — the actual emails still weren't arriving.
Render's own logs showed why:

```
Failed to send email to ...: Mail server connection failed.
Couldn't connect to host, port: smtp.gmail.com, 587; timeout 10000;
java.net.SocketTimeoutException: Connect timed out
```

This is **not a credentials problem**. Render (like most free/starter-tier
PaaS hosts) blocks outbound SMTP ports (25/465/587) at the network level —
the connection never reaches Gmail at all, regardless of how correct
`MAIL_USERNAME`/`MAIL_PASSWORD` are.

**Fix**: switched the default email backend from SMTP to
[Resend](https://resend.com)'s HTTPS API (`ResendEmailService`) — an API
call over port 443 isn't blocked the way raw SMTP is. `SmtpEmailService`
is still in the codebase, gated behind `EMAIL_PROVIDER=smtp`, for the
docker-compose/VPS self-hosting path where outbound SMTP genuinely isn't
blocked.

### Required setup

1. Sign up at resend.com (free tier), copy your API key.
2. On Render, set:
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_actual_key
   RESEND_FROM_ADDRESS=Helping Hands <onboarding@resend.dev>
   ```
   `onboarding@resend.dev` works immediately with no domain verification —
   fine for a demo. You can switch to a verified domain address later.
3. You can leave the old `MAIL_*` variables in place or remove them —
   they're simply unused while `EMAIL_PROVIDER=resend`.

## All QA Findings Resolved (pre-release hardening pass)

Following the QA audit (see `docs/QA_Audit_Report.docx`), every finding — 4
Critical, 6 Moderate, 5 Minor — has been fixed:

- **Resubmission after rejection** — Children's Homes and Service Providers
  can now edit and resubmit a rejected profile, up to 3 times, tracked via a
  `resubmissionCount` column. The rejection notification mentions this.
  After 3 failed attempts, the UI directs the user to contact an admin.
- **Themed modal dialogs** — every `window.prompt`/`window.confirm`/`alert()`
  in the app has been replaced with a consistent in-app dialog
  (`ModalContext`/`useModal`), used for all admin actions, flagging,
  cancellation reasons, and error messages.
- **Password UX** — a Confirm Password field (with live mismatch feedback)
  on registration, and a show/hide toggle on every password field.
- **Self-service image removal** — a Children's Home can now remove its own
  request images while the request is still open, without needing an admin.
- **Paginated directories** — Donor/Service Provider directory endpoints now
  support page/size like every other list endpoint.
- **Client-side upload validation** — file size/type is checked before the
  upload attempt, not just after.
- **Data-accuracy and error-handling fixes** — corrected a stale-pagination
  bug on admin user search, a silently-failing flag/unflag action (fixed in
  two places), and an inaccurate goods-request count on the Donor dashboard.
- **Homepage CTA intent** — the hero buttons now pre-select the matching
  role on the registration form instead of always defaulting to Donor.

### Required setup for this batch

Run the new migration on Neon:
```sql
-- database/011_schema_resubmission.sql
```
No new environment variables are needed.

## Email Verification — Now a Hard Gate

Previously, email verification was purely a nag banner — every feature worked
regardless of verification status. That's changed: verification is now
**required** before these specific actions:

| Action | Who |
|---|---|
| Registering a Children's Home profile | Children's Home |
| Resubmitting a rejected Home profile | Children's Home |
| Registering a Service Provider profile | Service Provider |
| Resubmitting a rejected Provider profile | Service Provider |
| Creating a request | Children's Home |
| Any request status change (pledge, accept, progress, deliver, complete, cancel) | Whoever's acting |
| Submitting a rating | Children's Home |

**Deliberately NOT gated**: logging in, browsing/searching requests, viewing
your own profile, uploading documents to an already-existing profile. The
idea is a user can always get in and look around — verification is required
only at the point of *committing* to something (creating, pledging, rating).

Enforced via `CurrentUserResolver.getCurrentVerifiedUser()`, a drop-in
replacement for `getCurrentUser()` that throws a 403 with a clear,
actionable message if the account isn't verified yet. The frontend also
proactively disables the relevant buttons (Create Request, Submit for
Verification, Pledge to Fulfil) and shows an inline explanation, rather than
letting the user click through to a surprise error.

Administrators are unaffected — they're provisioned with `emailVerified =
true` from the start, since they never go through self-registration.

## Third email option: SendGrid (no domain needed)

Resend's free sender (`onboarding@resend.dev`) has a real limitation: it
**only delivers to the email address that owns your Resend account** —
every other recipient gets rejected with a 403
(`"You can only send testing emails to your own email address..."`). The
proper fix is verifying a domain at resend.com/domains, but that requires
owning a domain and configuring DNS.

If you don't have a domain yet, **SendGrid** is a genuine alternative, not
just a smaller version of the same limitation: its **Single Sender
Verification** lets you verify one email address you already own (click a
confirmation link — no DNS involved), and that address can then send to
*any* recipient.

### Setup

1. Sign up at sendgrid.com (free tier)
2. **Settings → Sender Authentication → Verify a Single Sender** — enter an
   email you own (e.g. your Gmail), click the confirmation link they send you
3. **Settings → API Keys** → create a key with "Mail Send" permission
4. On Render, set:
   ```
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your_actual_key
   SENDGRID_FROM_ADDRESS=the-address-you-just-verified@gmail.com
   SENDGRID_FROM_NAME=Helping Hands
   ```

Implemented as `SendGridEmailService`, following the exact same pattern as
`ResendEmailService`/`SmtpEmailService` — all three implement `EmailService`
and are mutually exclusive via `@ConditionalOnProperty` on
`app.email-provider`, so exactly one is ever active.

**Honest tradeoff**: sending from a personal address (rather than
`noreply@yourdomain.com`) looks less professional and is somewhat more
likely to be flagged as spam by some providers. Fine for testing/demo;
verify a real domain with Resend (or SendGrid) once you have one.

## Fourth email option: Brevo (if SendGrid signup itself is the blocker)

SendGrid has been rejecting or flagging some new account signups lately —
that's an account-creation problem on their end, not something wrong with
the `SendGridEmailService` integration in this codebase. If you hit that,
**Brevo** (formerly Sendinblue) offers the same underlying model — verify
one email address you own, no domain/DNS needed, send to any recipient —
generally with a smoother signup process.

### Setup

1. Sign up at brevo.com (free tier — 300 emails/day)
2. **Senders, Domains & Dedicated IPs → Senders → Add a Sender** → enter an
   email you own, click the confirmation link they send you
3. **SMTP & API → API Keys** → generate a new key
4. On Render, set:
   ```
   EMAIL_PROVIDER=brevo
   BREVO_API_KEY=xkeysib-your_actual_key
   BREVO_FROM_ADDRESS=the-address-you-just-verified@gmail.com
   BREVO_FROM_NAME=Helping Hands
   ```

Implemented as `BrevoEmailService`, following the identical pattern as the
other three `EmailService` implementations — all four (`resend`, `sendgrid`,
`brevo`, `smtp`) are mutually exclusive via `@ConditionalOnProperty`, so
exactly one is ever active regardless of which you choose.

**If none of Resend/SendGrid/Brevo work out**, Mailgun and Postmark follow
the same single-sender-or-domain pattern and could be added the same way —
just say the word.

## Multi-Document Upload, Delivery Volunteer Choice, and Request Messaging

### Document uploads — now one-per-type with instant replace
The backend already supported multiple documents; the real gap was the
upload form only handling one file per submission. Redesigned
`DocumentUploadWidget`:
- **Children's Home / Service Provider profiles**: one row per required
  document type, each with its own instant upload/replace button — no
  separate type dropdown needed, and uploading a new file for a type that
  already has one automatically replaces it (enforced server-side too, in
  `DocumentService.replaceExistingOfSameType`).
- **Request images**: the one deliberate exception — a multi-file picker
  that lets a Home select several photos at once, all of which accumulate
  (never replaced), since multiple photos per request is the whole point.

### Delivery Volunteer choice at pledge time
A Donor/Delivery-Volunteer pledging to a GOODS request now chooses upfront:
**"I'll deliver it myself"** or **"I need a delivery volunteer."** This is
stored on the request immediately (reusing the existing `deliveryMethod`
field, now also settable at the PLEDGED transition, not just later).

If a volunteer pickup is chosen and there's no progress after 7 days, a new
scheduled check (`SystemMaintenanceService.findStalledVolunteerPickup`)
notifies the Home. The Home can then click **"Arrange Alternative
Delivery"** on the request page, describe the arrangement (e.g. a courier
they're paying for), and the system records it — the original Donor's
pledge stays credited to them either way, they're just notified that
logistics changed.

### Request messaging
A lightweight chat, scoped to one request, between exactly the two people
involved: the owning Children's Home and whoever pledged. Opens once a
pledge is **accepted** (not before — a Home shouldn't field messages from
every interested Donor before committing to one) and stays available
through the rest of the lifecycle. Each message triggers a notification to
the other party. New `request_messages` table, `RequestMessageService`
enforcing the two-participant-only access rule in one place shared by both
sending and reading.

### Required setup for this batch

Run the new migration on Neon:
```sql
-- database/012_schema_messaging.sql
```
No new environment variables needed.

## Fixed: Document Uploads (Dockerfile) + Real Delivery Volunteer Assignment

### Document upload failures — root cause was the Dockerfile
Every upload was failing with a raw filesystem path in the error message.
Root cause: the container switches to a non-root `spring` user for
security, but `/app` (where `./uploads` resolves) was never handed over to
that user — so it could never write there. Fixed by creating the uploads
folder and `chown`-ing `/app` to `spring` before the user switch. Also
added startup validation for `STORAGE_ENCRYPTION_KEY` so a malformed key
(e.g. a literal placeholder like `<...>` left in by mistake) fails loudly
in the logs at boot, not cryptically on the first upload attempt.

### Delivery Volunteers previously had no way to see delivery requests
Found via testing: choosing "request a delivery volunteer" at pledge time
only recorded a preference — nothing let an actual Delivery Volunteer
discover or claim that task, since the request already left the public
marketplace once pledged. Fixed with a proper assignment flow:
- New `deliveryVolunteer` field on Request, distinct from `pledgedBy` (the
  Donor keeps credit for the donation even when a volunteer handles transport)
- **Available Deliveries** page/sidebar link for the Delivery Volunteer role
  — lists every unclaimed volunteer-pickup request
- **Claim This Delivery** button, both from that queue and from the
  request's own detail page
- Once claimed, the volunteer (not just the original Donor) can mark
  In Progress / Delivered
- Both the Home and the Donor are notified when a volunteer claims their delivery

### Required setup for this batch

1. **Regenerate your `STORAGE_ENCRYPTION_KEY` on Render** if it currently
   contains stray characters — generate a clean one with `openssl rand -base64 32`
2. Run the new migration on Neon:
   ```sql
   -- database/013_schema_delivery_volunteer_assignment.sql
   ```
3. Push — this includes a Dockerfile change, so make sure Render does a
   full rebuild rather than reusing a cached image layer.

### Known limitation (not a bug): multiple accounts in multiple tabs

Login sessions are stored in `localStorage`, which is shared across every
tab in the same browser profile — logging into a second account in another
tab overwrites the first tab's session too. This is standard behavior for
virtually all token-based web apps (try two Gmail accounts in two regular
tabs). To test multiple roles at once, use a regular window for one account
and an Incognito/Private window for another, or two different browsers.

## Fixed: Delivery Volunteer Dashboard Showing Zeros

Your screenshot showed 3 items in "Available Deliveries" but "0" for both
Dashboard stats. Both numbers were technically *correct* — just measuring
the wrong thing for that role:
- "Open Goods Requests" counts unpledged CREATED requests. All 3 items were
  already PLEDGED (by a Donor), just needing a volunteer — so correctly 0.
- "My Pledges" counts requests where *you* are `pledgedBy`. A Delivery
  Volunteer who has only ever claimed deliveries (not personally pledged
  goods) will always show 0 here — claiming sets a different field
  (`deliveryVolunteer`), which nothing was reading anywhere.

This also meant claimed deliveries were invisible everywhere once claimed
— they'd disappear from "Available Deliveries" (correctly) but never
appear on the Dashboard, the Requests page, or anywhere else. Fixed with:
- A new `myClaimedDeliveries` endpoint/query
- A dedicated **Delivery Volunteer Dashboard** (separate from the Donor
  one) showing "Available Deliveries" and "My Claimed Deliveries" —
  the two numbers that actually matter for this role
- A **"My Claimed Deliveries"** section on the Requests page, alongside
  "My Pledges"

### Required setup for this batch

No new migration — this reuses the `delivery_volunteer_id` column from the
previous update.
