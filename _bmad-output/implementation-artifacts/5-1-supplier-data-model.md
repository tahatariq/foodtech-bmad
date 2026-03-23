# Story 5.1: Supplier Data Model & Restaurant Linking

Status: ready-for-dev

## Story

As a **system (on behalf of Linda and restaurant admins)**,
I want a cross-tenant supplier data model with many-to-many restaurant links,
So that suppliers can view inventory and demand signals only from restaurants they are linked to.

## Acceptance Criteria (BDD)

**Given** the database schema
**When** the supplier tables are created via Drizzle migration
**Then** a `Supplier` entity exists (cross-tenant, not scoped to a single location), a `SupplierRestaurantLink` join table establishes many-to-many relationships between suppliers and locations, and a `SupplierOrder` entity tracks reorders with fields: `id`, `supplier_id`, `location_id`, `items`, `status` (pending/confirmed/shipped/delivered), `created_at`, `confirmed_at`

**Given** a supplier (Linda) is linked to 40 restaurants
**When** she queries `/api/v1/supplier/restaurants`
**Then** she receives only the restaurants she is linked to — no access to unlinked restaurant data, enforced at the query layer via `SupplierRestaurantLink` join (not application-level filtering)

**Given** a restaurant admin wants to link a supplier
**When** they create a link via POST `/api/v1/admin/supplier-links`
**Then** the link is created with the restaurant's `location_id` and the supplier's `supplier_id`, and the supplier can immediately see that restaurant's inventory data

## Tasks / Subtasks

### Task 1: Create Supplier Database Schema (AC: migration, entities)

- [ ] Create Drizzle schema for `suppliers` table: `id` (UUID PK), `name`, `email`, `phone`, `created_at`, `updated_at` — cross-tenant (no `tenant_id`)
- [ ] Create `supplier_restaurant_links` join table: `id` (UUID PK), `supplier_id` (FK → suppliers), `location_id` (FK → locations), `created_at`, unique constraint on (supplier_id, location_id)
- [ ] Create `supplier_orders` table: `id` (UUID PK), `supplier_id` (FK), `location_id` (FK), `items` (JSONB), `status` (enum: pending/confirmed/shipped/delivered), `created_at`, `confirmed_at`, `shipped_at`, `delivered_at`
- [ ] Create indexes: `idx_supplier_orders_supplier_id`, `idx_supplier_orders_location_id`, `idx_supplier_orders_status`
- [ ] Run Drizzle Kit migration and verify schema

### Task 2: Implement Supplier Module & Repository (AC: query-layer security)

- [ ] Create `backend/src/supplier/supplier.module.ts` with NestJS module
- [ ] Create `backend/src/supplier/supplier.repository.ts` with Drizzle queries — all queries JOIN through `supplier_restaurant_links` to enforce access
- [ ] Create `backend/src/supplier/supplier.service.ts` with business logic
- [ ] Implement `getLinkedRestaurants(supplierId)` — returns only linked locations via JOIN

### Task 3: Implement Supplier REST Endpoints (AC: API)

- [ ] GET `/api/v1/supplier/restaurants` — returns linked restaurants for authenticated supplier
- [ ] POST `/api/v1/admin/supplier-links` — creates supplier-restaurant link (admin only)
- [ ] DELETE `/api/v1/admin/supplier-links/:linkId` — removes link
- [ ] Add `@Roles('supplier')` and `@Roles('system_admin')` guards appropriately
- [ ] Add Zod DTOs for request validation

### Task 4: Write Tests (AC: all)

- [ ] Unit tests for supplier repository (query-layer security)
- [ ] Unit tests for supplier service
- [ ] Integration tests verifying cross-tenant isolation (supplier cannot see unlinked data)
- [ ] API endpoint tests for all 3 endpoints

## Dev Notes

- Supplier entity is **cross-tenant** — it does NOT have a `tenant_id` column. This is unique in the FoodTech schema.
- Security is enforced at the **query layer** via `SupplierRestaurantLink` JOIN, not application-level filtering.
- PostgreSQL 16, Drizzle ORM, snake_case tables, UUID PKs.

### Project Structure Notes

- `backend/src/supplier/` — module, service, repository, controller
- `backend/src/supplier/entities/` — Drizzle schema definitions
- `backend/src/supplier/dto/` — Zod DTOs

### References

- [Source: epics.md#Story 5.1]
- [Source: architecture.md#Database & ORM]
- [Source: prd.md#FR32-FR37]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
