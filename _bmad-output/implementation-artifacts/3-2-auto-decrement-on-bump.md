# Story 3.2: Auto-Decrement Inventory on Bump

Status: ready-for-dev

## Story

As an **expeditor (Adrienne)**,
I want inventory to decrement automatically when orders are bumped through stages,
so that stock levels are always accurate without manual counting.

## Acceptance Criteria (BDD)

**Given** an order item is associated with inventory items (via item name or configured mapping)
**When** a bump advances the order to a consumption stage (configurable, default: "preparing")
**Then** the associated inventory items are decremented by the order item quantity

**Given** an inventory item was at quantity 6 and an order consumes 1
**When** the decrement occurs
**Then** the item quantity becomes 5 and an `inventory.updated` event is emitted
**And** if the new quantity is at or below the reorder threshold, an `inventory.reorder.triggered` event is also emitted

**Given** an inventory item reaches zero
**When** the 86'd status is set
**Then** all active views receive an `inventory.86d` event and Badge86 components appear on affected ticket cards across all views within 500ms

## Tasks / Subtasks

### Task 1: Create Order-to-Inventory Mapping

- [ ] Define `order_item_inventory_map` table or config structure
  - [ ] Map order item names (or menu item IDs) to inventory item IDs
  - [ ] Support quantity multiplier (e.g., 1 order of "Fish Tacos" = 2 units of "Tortilla" + 1 unit of "Fish Fillet")
- [ ] Create Drizzle schema for mapping table if using database-driven mapping
- [ ] Alternatively, support name-based matching (order item name matches inventory item name) as fallback
- [ ] Create Zod validation for mapping configuration

### Task 2: Implement Consumption Stage Configuration

- [ ] Add `consumption_stage` setting to tenant/location configuration
  - [ ] Default value: `"preparing"`
  - [ ] Configurable per tenant via admin API
- [ ] Add configuration lookup in bump handler to determine when decrement triggers
- [ ] Ensure stage comparison is case-insensitive and handles stage enum values

### Task 3: Implement Auto-Decrement Logic in OrderService

- [ ] Hook into `OrderService.advanceStage()` (existing bump handler from Epic 2)
- [ ] After stage transition, check if new stage matches `consumption_stage`
- [ ] If match, look up inventory mappings for all items in the order
- [ ] Call `InventoryService.decrementItems()` with item-quantity pairs
- [ ] Handle case where order item has no inventory mapping (skip gracefully)
- [ ] Wrap decrement + stage change in a database transaction for atomicity

### Task 4: Implement InventoryService.decrementItems()

- [ ] Accept array of `{ inventoryItemId, quantity }` pairs
- [ ] Decrement each item's `current_quantity` atomically (use SQL `SET current_quantity = current_quantity - :qty`)
- [ ] Prevent negative quantities (use `GREATEST(0, current_quantity - :qty)` or check-before-update)
- [ ] After each decrement:
  - [ ] Emit `inventory.updated` event with `{ itemId, newQuantity, is86d }`
  - [ ] If `newQuantity === 0`: set `is_86d = true`, emit `inventory.86d` event
  - [ ] If `newQuantity <= reorderThreshold` and `newQuantity > 0`: emit `inventory.reorder.triggered`
- [ ] Return results array with new quantities and events triggered

### Task 5: Propagate Badge86 via WebSocket

- [ ] On `inventory.86d` event, emit to tenant namespace via Socket.io gateway
- [ ] Ensure event reaches all rooms: `station:*`, `expeditor`, `customer:*`
- [ ] Include `itemName` in event payload for frontend Badge86 rendering
- [ ] Verify delivery within 500ms SLA (measure and log event propagation time)

### Task 6: Write Tests

- [ ] Unit test: bump to "preparing" triggers decrement for mapped items
- [ ] Unit test: bump to non-consumption stage does NOT trigger decrement
- [ ] Unit test: quantity 6 - 1 = 5, `inventory.updated` emitted with correct payload
- [ ] Unit test: quantity at threshold triggers `inventory.reorder.triggered`
- [ ] Unit test: quantity reaches 0, `is_86d` set to true, `inventory.86d` emitted
- [ ] Unit test: order item with no inventory mapping is skipped without error
- [ ] Unit test: multi-item order decrements all mapped inventory items
- [ ] Integration test: full bump → decrement → event propagation flow
- [ ] Performance test: verify `inventory.86d` WebSocket delivery < 500ms

## Dev Notes

### Architecture References
- Event flow: Cook bumps order → OrderService.advanceStage() → InventoryService.decrementItems() → EventBus → Socket.io gateway fans out
- WebSocket topology: `/tenant-{id}` namespace, rooms: `station:{stationId}`, `expeditor`, `customer:{orderId}`
- TenantScope interceptor ensures all inventory queries are tenant-scoped

### Technical Stack
- **Backend:** NestJS 11.x + TypeScript 5.x
- **ORM:** Drizzle ORM with PostgreSQL 16
- **Events:** Socket.io via NestJS gateway, Redis pub/sub for multi-node fanout
- **Validation:** Zod
- **Testing:** Jest

### File Structure
```
backend/src/modules/kitchen-status/
├── kitchen-status.service.ts       (extend: decrementItems method)
├── kitchen-status.repository.ts    (extend: atomic decrement queries)
├── dto/
│   └── update-inventory.dto.ts     (extend: decrement DTO)
├── events/
│   └── kitchen-status.events.ts    (inventory.updated, inventory.86d, inventory.reorder.triggered)
└── kitchen-status.service.test.ts  (extend: decrement tests)

backend/src/modules/orders/
├── orders.service.ts               (extend: hook decrement into advanceStage)
└── orders.service.test.ts          (extend: decrement integration tests)

packages/shared-types/src/
└── events.ts                       (inventory event payload types)

frontend/src/components/Badge86/
├── Badge86.tsx                     (render on inventory.86d event)
└── Badge86.test.tsx
```

### Testing Requirements
- Unit tests for decrement logic with various quantity/threshold scenarios
- Unit tests for order-to-inventory mapping resolution
- Integration test for full bump-to-event pipeline
- WebSocket delivery timing test (< 500ms SLA)
- Transactional integrity test: if decrement fails, stage change should rollback

### Dependencies
- **Requires:** Story 3.1 (Inventory Data Model & Tracking) — inventory tables and CRUD
- **Requires:** Epic 2 Station View — OrderService.advanceStage() bump handler
- **Blocks:** Story 3.5 (Expeditor Dashboard) — 86 Board panel needs Badge86 data
- **Blocks:** Story 3.6 (Attention-Driven UI) — 86'd state affects attention levels

### References
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 340-353 (WebSocket event flow showing bump → decrement → event chain)
- Events: `_bmad-output/planning-artifacts/architecture.md` lines 616-618 (inventory events)
- Epics: `_bmad-output/planning-artifacts/epics.md` lines 746-766 (Story 3.2 AC)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 1046-1055 (Badge86 component spec)

## Dev Agent Record

### Agent Model Used
<!-- To be filled during implementation -->

### Debug Log References
<!-- To be filled during implementation -->

### Completion Notes List
<!-- To be filled during implementation -->

### File List
<!-- To be filled during implementation -->
