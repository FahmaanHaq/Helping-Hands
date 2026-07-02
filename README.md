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

Document uploads, request/verification entities, reputation, reports, and
admin moderation screens are **not** in this slice — they're the next
pieces of work, built on exactly this foundation.
