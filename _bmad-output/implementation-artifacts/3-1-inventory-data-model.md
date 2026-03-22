# Story 3.1: Inventory Data Model & Tracking

Status: ready-for-dev

## Story

As a **location manager**,
I want to configure inventory items with reorder thresholds,
so that the system can track stock levels and flag 86'd items automatically.

## Acceptance Criteria (BDD)

**Given** the database is running
**When** Drizzle migrations are applied
**Then** tables exist: `inventory_items` (item_name, current_quantity, reorder_threshold, is_86d, tenant_id), `prep_checklists` (station_id, tenant_id), `checklist_items` (checklist_id, description, is_completed)

**Given** an authenticated location_manager
**When** they POST to `/api/v1/inventory-items` with `{ itemName: "Salmon", currentQuantity: 20, reorderThreshold: 5 }`
**Then** the item is created for their tenant and returned with a 201 response

**Given** an inventory item's `current_quantity` reaches zero
**When** the system updates the item
**Then** `is_86d` is set to true and an `inventory.86d` event is emitted to the tenant namespace

**Given** an inventory item's quantity drops below `reorder_threshold`
**When** the decrement occurs
**Then** an `inventory.reorder.triggered` event is emitted with item details and suggested quantity

## Tasks / Subtasks

### Task 1: Define Drizzle Schema for Inventory Tables

- [ ] Create `inventory_items` table schema in `backend/src/database/schema/`
  - [ ] Columns: `id` (UUID, PK), `item_name` (varchar, not null), `current_quantity` (integer, not null, default 0), `reorder_threshold` (integer, not null, default 0), `is_86d` (boolean, not null, default false), `tenant_id` (UUID, FK to locations, not null), `created_at`, `updated_at`
  - [ ] Add unique constraint on (`item_name`, `tenant_id`)
  - [ ] Add index on `tenant_id` for tenant-scoped queries
  - [ ] Add index on `is_86d` for 86 Board queries
- [ ] Create `prep_checklists` table schema
  - [ ] Columns: `id` (UUID, PK), `station_id` (UUID, FK to stations, not null), `tenant_id` (UUID, FK to locations, not null), `name` (varchar), `created_at`, `updated_at`
  - [ ] Add unique constraint on (`station_id`, `tenant_id`)
- [ ] Create `checklist_items` table schema
  - [ ] Columns: `id` (UUID, PK), `checklist_id` (UUID, FK to prep_checklists, not null), `description` (varchar, not null), `is_completed` (boolean, not null, default false), `completed_at` (timestamp, nullable), `completed_by` (UUID, FK to users, nullable)
  - [ ] Add index on `checklist_id`
- [ ] Generate and test Drizzle migration

### Task 2: Create Zod Validation Schemas

- [ ] Create `create-inventory-item.dto.ts` with Zod schema
  - [ ] Validate `itemName` (string, min 1, max 100)
  - [ ] Validate `currentQuantity` (integer, min 0)
  - [ ] Validate `reorderThreshold` (integer, min 0)
- [ ] Create `update-inventory.dto.ts` with Zod schema for quantity updates
- [ ] Export shared types to `packages/shared-types/src/models.ts`

### Task 3: Implement Inventory Repository

- [ ] Create `kitchen-status.repository.ts` inventory methods
  - [ ] `createItem(tenantId, data)` — insert with tenant scoping
  - [ ] `findAllByTenant(tenantId)` — list all inventory items
  - [ ] `findById(tenantId, itemId)` — single item lookup
  - [ ] `updateQuantity(tenantId, itemId, newQuantity)` — update with 86'd auto-detection
  - [ ] `find86dItems(tenantId)` — all items where `is_86d = true`
- [ ] Ensure all queries include `tenant_id` WHERE clause via TenantScope interceptor

### Task 4: Implement Inventory Controller & Service

- [ ] Create inventory endpoints in `kitchen-status.controller.ts`
  - [ ] `POST /api/v1/inventory-items` — create item (role: `location_manager`)
  - [ ] `GET /api/v1/inventory-items` — list items for tenant
  - [ ] `GET /api/v1/inventory-items/:id` — get single item
  - [ ] `PATCH /api/v1/inventory-items/:id` — update item (quantity, threshold)
  - [ ] `GET /api/v1/inventory-items/86d` — list all 86'd items
- [ ] Apply `@Roles('location_manager')` guard on write endpoints
- [ ] Apply `@Roles('location_manager', 'head_chef', 'cook')` on read endpoints

### Task 5: Implement Event Emission for Inventory Changes

- [ ] Define event types in `kitchen-status.events.ts`
  - [ ] `inventory.updated` — emitted on any quantity change with `{ itemId, newQuantity, is86d }`
  - [ ] `inventory.86d` — emitted when `current_quantity` reaches 0 with `{ itemId, itemName }`
  - [ ] `inventory.reorder.triggered` — emitted when quantity drops below threshold with `{ itemId, supplierId, quantity }`
- [ ] Implement event emission in service layer on quantity updates
- [ ] Emit events via Socket.io gateway to tenant namespace

### Task 6: Write Tests

- [ ] Unit tests for repository methods (mock database)
- [ ] Unit tests for service layer (event emission, 86'd logic, threshold logic)
- [ ] Integration tests for controller endpoints (201 on create, tenant isolation)
- [ ] Test that `is_86d` auto-sets to true when quantity reaches 0
- [ ] Test that `inventory.reorder.triggered` fires at threshold boundary

## Dev Notes

### Architecture References
- Data Architecture: Shared database, row-level tenant scoping with `tenant_id` on every table
- TenantScope interceptor auto-injects `tenant_id` from JWT into all queries
- Event flow: Service emits → EventBus → Socket.io gateway fans out to tenant namespace rooms
- Database: PostgreSQL 16 with Drizzle ORM

### Technical Stack
- **Backend:** NestJS 11.x + TypeScript 5.x
- **ORM:** Drizzle ORM (TypeScript-native schema, SQL-close queries)
- **Validation:** Zod (shared schemas between frontend/backend)
- **Database:** PostgreSQL 16
- **Events:** Socket.io via NestJS gateway, Redis pub/sub for multi-node
- **Testing:** Jest (NestJS default)

### File Structure
```
backend/src/modules/kitchen-status/
├── kitchen-status.module.ts
├── kitchen-status.controller.ts
├── kitchen-status.service.ts
├── kitchen-status.gateway.ts
├── kitchen-status.repository.ts
├── dto/
│   ├── update-station-status.dto.ts
│   ├── update-inventory.dto.ts
│   └── complete-checklist.dto.ts
├── events/
│   └── kitchen-status.events.ts
└── kitchen-status.service.test.ts

backend/src/database/schema/
├── inventory-items.ts    (new)
├── prep-checklists.ts    (new)
└── checklist-items.ts    (new)

packages/shared-types/src/
├── models.ts             (extend with InventoryItem, PrepChecklist types)
└── events.ts             (extend with inventory event types)
```

### Testing Requirements
- Unit tests for all repository methods with mocked Drizzle queries
- Unit tests for service layer business logic (86'd detection, threshold events)
- Integration tests for API endpoints with test database
- Tenant isolation test: verify user from tenant A cannot access tenant B inventory
- Event emission tests: verify correct events emitted with correct payloads

### Dependencies
- **Requires:** Epic 1 (Project Foundation) and Epic 2 (Station View) complete
- **Requires:** Database and auth infrastructure from Stories 1.1-1.3
- **Requires:** Stations table and tenant/location tables exist
- **Blocks:** Story 3.2 (Auto-Decrement on Bump)
- **Blocks:** Story 3.3 (Station Status & Prep Checklists — uses prep_checklists/checklist_items tables)

### References
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 268-297 (data architecture), lines 817-829 (kitchen-status module)
- Events: `_bmad-output/planning-artifacts/architecture.md` lines 606-632 (event naming, payload standard)
- Epics: `_bmad-output/planning-artifacts/epics.md` lines 722-744 (Story 3.1 AC)

## Dev Agent Record

### Agent Model Used
<!-- To be filled during implementation -->

### Debug Log References
<!-- To be filled during implementation -->

### Completion Notes List
<!-- To be filled during implementation -->

### File List
<!-- To be filled during implementation -->
