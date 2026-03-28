# Story 5.6: Supplier Order Status in Kitchen Views

Status: review

## Story

As **Adrienne (expeditor) or David (owner)**,
I want to see supplier order confirmation status in the Kitchen Status area,
So that I know when resupply is arriving and can plan around inventory gaps.

## Acceptance Criteria (BDD)

**Given** a supplier has confirmed a reorder for the restaurant
**When** the Expeditor Dashboard or Management Console renders Kitchen Status
**Then** the confirmed supplier order appears with: item name, supplier name, expected delivery date/time, and status (confirmed/shipped/delivered) — visible alongside the 86 Board for context

**Given** a supplier updates an order's status (e.g., shipped, delivered)
**When** the status change is received via WebSocket `supplier.order.updated` event
**Then** the Kitchen Status area updates in real-time, and when status reaches "delivered" the item's reorder status is cleared

**Given** an auto-reorder was triggered but the supplier has not confirmed within 4 hours
**When** the Expeditor Dashboard renders
**Then** the pending reorder enters an attention state (AttentionWrapper with `level="warning"`) flagging it as unconfirmed — giving the expeditor a cue to follow up manually

## Tasks / Subtasks

### Task 1: Supplier Order Status API (AC: fetch confirmed orders)

- [ ] Create GET `/api/v1/kitchen-status/supplier-orders` — returns active supplier orders for the tenant
- [ ] Include: item name, supplier name, expected delivery, status, created_at
- [ ] Filter to active orders only (pending/confirmed/shipped — exclude delivered)

### Task 2: Kitchen Status Supplier Panel (AC: UI integration)

- [ ] Create `frontend/src/components/kitchen/SupplierOrderStatus/SupplierOrderStatus.tsx`
- [ ] Display supplier orders alongside 86 Board in Expeditor Dashboard
- [ ] Show status badge: pending (gray), confirmed (blue), shipped (amber), delivered (green)
- [ ] Show expected delivery date/time for confirmed/shipped orders

### Task 3: Real-Time Updates (AC: WebSocket events)

- [ ] Handle `supplier.order.updated` WebSocket event in Expeditor Dashboard
- [ ] Update TanStack Query cache for supplier orders on event
- [ ] On `delivered` status: clear item's reorder indicator, update inventory status

### Task 4: Unconfirmed Order Warning (AC: 4-hour attention state)

- [ ] Calculate time since auto-reorder trigger for pending orders
- [ ] Apply AttentionWrapper with `level="warning"` for orders pending > 4 hours
- [ ] Display "Unconfirmed — [X] hours ago" label

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for SupplierOrderStatus component (render, status badges, attention state)
- [ ] Unit tests for 4-hour warning threshold logic
- [ ] Integration test: supplier confirms → WebSocket event → Kitchen Status updates

## Dev Notes

- This component lives in the **restaurant frontend** (not supplier-portal)
- Integrates into Expeditor Dashboard alongside the existing 86 Board panel
- AttentionWrapper reuse from Epic 1 foundation components
- 4-hour threshold should be configurable (env var or tenant setting)

### Project Structure Notes

- `frontend/src/components/kitchen/SupplierOrderStatus/` — status panel component
- `frontend/src/views/ExpeditorDashboard/` — integration point
- `backend/src/kitchen-status/` — API endpoint

### References

- [Source: epics.md#Story 5.6]
- [Source: prd.md#FR37]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
