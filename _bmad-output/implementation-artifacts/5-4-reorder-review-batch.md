# Story 5.4: Reorder Review, Confirmation & Batch Operations

Status: ready-for-dev

## Story

As **Linda (supplier)**,
I want to review, confirm, and batch auto-triggered reorders from my restaurant clients,
So that I can efficiently manage fulfillment and optimize delivery routes.

## Acceptance Criteria (BDD)

**Given** Linda views the OrderTable on the Supplier Portal
**When** pending reorders are displayed
**Then** each order shows: restaurant name, item, quantity, deliver-by date, and a "Confirm" button — confirming a single order takes 1 click (2 seconds per the UX spec)

**Given** Linda wants to confirm multiple orders at once
**When** she selects 2 or more orders via checkboxes and clicks "Confirm Selected" on the BatchActionBar
**Then** all selected orders are confirmed simultaneously via POST `/api/v1/supplier/orders/batch-confirm`, each order's status changes to `confirmed`, and confirmation events are emitted per order

**Given** Linda has confirmed multiple orders
**When** she clicks "Batch Route" on the BatchActionBar
**Then** the orders are grouped by delivery route (geographic proximity of restaurant locations), Linda can set delivery times per batch, and the routing is processed via POST `/api/v1/supplier/orders/batch-route` — batching 5 orders takes ~20 seconds vs 30+ minutes via phone

**Given** Linda confirms or routes an order
**When** the confirmation event is emitted
**Then** the linked restaurant sees the confirmation status in Kitchen Status: "Confirmed — arriving [date/time]" — visible to expeditors and managers

## Tasks / Subtasks

### Task 1: Order Table Component (AC: display pending orders)

- [ ] Create `supplier-portal/src/components/OrderTable/OrderTable.tsx` — data table with sortable columns
- [ ] Columns: restaurant name, item, quantity, deliver-by date, status, action (Confirm button)
- [ ] Add checkbox column for multi-select
- [ ] Implement single-click confirm via inline button
- [ ] Style per UX-DR15: sticky header, 25-row pagination with load-more, keyboard navigable

### Task 2: Batch Action Bar (AC: batch confirm & route)

- [ ] Create `supplier-portal/src/components/BatchActionBar/BatchActionBar.tsx` — floating action bar
- [ ] Show when 2+ orders selected: "Confirm Selected" and "Batch Route" buttons
- [ ] Track selected order IDs in component state
- [ ] Wire to batch confirm and batch route API calls

### Task 3: Batch Confirm API (AC: POST /api/v1/supplier/orders/batch-confirm)

- [ ] Create endpoint POST `/api/v1/supplier/orders/batch-confirm` accepting `{ orderIds: string[] }`
- [ ] Validate all orders belong to the authenticated supplier
- [ ] Update each order status to `confirmed`, set `confirmed_at` timestamp
- [ ] Emit `supplier.order.confirmed` event per order to the linked restaurant's tenant namespace
- [ ] Return summary: `{ confirmed: number, failed: number, errors: [] }`

### Task 4: Batch Route API (AC: POST /api/v1/supplier/orders/batch-route)

- [ ] Create endpoint POST `/api/v1/supplier/orders/batch-route` accepting `{ groups: [{ orderIds, deliveryTime }] }`
- [ ] Group orders by geographic proximity of restaurant locations (simple distance-based grouping)
- [ ] Set delivery times per batch
- [ ] Emit `supplier.order.routed` event per order

### Task 5: Kitchen Status Integration (AC: confirmation visible in kitchen)

- [ ] Emit `supplier.order.updated` WebSocket event to restaurant's tenant namespace on confirm/route
- [ ] Event payload includes: item name, supplier name, expected delivery date/time, status

### Task 6: Write Tests (AC: all)

- [ ] Unit tests for OrderTable component (render, select, confirm)
- [ ] Unit tests for BatchActionBar (visibility, actions)
- [ ] Integration tests for batch-confirm endpoint (multi-order, validation, events)
- [ ] Integration tests for batch-route endpoint

## Dev Notes

- OrderTable follows UX-DR15: data table + sidebar, desktop-first, 12-column grid
- BatchActionBar is a floating bar that appears on multi-select (UX-DR18 action hierarchy)
- Confirmation events must propagate to restaurant Kitchen Status views (cross-module)
- Geographic grouping is a simple implementation — not full route optimization

### Project Structure Notes

- `supplier-portal/src/components/OrderTable/` — table component
- `supplier-portal/src/components/BatchActionBar/` — floating action bar
- `backend/src/supplier/supplier-orders.controller.ts` — batch endpoints
- `backend/src/supplier/supplier-orders.service.ts` — batch logic

### References

- [Source: epics.md#Story 5.4]
- [Source: ux-design-specification.md#UX-DR15, UX-DR18]
- [Source: prd.md#FR34, FR35]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
