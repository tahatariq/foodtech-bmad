# Story 2.4: Bump-to-Advance Interaction

Status: ready-for-dev

## Story

As a **line cook (Marco)**,
I want to tap a single bump button to advance my ticket to the next stage,
So that I can move through orders quickly without any friction.

## Acceptance Criteria (BDD)

**Given** a TicketCard is displayed in Station View with a BumpButton
**When** Marco taps the bump button
**Then** the ticket visually slides to the next stage (200ms ease-out animation) immediately via optimistic UI — before server confirmation
**And** the next ticket in the queue rises to fill the gap
**And** the stage counter updates (e.g., "Preparing: 4 -> 3")

**Given** the bump button component
**Then** it renders as a full-width button at the bottom of the ticket card, 56dp height, "BUMP ->" label, brand blue (#3B82F6), with no confirmation dialog
**And** touch feedback is immediate: press state darkens (50ms), brief scale-down (0.98)
**And** keyboard activation via Enter/Space is supported
**And** `aria-label="Advance order [number] to [next stage]"`

**Given** Marco bumps the last item in an order
**When** the order reaches the final stage ("served")
**Then** the ticket fades out (300ms) and an `order.completed` event is emitted

**Given** the server rejects a bump (e.g., order was cancelled)
**When** the rejection arrives
**Then** the ticket snaps back to its previous stage with an amber flash, and a non-blocking toast notification explains why

**And** a POST to `/api/v1/orders/:orderId/bump` advances the order to the next configured stage and emits `order.stage.changed` event

## Tasks / Subtasks

### Task 1: Create BumpButton component (AC 2)
- [ ] Create `frontend/src/components/kitchen/BumpButton/BumpButton.tsx`
- [ ] Render as native `<button>` element — full-width at bottom of ticket card
- [ ] 56dp minimum height, "BUMP ->" label text (bold, uppercase)
- [ ] Background: brand blue `#3B82F6`, text white, rounded-lg
- [ ] No confirmation dialog on tap — immediate action
- [ ] Touch feedback CSS: `:active` state darkens background to `#2563EB` (50ms transition), `transform: scale(0.98)` on press
- [ ] Keyboard activation: native button handles Enter/Space automatically
- [ ] Dynamic `aria-label="Advance order {orderNumber} to {nextStageName}"`
- [ ] `disabled` state: `opacity-50`, `cursor-not-allowed`, grayed out during in-flight mutation
- [ ] 24px horizontal padding
- [ ] Create `frontend/src/components/kitchen/BumpButton/index.ts` barrel re-export
- [ ] Create `frontend/src/components/kitchen/BumpButton/BumpButton.test.tsx`

### Task 2: Implement `useBump` mutation hook with optimistic update (AC 1)
- [ ] Create `frontend/src/views/StationView/hooks/useBump.ts`
- [ ] Use TanStack Query `useMutation` calling `POST /api/v1/orders/:orderId/bump`
- [ ] `onMutate`: snapshot current cache, optimistically update ticket stage in TanStack Query cache via `queryClient.setQueryData(['orders', stationId], updater)`
- [ ] Optimistic updater: move the bumped order to next stage, decrement stage counter
- [ ] Return `{ previousOrders }` context for rollback
- [ ] `onError`: restore cache from snapshot (`queryClient.setQueryData` with previous data)
- [ ] `onSettled`: optionally invalidate query to ensure server consistency

### Task 3: Implement bump animations (AC 1, AC 3)
- [ ] Ticket slide-out animation: CSS transition `transform: translateX(100%)` over 200ms ease-out
- [ ] Gap fill animation: remaining tickets shift up with 200ms ease-out transition (CSS `transition: transform 200ms ease-out`)
- [ ] Stage counter update: animate number change (e.g., "Preparing: 4 -> 3")
- [ ] Final stage fade-out: when ticket reaches "served", apply `opacity: 0` transition over 300ms, then remove from DOM
- [ ] Respect `prefers-reduced-motion`: skip slide/fade, use instant transitions

### Task 4: Implement bump rollback on server rejection (AC 4)
- [ ] In `useMutation.onError` callback: restore TanStack Query cache from `previousOrders` snapshot
- [ ] Snap ticket back to previous position instantly (no animation)
- [ ] Apply amber flash animation: `@keyframes amberFlash` — amber border/glow for 0.5s, then fade
- [ ] Display non-blocking toast notification with rejection reason text
- [ ] Toast: auto-dismiss after 4 seconds, positioned bottom-center, amber background
- [ ] Create lightweight toast component or use existing toast system

### Task 5: Create backend bump API endpoint (AC 5)
- [ ] Add `POST /api/v1/orders/:orderId/bump` to `backend/src/orders/orders.controller.ts`
- [ ] Apply guard chain: `AuthGuard -> TenantGuard -> RolesGuard(['line_cook', 'expeditor'])`
- [ ] Validate `orderId` is UUID format (Zod pipe validation)
- [ ] Return 200 with updated order state on success
- [ ] Return 404 if order not found in tenant
- [ ] Return 409 if order is already cancelled or completed (conflict)

### Task 6: Implement OrdersService.bumpOrder() business logic (AC 1, AC 3, AC 5)
- [ ] Create `bumpOrder(orderId: string, tenantId: string, stationId: string)` method in `backend/src/orders/orders.service.ts`
- [ ] Look up current stage of order items at the requesting station
- [ ] Look up next stage from `order_stages` table (current sequence + 1)
- [ ] If next stage exists: update `order_items.stage` to next stage name, update `order_items.updated_at`
- [ ] If current stage is the last configured stage: set item stage to "served"
- [ ] Check if ALL items across ALL stations have reached final stage — if so, set `order.status = 'completed'`, update `order.updated_at`
- [ ] Wrap in database transaction for atomicity
- [ ] Return updated order object with new stage info

### Task 7: Emit WebSocket events on bump (AC 3, AC 5)
- [ ] After successful bump in service: emit `order.stage.changed` event via Socket.io gateway
- [ ] Event payload: `FoodTechEvent<{ orderId, orderNumber, fromStage, toStage, stationId, timestamp }>`
- [ ] Fan out to rooms: `station:{stationId}`, `expeditor`, `customer:{orderId}`
- [ ] If order completed: emit `order.completed` event with `{ orderId, orderNumber, completedAt, totalTimeMs }`
- [ ] Calculate `totalTimeMs` from order `created_at` to completion time

### Task 8: Integrate BumpButton into TicketCard (AC 1, AC 2)
- [ ] Add `BumpButton` to bottom of `TicketCard` when `variant="station"`
- [ ] Pass `orderNumber` and `nextStageName` to BumpButton for aria-label computation
- [ ] Wire `onClick` to `useBump` mutation's `mutate()` function
- [ ] Disable BumpButton while mutation is in-flight (`isPending`) to prevent double-bumps
- [ ] Do not render BumpButton for `expeditor` or `rail` variants

### Task 9: Create bump API client function (AC 5)
- [ ] Add `bumpOrder(orderId: string): Promise<Order>` to `frontend/src/api/orders.api.ts`
- [ ] POST to `/api/v1/orders/${orderId}/bump`
- [ ] Include auth token via interceptor
- [ ] Type response using shared-types `Order` interface

### Task 10: Write frontend tests (AC 1, AC 2, AC 4)
- [ ] Test BumpButton renders with correct label ("BUMP ->"), size (56dp+), color (#3B82F6)
- [ ] Test BumpButton `aria-label` contains order number and next stage name
- [ ] Test keyboard activation: simulate Enter and Space keypress events
- [ ] Test optimistic update: after bump, ticket cache reflects next stage before API resolves
- [ ] Test rollback: on API error, ticket returns to previous stage
- [ ] Test amber flash animation class applied on rollback
- [ ] Test toast notification appears with rejection reason on error
- [ ] Test button shows disabled state during in-flight mutation
- [ ] Test final-stage bump triggers fade-out animation

### Task 11: Write backend tests (AC 3, AC 5)
- [ ] Test `POST /api/v1/orders/:orderId/bump` returns 200 with updated order
- [ ] Test bump advances item from "received" to "preparing"
- [ ] Test bump on last stage sets item to "served"
- [ ] Test bump when all items completed sets `order.status = 'completed'`
- [ ] Test bump on cancelled order returns 409
- [ ] Test bump on completed order returns 409
- [ ] Test `order.stage.changed` event emitted with correct payload shape
- [ ] Test `order.completed` event emitted when all items done
- [ ] Test tenant isolation: cannot bump order belonging to another tenant (404)
- [ ] Test unauthorized role returns 403

## Dev Notes

### Architecture Patterns
- Optimistic UI pattern: TanStack Query `useMutation` with `onMutate` (cache snapshot + optimistic update) and `onError` (rollback from snapshot)
- WebSocket event flow: Cook bumps -> `OrderService.bumpOrder()` -> DB transaction -> `EventBus.emit('order.stage.changed')` -> Socket.io gateway fans out to rooms
- Event format: `FoodTechEvent<T>` wrapper with typed payload, `eventId` for deduplication
- Guard chain: `AuthGuard -> TenantGuard -> RolesGuard(['line_cook', 'expeditor']) -> Controller`
- Conflict handling: 409 Conflict response if order state has changed (cancelled/completed)
- Animation: CSS transitions only (no JS animation libraries) — 200ms ease-out slide, 300ms fade-out, 50ms press feedback

### Project Structure Notes

```
frontend/src/components/kitchen/BumpButton/
├── BumpButton.tsx                    # NEW
├── BumpButton.test.tsx               # NEW
└── index.ts                          # NEW

frontend/src/views/StationView/
├── StationView.tsx                   # MODIFY — integrate BumpButton into TicketCard
└── hooks/
    ├── useStationOrders.ts           # MODIFY — add stage counter state
    └── useBump.ts                    # NEW — optimistic bump mutation

frontend/src/components/kitchen/TicketCard/
└── TicketCard.tsx                    # MODIFY — add BumpButton slot at bottom

frontend/src/api/orders.api.ts        # MODIFY — add bumpOrder() function

backend/src/orders/
├── orders.controller.ts              # MODIFY — add POST /bump endpoint
├── orders.service.ts                 # MODIFY — add bumpOrder() method
├── orders.service.test.ts            # MODIFY — add bump tests
└── orders.gateway.ts                 # MODIFY — emit stage.changed and completed events

packages/shared-types/src/events.ts   # MODIFY — add order.stage.changed, order.completed types
```

### References
- [Source: epics.md#Epic 2, Story 2.4]
- [Source: ux-design-specification.md#Journey 1: Marco — Bump-to-Advance]
- [Source: ux-design-specification.md#Custom Components — BumpButton]
- [Source: architecture.md#Frontend Architecture — State Management]
- UX-DR3 (zero-friction bump interaction)

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
