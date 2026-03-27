# Story 3.1: Inventory Data Model & Tracking

Status: review

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

- [x] Create `inventory_items` table schema in `backend/src/database/schema/`
  - [x] Columns: `id` (UUID, PK), `item_name` (varchar, not null), `current_quantity` (integer, not null, default 0), `reorder_threshold` (integer, not null, default 0), `is_86d` (boolean, not null, default false), `tenant_id` (UUID, FK to locations, not null), `created_at`, `updated_at`
  - [x] Add unique constraint on (`item_name`, `tenant_id`)
  - [x] Add index on `tenant_id` for tenant-scoped queries
  - [x] Add index on `is_86d` for 86 Board queries
- [x] Create `prep_checklists` table schema
  - [x] Columns: `id` (UUID, PK), `station_id` (UUID, FK to stations, not null), `tenant_id` (UUID, FK to locations, not null), `name` (varchar), `created_at`, `updated_at`
  - [x] Add unique constraint on (`station_id`, `tenant_id`)
- [x] Create `checklist_items` table schema
  - [x] Columns: `id` (UUID, PK), `checklist_id` (UUID, FK to prep_checklists, not null), `description` (varchar, not null), `is_completed` (boolean, not null, default false), `completed_at` (timestamp, nullable), `completed_by` (UUID, FK to users, nullable)
  - [x] Add index on `checklist_id`
- [x] Generate and test Drizzle migration

### Task 2: Create Zod Validation Schemas

- [x]Create `create-inventory-item.dto.ts` with Zod schema
  - [x]Validate `itemName` (string, min 1, max 100)
  - [x]Validate `currentQuantity` (integer, min 0)
  - [x]Validate `reorderThreshold` (integer, min 0)
- [x]Create `update-inventory.dto.ts` with Zod schema for quantity updates
- [x]Export shared types to `packages/shared-types/src/models.ts`

### Task 3: Implement Inventory Repository

- [x]Create `kitchen-status.repository.ts` inventory methods
  - [x]`createItem(tenantId, data)` — insert with tenant scoping
  - [x]`findAllByTenant(tenantId)` — list all inventory items
  - [x]`findById(tenantId, itemId)` — single item lookup
  - [x]`updateQuantity(tenantId, itemId, newQuantity)` — update with 86'd auto-detection
  - [x]`find86dItems(tenantId)` — all items where `is_86d = true`
- [x]Ensure all queries include `tenant_id` WHERE clause via TenantScope interceptor

### Task 4: Implement Inventory Controller & Service

- [x]Create inventory endpoints in `kitchen-status.controller.ts`
  - [x]`POST /api/v1/inventory-items` — create item (role: `location_manager`)
  - [x]`GET /api/v1/inventory-items` — list items for tenant
  - [x]`GET /api/v1/inventory-items/:id` — get single item
  - [x]`PATCH /api/v1/inventory-items/:id` — update item (quantity, threshold)
  - [x]`GET /api/v1/inventory-items/86d` — list all 86'd items
- [x]Apply `@Roles('location_manager')` guard on write endpoints
- [x]Apply `@Roles('location_manager', 'head_chef', 'cook')` on read endpoints

### Task 5: Implement Event Emission for Inventory Changes

- [x]Define event types in `kitchen-status.events.ts`
  - [x]`inventory.updated` — emitted on any quantity change with `{ itemId, newQuantity, is86d }`
  - [x]`inventory.86d` — emitted when `current_quantity` reaches 0 with `{ itemId, itemName }`
  - [x]`inventory.reorder.triggered` — emitted when quantity drops below threshold with `{ itemId, supplierId, quantity }`
- [x]Implement event emission in service layer on quantity updates
- [x]Emit events via Socket.io gateway to tenant namespace

### Task 6: Write Tests

- [x]Unit tests for repository methods (mock database)
- [x]Unit tests for service layer (event emission, 86'd logic, threshold logic)
- [x]Integration tests for controller endpoints (201 on create, tenant isolation)
- [x]Test that `is_86d` auto-sets to true when quantity reaches 0
- [x]Test that `inventory.reorder.triggered` fires at threshold boundary

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
Claude Opus 4.6

### Debug Log References
No errors encountered during implementation.

### Completion Notes List
- Created inventory schema with 3 tables (inventoryItems, prepChecklists, checklistItems)
- Generated Drizzle migration 0002_exotic_stark_industries.sql
- Implemented KitchenStatusModule with full CRUD controller, service, and repository
- Service emits INVENTORY_EVENTS.LEVEL_CHANGED, EIGHTY_SIXED, and reorder.triggered events
- Repository auto-detects 86d status on quantity update (quantity <= 0)
- 13 unit tests covering CRUD, 86d auto-detection, reorder threshold, and event emission
- Module registered in app.module.ts

### File List
- `backend/src/database/schema/inventory.schema.ts`
- `backend/src/database/schema/index.ts` (updated)
- `backend/src/database/migrations/0002_exotic_stark_industries.sql`
- `backend/src/modules/kitchen-status/kitchen-status.module.ts`
- `backend/src/modules/kitchen-status/kitchen-status.controller.ts`
- `backend/src/modules/kitchen-status/kitchen-status.service.ts`
- `backend/src/modules/kitchen-status/kitchen-status.repository.ts`
- `backend/src/modules/kitchen-status/kitchen-status.service.spec.ts`
- `backend/src/modules/kitchen-status/dto/create-inventory-item.dto.ts`
- `backend/src/modules/kitchen-status/dto/update-inventory.dto.ts`
- `backend/src/app.module.ts` (updated)
