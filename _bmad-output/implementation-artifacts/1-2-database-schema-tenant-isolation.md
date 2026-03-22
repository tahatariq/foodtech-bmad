# Story 1.2: Database Schema & Tenant Isolation

Status: ready-for-dev

## Story

As a **platform operator**,
I want a tenant-isolated database schema with the core entity hierarchy,
So that every restaurant's operational data is securely separated at the query layer.

## Acceptance Criteria (BDD)

**Given** the PostgreSQL database is running
**When** I run Drizzle Kit migrations
**Then** the following tables exist: `organizations`, `locations` (primary tenant), `users`, `staff` (user-to-location-role mapping)
**And** every operational table has a `tenant_id` column (referencing `locations.id`) with an index `idx_{table}_tenant_id`
**And** all tables use UUID v4 primary keys, snake_case naming, and `created_at`/`updated_at` timestamps
**And** a `TenantScopeInterceptor` NestJS interceptor extracts `tenant_id` from JWT and injects it as a WHERE clause on every Drizzle query
**And** a database seed script creates a test organization with 2 locations and sample staff

## Tasks / Subtasks

### Task 1: Install and Configure Drizzle ORM (AC: Drizzle Kit migrations)

- [ ] Install Drizzle ORM and related packages in `backend/`: `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`
- [ ] Create `backend/drizzle.config.ts` with PostgreSQL connection from `DATABASE_URL` env var, schema path, and migrations output directory
- [ ] Create `backend/src/database/database.module.ts` — NestJS module that provides the Drizzle database instance
- [ ] Create `backend/src/database/database.provider.ts` — factory provider that initializes Drizzle with the PostgreSQL connection pool
- [ ] Register `DatabaseModule` as a global module in `app.module.ts`
- [ ] Add npm scripts to `backend/package.json`: `db:generate`, `db:migrate`, `db:push`, `db:studio`

### Task 2: Define Core Schema Tables (AC: organizations, locations, users, staff tables)

- [ ] Create `backend/src/database/schema/organizations.schema.ts`:
  - `id`: UUID v4 primary key (`text('id').primaryKey()`)
  - `name`: text, not null
  - `slug`: text, unique, not null
  - `subscription_tier`: text, not null, default `'indie'` (values: `indie`, `growth`, `enterprise`)
  - `is_active`: boolean, default true
  - `created_at`: timestamp with timezone, default now
  - `updated_at`: timestamp with timezone, default now
- [ ] Create `backend/src/database/schema/locations.schema.ts`:
  - `id`: UUID v4 primary key (this is the `tenant_id` for all operational tables)
  - `organization_id`: text, foreign key to `organizations.id`
  - `name`: text, not null
  - `address`: text
  - `timezone`: text, not null, default `'UTC'`
  - `is_active`: boolean, default true
  - `created_at`, `updated_at` timestamps
  - Index: `idx_locations_organization_id`
- [ ] Create `backend/src/database/schema/users.schema.ts`:
  - `id`: UUID v4 primary key
  - `email`: text, unique, not null
  - `password_hash`: text, not null
  - `display_name`: text, not null
  - `is_active`: boolean, default true
  - `created_at`, `updated_at` timestamps
  - Index: `idx_users_email`
- [ ] Create `backend/src/database/schema/staff.schema.ts`:
  - `id`: UUID v4 primary key
  - `user_id`: text, foreign key to `users.id`
  - `tenant_id`: text, foreign key to `locations.id`, not null
  - `role`: text, not null (values: `line_cook`, `head_chef`, `location_manager`, `org_owner`, `customer`, `delivery_partner`, `supplier`, `supplier_api`, `system_admin`)
  - `is_active`: boolean, default true
  - `created_at`, `updated_at` timestamps
  - Index: `idx_staff_tenant_id`, `idx_staff_user_id`
  - Unique constraint: `(user_id, tenant_id)` — one role per user per location
- [ ] Create `backend/src/database/schema/index.ts` barrel export for all schemas

### Task 3: Enforce Schema Conventions (AC: UUID v4 PKs, snake_case, timestamps)

- [ ] Verify all tables use `text('id').primaryKey()` with UUID v4 generation (use `crypto.randomUUID()` or `uuid` package)
- [ ] Verify all column names are snake_case
- [ ] Verify all tables include `created_at` and `updated_at` timestamp columns
- [ ] Create a `backend/src/database/utils/schema-helpers.ts` with reusable column definitions:
  - `primaryId()` — UUID v4 primary key with default
  - `tenantId()` — tenant_id column with foreign key to locations
  - `timestamps()` — created_at/updated_at pair
- [ ] Apply schema helpers across all table definitions for consistency

### Task 4: Generate and Run Migrations (AC: tables exist after migration)

- [ ] Run `npx drizzle-kit generate` to produce the initial migration SQL
- [ ] Verify generated migration creates all 4 tables with correct columns, indexes, and foreign keys
- [ ] Run `npx drizzle-kit migrate` against the Docker Compose PostgreSQL instance
- [ ] Verify tables exist via a database inspection query

### Task 5: Implement TenantScopeInterceptor (AC: extracts tenant_id from JWT, injects WHERE clause)

- [ ] Create `backend/src/common/interceptors/tenant-scope.interceptor.ts`:
  - Implements `NestInterceptor`
  - Extracts `tenantId` from `request.user` (populated by AuthGuard)
  - Attaches `tenantId` to request context for downstream use
  - Provides a Drizzle query wrapper that auto-appends `.where(eq(table.tenant_id, tenantId))` to queries
- [ ] Create `backend/src/common/decorators/tenant-scoped.decorator.ts`:
  - `@TenantScoped()` decorator that marks a controller or method as requiring tenant scoping
- [ ] Create `backend/src/common/services/tenant-context.service.ts`:
  - Uses `AsyncLocalStorage` or NestJS request scope to hold current tenant_id
  - Provides `getCurrentTenantId()` method for use in repositories
- [ ] Register interceptor in `app.module.ts` as a global interceptor (or via decorator application)
- [ ] Write unit tests for the interceptor:
  - Verifies tenant_id is extracted from JWT payload
  - Verifies queries are scoped to the correct tenant
  - Verifies error thrown when tenant_id is missing on a tenant-scoped route

### Task 6: Create Database Seed Script (AC: test org with 2 locations and sample staff)

- [ ] Create `backend/src/database/seeds/seed.ts`:
  - Creates 1 test organization: "Demo Restaurant Group" (growth tier)
  - Creates 2 locations: "Downtown Kitchen", "Airport Express"
  - Creates test users with bcrypt-hashed passwords (cost factor 12):
    - `admin@demo.com` (org_owner, both locations)
    - `chef@downtown.com` (head_chef, Downtown Kitchen)
    - `cook@downtown.com` (line_cook, Downtown Kitchen)
    - `manager@airport.com` (location_manager, Airport Express)
  - All passwords default to `Password123!` for development
- [ ] Add npm script `db:seed` to `backend/package.json`
- [ ] Ensure seed is idempotent (can be run multiple times without duplicating data)

### Task 7: Export Types to shared-types (AC: types available across packages)

- [ ] Add Drizzle `InferSelectModel` / `InferInsertModel` types for each schema to `packages/shared-types/src/models.ts`:
  - `Organization`, `NewOrganization`
  - `Location`, `NewLocation`
  - `User`, `NewUser` (omit password_hash)
  - `Staff`, `NewStaff`
- [ ] Export role enum values as a TypeScript union type: `StaffRole`
- [ ] Export subscription tier type: `SubscriptionTier = 'indie' | 'growth' | 'enterprise'`

## Dev Notes

### Architecture References
- Tenant isolation uses **shared database, row-level tenant scoping** — `tenant_id` column on every operational table, enforced via Drizzle query wrapper (architecture.md, "Data Architecture")
- Entity hierarchy: Organization > Location (primary tenant) > Staff/Station/Order (architecture.md, "Tenant Schema Design")
- Every query passes through a `TenantScope` interceptor that extracts `tenant_id` from JWT and injects it as a WHERE clause (architecture.md, lines 299-302)
- Database naming: snake_case tables (plural), snake_case columns, `idx_{table}_{columns}` indexes (architecture.md, "Naming Patterns")

### Technical Stack
- Drizzle ORM (latest) — `drizzle-orm`, `drizzle-kit`
- PostgreSQL 16 driver — `pg`, `@types/pg`
- bcrypt — `bcryptjs` (for seed script password hashing)
- uuid — `uuid` (for UUID v4 generation, or use `crypto.randomUUID()`)
- Zod (for runtime validation of schema types) — `zod`

### File Structure
```
backend/
├── drizzle.config.ts
├── src/
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── database.provider.ts
│   │   ├── schema/
│   │   │   ├── index.ts
│   │   │   ├── organizations.schema.ts
│   │   │   ├── locations.schema.ts
│   │   │   ├── users.schema.ts
│   │   │   └── staff.schema.ts
│   │   ├── utils/
│   │   │   └── schema-helpers.ts
│   │   ├── migrations/              # Generated by drizzle-kit
│   │   └── seeds/
│   │       └── seed.ts
│   └── common/
│       ├── interceptors/
│       │   └── tenant-scope.interceptor.ts
│       ├── decorators/
│       │   └── tenant-scoped.decorator.ts
│       └── services/
│           └── tenant-context.service.ts
packages/
└── shared-types/
    └── src/
        └── models.ts                # Updated with DB types
```

### Testing Requirements
- Unit tests for `TenantScopeInterceptor`: verifies tenant_id extraction, query scoping, error on missing tenant
- Unit tests for `TenantContextService`: verifies async context propagation
- Integration test: run migrations against test PostgreSQL, verify tables exist with correct structure
- Integration test: run seed, verify data is created correctly
- Verify seed idempotency: run seed twice, no duplicate key errors

### Dependencies
- **Story 1.1** (Monorepo Scaffold) — requires the monorepo structure, Docker Compose with PostgreSQL, and shared-types package to exist

### References
- [Source: epics.md#Epic 1, Story 1.2]
- [Source: architecture.md#Data Architecture]
- [Source: architecture.md#Tenant Schema Design]
- [Source: architecture.md#Database Naming Conventions]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
