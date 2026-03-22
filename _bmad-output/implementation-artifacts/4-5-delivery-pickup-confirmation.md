# Story 4.5: Delivery Pickup Confirmation & Queue Prioritization

Status: ready-for-dev

## Story

As **Jason (delivery partner)**,
I want to confirm order pickup with one tap and see the queue prioritized by readiness and wait time,
so that I can complete pickups efficiently and ensure no order waits too long.

## Acceptance Criteria (BDD)

**Given** an order is in "Ready" status on the Delivery Board
**When** Jason taps the "Pick Up" button (one tap -- no confirmation dialog for non-destructive action)
**Then** a POST to `/api/v1/delivery/orders/:orderId/pickup` marks the order as picked up, the order is removed from the board with a slide-out animation, an `order.picked_up` event is emitted updating the Customer Tracker (Priya sees "Picked up by driver"), and the board re-sorts remaining orders

**Given** the Delivery Board queue
**When** multiple orders are in various stages
**Then** the queue is prioritized: (1) Ready orders sorted by wait time descending (longest-waiting first), (2) Upcoming orders sorted by ETA ascending (soonest-ready first) -- per FR31

**Given** an order has been ready for more than 5 minutes without pickup
**When** the Delivery Board renders
**Then** the order's card enters an attention state (AttentionWrapper with `level="warning"`) to flag it as potentially forgotten

## Tasks / Subtasks

### AC1: One-Tap Pickup Confirmation

- [ ] Backend: create `POST /api/v1/delivery/orders/:orderId/pickup` endpoint in `delivery.controller.ts`
  - [ ] Validate location API key auth
  - [ ] Verify the order exists and is in "Ready" status
  - [ ] Update order status to "Picked Up" in the database
  - [ ] Record pickup timestamp for metrics
  - [ ] Return 200 with updated order status
  - [ ] Return 409 if order is not in "Ready" status (already picked up or not yet ready)
- [ ] Backend: emit `order.picked_up` event on successful pickup
  - [ ] Emit to `delivery` WebSocket room (removes from delivery board)
  - [ ] Emit to `customer:{orderId}` WebSocket room (updates customer tracker)
- [ ] Frontend: implement "Pick Up" button on ready order cards
  - [ ] One tap -- no confirmation dialog (this is a non-destructive action)
  - [ ] Optimistic UI: immediately start slide-out animation on tap
  - [ ] On success: remove order card from DOM after animation completes
  - [ ] On failure: reverse animation, show inline error toast, restore card
  - [ ] Disable button during request to prevent double-tap
- [ ] Frontend: slide-out animation for picked-up orders
  - [ ] CSS transition: `transform: translateX(100%)` + `opacity: 0` over 300ms
  - [ ] After animation: remove element and re-sort remaining orders
  - [ ] Respect `prefers-reduced-motion`: instant removal without animation
- [ ] Customer Tracker integration: when `order.picked_up` event is received
  - [ ] Update tracker status to "Picked up by driver"
  - [ ] Update progress display appropriately
- [ ] Write unit test: POST endpoint marks order as picked up
- [ ] Write unit test: 409 returned for non-ready orders
- [ ] Write unit test: `order.picked_up` event emitted to both rooms
- [ ] Write unit test: optimistic UI removes card, rollback on error
- [ ] Write integration test: full pickup flow -- tap button, verify board update + customer tracker update

### AC2: Queue Prioritization Logic

- [ ] Backend: implement queue sorting in `delivery.service.ts`
  - [ ] Primary partition: Ready orders first, then Upcoming orders
  - [ ] Ready orders: sorted by `ready_at` ascending (longest-waiting first = earliest `ready_at`)
  - [ ] Upcoming orders: sorted by ETA ascending (soonest-ready first)
  - [ ] Return sort order in API response for GET `/api/v1/delivery/orders`
- [ ] Frontend: maintain sort order on client after WebSocket updates
  - [ ] When a new order becomes ready: insert into Ready section at correct position
  - [ ] When an order is picked up: remove and re-sort
  - [ ] When ETA updates: re-sort Upcoming section
- [ ] Add visual section dividers between Ready and Upcoming groups
  - [ ] "Ready for Pickup" header with count badge
  - [ ] "Coming Up" header with count badge
- [ ] Write unit test: sort algorithm produces correct order for mixed-status queue
- [ ] Write unit test: WebSocket update triggers correct re-sort
- [ ] Write unit test: section headers show correct counts

### AC3: Attention State for Stale Ready Orders

- [ ] Backend: include `ready_at` timestamp in order data sent to delivery board
- [ ] Frontend: calculate wait time as `now - ready_at` for each ready order
- [ ] Wrap ready order cards in `AttentionWrapper` component:
  - [ ] If wait time < 5 minutes: no attention state (normal rendering)
  - [ ] If wait time >= 5 minutes: `AttentionWrapper` with `level="warning"`
    - [ ] Visual: amber/orange border pulse, slightly elevated card
    - [ ] The attention state intensifies the longer the order waits (per UX attention-driven design)
- [ ] Client-side timer: re-evaluate wait time every 30 seconds to trigger attention state transitions
- [ ] Respect `prefers-reduced-motion`: show static amber border instead of pulse animation
- [ ] Write unit test: orders waiting < 5 minutes have no attention wrapper
- [ ] Write unit test: orders waiting >= 5 minutes render with warning attention state
- [ ] Write unit test: attention state applies correctly after wait time threshold crossed

## Dev Notes

### Architecture References

- Backend module: `backend/src/modules/delivery/` (FR28-FR31)
- Delivery controller: `backend/src/modules/delivery/delivery.controller.ts`
- Delivery service: `backend/src/modules/delivery/delivery.service.ts`
- Delivery gateway: `backend/src/modules/delivery/delivery.gateway.ts`
- Customer tracker gateway: `backend/src/modules/customer-tracker/customer-tracker.gateway.ts` (for cross-room event)
- AttentionWrapper component: `frontend/src/components/AttentionWrapper/AttentionWrapper.tsx`
- API boundary: `/api/v1/delivery/*` -- location API key auth

### Technical Stack

- **Backend:** NestJS with TypeScript
- **Database:** PostgreSQL -- update order status, record pickup timestamp
- **WebSocket:** Socket.io -- emit to `delivery` and `customer:{orderId}` rooms simultaneously
- **Frontend:** React with Vite, TypeScript
- **Styling:** Tailwind CSS v4.2
- **Animation:** CSS transitions for slide-out, AttentionWrapper CSS `@keyframes` for pulse
- **Optimistic UI:** Local state update before server confirmation, rollback on failure

### File Structure

```
backend/src/modules/
├── delivery/
│   ├── delivery.controller.ts     # Add: POST /delivery/orders/:orderId/pickup
│   ├── delivery.service.ts        # Add: pickup logic, queue sorting, emit events
│   ├── delivery.gateway.ts        # Modify: emit order.picked_up to delivery room
│   └── delivery.service.test.ts   # Add: pickup + sort tests
├── customer-tracker/
│   └── customer-tracker.gateway.ts  # Modify: handle order.picked_up for customer room
frontend/src/
├── views/
│   └── delivery/
│       ├── DeliveryBoard.tsx       # Modify: add pickup button, queue sections, attention state
│       └── DeliveryBoard.test.tsx  # Add: pickup, sort, attention tests
├── components/
│   └── AttentionWrapper/
│       ├── AttentionWrapper.tsx     # Used: wrap stale ready orders
│       └── AttentionWrapper.test.tsx
```

### Testing Requirements

- **Unit tests:** Pickup endpoint validation, queue sort algorithm, attention state thresholds, optimistic UI + rollback, cross-room event emission
- **Integration tests:** Full pickup flow across delivery board and customer tracker, queue re-sorting after pickup
- **E2E tests:** Jason taps pickup -> order slides out -> Priya sees "Picked up by driver"
- **Edge case tests:** Double-tap prevention, pickup of already-picked-up order (409), network failure during pickup (rollback)
- **Accessibility tests:** AttentionWrapper warning state announced to screen readers, reduced-motion compliance

### Dependencies

- **Upstream:** Story 4.4 (Delivery Board page, CountdownETA component, WebSocket connection must exist)
- **Cross-story:** Story 4.2/4.3 (Customer Tracker must be able to receive `order.picked_up` events)
- **Components:** AttentionWrapper component from shared components library
- **Epics 1+2+3:** Order lifecycle must support status transitions to "Picked Up"

### References

- Architecture: delivery module (lines 843-848 of architecture.md)
- Architecture: AttentionWrapper component (lines 950-953 of architecture.md)
- UX: Journey 4 -- Jason pickup flow (lines 842-868 of ux-design-specification.md)
- UX: Attention-driven design system (component-level attention states)
- Epics: Story 4.5 acceptance criteria (lines 1008-1027 of epics.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
