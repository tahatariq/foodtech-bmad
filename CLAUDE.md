# CLAUDE.md

## Build Commands

```bash
npm ci                          # Install all dependencies
npm run dev                     # Start all dev servers (turbo)
npm run build                   # Build all packages (turbo)
npm run test                    # Run all tests (turbo)
npm run lint                    # Lint all packages (turbo)
npm run type-check              # Type-check all packages (turbo)
```

**Backend** (`cd backend`):
```bash
npm run start:dev               # NestJS dev server
npm run test                    # Jest tests
npm run db:push                 # Push schema to database
npm run db:seed                 # Seed database
npm run db:studio               # Open Drizzle Studio
```

**Frontend** (`cd frontend`):
```bash
npm run dev                     # Vite dev server
npm run test                    # Vitest tests
```

**Supplier Portal** (`cd supplier-portal`):
```bash
npm run dev                     # Vite dev server
```

## Architecture

Monorepo managed by Turborepo with four workspaces:

- **backend** — NestJS 11 API server
- **frontend** — React 19 + Vite customer-facing app
- **supplier-portal** — React 19 + Vite supplier app
- **packages/shared-types** — Shared TypeScript types

**Data layer:** PostgreSQL 16 with Drizzle ORM. Redis for Socket.io adapter.

**Multi-tenancy:** Every table has `tenant_id`. Row-level isolation enforced by TenantGuard.

**Real-time:** EventBusService emits events to Socket.io rooms scoped per tenant/station/customer.

## Key Patterns

**Schema helpers** (`backend/src/database/utils/schema-helpers.ts`):
- `primaryId()` — UUID primary key
- `timestamps()` — createdAt/updatedAt columns
- `isActiveColumn()` — soft-delete boolean

**Guards** (applied globally unless skipped):
- `JwtAuthGuard` — JWT authentication (skip with `@Public()`)
- `TenantGuard` — tenant isolation (skip with `@SkipTenantCheck()`)
- `RolesGuard` — role-based access (`@Roles(...)`)
- `TierGuard` — subscription tier gating (`@RequiredTier(...)`)

**DTOs:** Zod schemas (not class-validator).

**Frontend state:** Zustand stores with persist middleware.

**Frontend styling:** Tailwind CSS 4.2 + Radix UI primitives.

## Testing

- **Backend:** Jest — 201 tests across 32 suites
- **Frontend:** Vitest + Testing Library — 180 tests
- **Run all:** `npm run test`

## CI

GitHub Actions pipeline: `type-check` → `lint` → `test` → `build`

Test job provisions PostgreSQL 16 and Redis 7 as service containers.
