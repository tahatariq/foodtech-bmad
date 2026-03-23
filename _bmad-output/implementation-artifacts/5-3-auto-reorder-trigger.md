# Story 5.3: Auto-Reorder Trigger & Supplier Notification

Status: ready-for-dev

## Story

As a **system (on behalf of restaurants and suppliers)**,
I want inventory items that hit their reorder threshold to automatically generate purchase orders sent to the linked supplier,
So that restaurants never run out of critical ingredients and suppliers receive orders without manual intervention.

## Acceptance Criteria (BDD)

**Given** an inventory item's quantity drops below its `reorder_threshold` (set during restaurant onboarding)
**When** the InventoryService detects the threshold breach (triggered by `inventory.updated` event after a bump-to-advance decrement)
**Then** the system creates a `SupplierOrder` with status `pending`, the order includes item name, requested quantity (`reorder_quantity` from the item config), location name, and a "deliver-by" suggestion based on current consumption rate, and an `inventory.reorder.triggered` event is emitted

**Given** the auto-reorder is triggered
**When** the event reaches the Supplier Portal via WebSocket
**Then** the order appears in Linda's pending orders queue with restaurant name, item, quantity, and deliver-by date

**Given** the supplier is configured for API integration (Enterprise tier)
**When** the auto-reorder triggers
**Then** the system also pushes the purchase order to the supplier's external system via POST to their configured webhook URL (outbound API per FR36), with HMAC-signed payload

## Tasks / Subtasks

### Task 1: Auto-Reorder Event Listener (AC: threshold detection)

- [ ] Create `backend/src/supplier/auto-reorder.service.ts`
- [ ] Subscribe to `inventory.updated` events via NestJS event emitter
- [ ] On each event, check if `current_quantity <= reorder_threshold`
- [ ] Skip if a pending `SupplierOrder` already exists for this item (prevent duplicate orders)
- [ ] Calculate "deliver-by" date based on consumption rate (average daily usage from last 7 days)

### Task 2: SupplierOrder Creation (AC: pending order)

- [ ] Create `SupplierOrder` record with status `pending`, item details, location info, deliver-by date
- [ ] Look up linked supplier via `SupplierRestaurantLink` for the item's location
- [ ] Emit `inventory.reorder.triggered` event to tenant namespace AND `supplier:{supplierId}` room
- [ ] Include full order details in event payload: restaurant name, item, quantity, deliver-by

### Task 3: Outbound Webhook Push (AC: Enterprise tier API integration)

- [ ] Create `backend/src/integrations/webhook-delivery.service.ts` (if not already from Epic 7)
- [ ] On auto-reorder trigger, check supplier's webhook URL configuration
- [ ] Check tenant's subscription tier — only push for Enterprise tier
- [ ] POST purchase order to supplier's webhook URL with HMAC-SHA256 signed payload (`X-FoodTech-Signature` header)
- [ ] Implement 3x exponential backoff retry (1s, 4s, 16s) on failure
- [ ] Dead-letter queue for failed deliveries after 3 retries

### Task 4: Write Tests (AC: all)

- [ ] Unit tests for auto-reorder threshold detection logic
- [ ] Unit tests for consumption rate calculation
- [ ] Unit tests for duplicate order prevention
- [ ] Integration test: bump → inventory decrement → threshold breach → SupplierOrder created → event emitted
- [ ] Unit test for outbound webhook delivery with HMAC signing
- [ ] Test tier gating (Indie/Growth skip outbound push, Enterprise triggers it)

## Dev Notes

- Auto-reorder triggers on `inventory.updated` event — must check threshold AFTER decrement
- Consumption rate: rolling average of daily usage from last 7 days of order history
- Duplicate prevention: skip if pending SupplierOrder exists for same item + location
- Outbound webhook uses same HMAC-SHA256 signing pattern as inbound API auth
- Enterprise tier check via TierGuard/subscription lookup

### Project Structure Notes

- `backend/src/supplier/auto-reorder.service.ts` — event listener + reorder logic
- `backend/src/integrations/webhook-delivery.service.ts` — outbound webhook with retry
- `backend/src/supplier/entities/supplier-order.entity.ts` — Drizzle schema

### References

- [Source: epics.md#Story 5.3]
- [Source: architecture.md#Webhook delivery pattern]
- [Source: prd.md#FR16, FR36]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
