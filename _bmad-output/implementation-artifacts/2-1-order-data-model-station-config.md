# Story 2.1: Order Data Model & Station Configuration

Status: ready-for-dev

## Story

As a **location manager**,
I want to configure kitchen stations and order stages for my restaurant,
so that incoming orders can be routed to the right stations and tracked through my kitchen's workflow.

## Acceptance Criteria (BDD)

**Given** the database is running
**When** Drizzle migrations are applied
**Then** tables exist: `stations` (name, emoji, display_order, tenant_id), `order_stages` (name, sequence, tenant_id), `orders` (order_number, status, tenant_id, timestamps), `order_items` (order_id, item_name, station_id, stage, quantity)

**Given** an authenticated location_manager
**When** they POST to `/api/v1/stations` with `{ name: "Grill", emoji: "🔥", displayOrder: 1 }`
**Then** a station is created for their tenant and returned with a 201 response

**Given** an authenticated location_manager
**When** they POST to `/api/v1/order-stages` with a sequence of stages
**Then** configurable stages are saved (default: received → preparing → plating → served)

**And** all entities follow Architecture naming: snake_case tables, UUID PKs, `idx_` indexes, `tenant_id` on every table

## Tasks / Subtasks

### Task 1: Create Drizzle schema for `stations` table (AC 1, AC 4)
- [ ] Define `stations` table in `backend/src/database/schema/stations.ts` with columns: `id` (UUID v4 text PK), `name` (text, not null), `emoji` (text), `display_order` (integer), `tenant_id` (text, FK to tenants, not null), `created_at` (timestamp, UTC), `updated_at` (timestamp, UTC)
- [ ] Add index `idx_stations_tenant_id` on `tenant_id`
- [ ] Add composite unique constraint on `(tenant_id, name)` to prevent duplicate station names per tenant
- [ ] Export from `backend/src/database/schema/index.ts`

### Task 2: Create Drizzle schema for `order_stages` table (AC 1, AC 3, AC 4)
- [ ] Define `order_stages` table in `backend/src/database/schema/orders.ts` with columns: `id` (UUID v4 text PK), `name` (text, not null), `sequence` (integer, not null), `tenant_id` (text, FK to tenants, not null), `created_at`, `updated_at`
- [ ] Add index `idx_order_stages_tenant_id` on `tenant_id`
- [ ] Add composite unique constraint on `(tenant_id, sequence)` to enforce unique ordering
- [ ] Define default stage values: `received` (0), `preparing` (1), `plating` (2), `served` (3)

### Task 3: Create Drizzle schema for `orders` table (AC 1, AC 4)
- [ ] Define `orders` table in `backend/src/database/schema/orders.ts` with columns: `id` (UUID v4 text PK), `order_number` (text, not null), `status` (text, not null, default `'received'`), `tenant_id` (text, FK to tenants, not null), `created_at`, `updated_at`
- [ ] Create `OrderStatus` enum type: `'received'`, `'preparing'`, `'plating'`, `'served'`, `'completed'`, `'cancelled'`
- [ ] Add index `idx_orders_tenant_id` on `tenant_id`
- [ ] Add composite index `idx_orders_tenant_id_status` on `(tenant_id, status)`

### Task 4: Create Drizzle schema for `order_items` table (AC 1, AC 4)
- [ ] Define `order_items` table in `backend/src/database/schema/orders.ts` with columns: `id` (UUID v4 text PK), `order_id` (text, FK to orders, not null), `item_name` (text, not null), `station_id` (text, FK to stations, not null), `stage` (text, not null, default `'received'`), `quantity` (integer, not null, default 1), `tenant_id` (text, FK to tenants, not null), `created_at`, `updated_at`
- [ ] Add index `idx_order_items_order_id` on `order_id`
- [ ] Add index `idx_order_items_station_id` on `station_id`
- [ ] Add index `idx_order_items_tenant_id` on `tenant_id`

### Task 5: Generate and apply Drizzle migration (AC 1)
- [ ] Run `npx drizzle-kit generate` to produce migration SQL
- [ ] Run `npx drizzle-kit migrate` to apply migration
- [ ] Verify all four tables exist with correct columns and indexes

### Task 6: Create Stations NestJS module with CRUD (AC 2)
- [ ] Create `backend/src/modules/stations/stations.module.ts`
- [ ] Create `backend/src/modules/stations/stations.controller.ts` with `POST /api/v1/stations` endpoint
- [ ] Create `backend/src/modules/stations/stations.service.ts` with `createStation()` method
- [ ] Create `backend/src/modules/stations/stations.repository.ts` with Drizzle queries
- [ ] Create `backend/src/modules/stations/dto/create-station.dto.ts` with Zod validation schema: `{ name: string, emoji?: string, displayOrder: number }`
- [ ] Apply `@Roles('location_manager')` guard and `TenantScope` interceptor
- [ ] Return 201 with created station object

### Task 7: Create Order Stages CRUD endpoint (AC 3)
- [ ] Add `POST /api/v1/order-stages` endpoint to stations controller (or create dedicated order-stages controller)
- [ ] Create `dto/create-order-stages.dto.ts` with Zod schema: `{ stages: [{ name: string, sequence: number }] }`
- [ ] Implement `createOrderStages()` in service — accepts array of stages, upserts for tenant
- [ ] Seed default stages (`received`, `preparing`, `plating`, `served`) on tenant creation
- [ ] Apply `@Roles('location_manager')` guard

### Task 8: Write unit tests (All ACs)
- [ ] Test Drizzle schema relationships (order → order_items, order_items → stations)
- [ ] Test `StationsService.createStation()` returns correct shape
- [ ] Test `StationsService.createOrderStages()` saves sequence correctly
- [ ] Test tenant isolation — station created for tenant A is not visible to tenant B
- [ ] Test validation — missing name returns 422

### Task 9: Write integration tests (AC 1, AC 2, AC 3)
- [ ] Test POST `/api/v1/stations` with valid payload returns 201
- [ ] Test POST `/api/v1/stations` without auth returns 401
- [ ] Test POST `/api/v1/stations` with wrong role returns 403
- [ ] Test POST `/api/v1/order-stages` creates default sequence
- [ ] Test migration applies cleanly on fresh database

## Dev Notes

### Architecture References
- Shared database with row-level tenant scoping: `tenant_id` on every operational table, enforced via `TenantScope` interceptor
- Guard chain: `AuthGuard (JWT valid?) → TenantGuard (tenant_id matches?) → RolesGuard (role authorized?) → Controller`
- Database naming: snake_case tables, UUID v4 text PKs, `idx_` prefixed indexes
- API naming: `/api/v1/{resource}` plural kebab-case, camelCase request/response JSON
- Drizzle ORM for TypeScript-native schema, SQL-close queries

### Technical Stack
- NestJS 11.x (backend framework)
- Drizzle ORM (latest) with Drizzle Kit for migrations
- PostgreSQL 16
- Zod for DTO validation at API boundaries
- TypeScript 5.x (strict mode)
- Jest for backend unit/integration tests

### File Structure
```
backend/src/database/schema/
├── stations.ts              # NEW — stations table schema
├── orders.ts                # MODIFY — add orders, order_items, order_stages tables
└── index.ts                 # MODIFY — export new schemas

backend/src/modules/stations/
├── stations.module.ts       # NEW
├── stations.controller.ts   # NEW
├── stations.service.ts      # NEW
├── stations.repository.ts   # NEW
├── dto/
│   ├── create-station.dto.ts       # NEW
│   └── create-order-stages.dto.ts  # NEW
└── stations.service.test.ts # NEW

backend/src/database/migrations/
└── XXXX_create_orders_stations.sql  # NEW — generated by Drizzle Kit
```

### Testing Requirements
- Unit tests: Jest, mock Drizzle database calls, test service logic in isolation
- Integration tests: spin up test PostgreSQL (Docker), apply migrations, test full HTTP request cycle
- Verify tenant isolation at the query layer
- Test co-location: `stations.service.test.ts` next to `stations.service.ts`

### Dependencies
- Epic 1 must be complete (tenant model, auth module, JWT guards, RBAC, database infrastructure)
- Drizzle ORM and PostgreSQL connection must be configured
- `TenantScope` interceptor and `RolesGuard` must be functional

### References
- [Source: epics.md#Epic 2, Story 2.1]
- [Source: architecture.md#Data Architecture]
- [Source: architecture.md#Naming Patterns]
- [Source: architecture.md#Structure Patterns — Backend Module Organization]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
