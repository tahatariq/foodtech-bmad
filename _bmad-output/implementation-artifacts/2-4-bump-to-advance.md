# Story 2.4: Bump-to-Advance Interaction

Status: ready-for-dev

## Story

As a **line cook (Marco)**,
I want to tap a single bump button to advance my ticket to the next stage,
so that I can move through orders quickly without any friction.

## Acceptance Criteria (BDD)

**Given** a TicketCard is displayed in Station View with a BumpButton
**When** Marco taps the bump button
**Then** the ticket visually slides to the next stage (200ms ease-out animation) immediately via optimistic UI — before server confirmation
**And** the next ticket in the queue rises to fill the gap
**And** the stage counter updates (e.g., "Preparing: 4 → 3")

**Given** the bump button component
**Then** it renders as a full-width button at the bottom of the ticket card, 56dp height, "BUMP →" label, brand blue (#3B82F6), with no confirmation dialog
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
- [ ] Create `frontend/src/components/BumpButton/BumpButton.tsx`
- [ ] Render full-width button at bottom of ticket card
- [ ] 56dp height, "BUMP →" label, brand blue background (#3B82F6)
- [ ] No confirmation dialog on tap
- [ ] Touch feedback: press state darkens (50ms transition), brief scale-down (0.98) on tap
- [ ] Keyboard activation: Enter and Space keys trigger bump
- [ ] Dynamic `aria-label="Advance order [number] to [next stage]"` with order number and next stage name
- [ ] `role="button"` (native button element)
- [ ] 24px padding
- [ ] `disabled` state: grayed out during sync conflict
- [ ] Create `frontend/src/components/BumpButton/index.ts` re-export
- [ ] Create `frontend/src/components/BumpButton/BumpButton.test.tsx`

### Task 2: Implement optimistic bump in frontend (AC 1)
- [ ] Create `useBump` hook or extend `useStationOrders` to handle bump action
- [ ] On bump tap: immediately update TanStack Query cache via `queryClient.setQueryData()` — move ticket to next stage
- [ ] Animate ticket slide-out (200ms ease-out CSS transition)
- [ ] Animate next ticket rising to fill gap (200ms ease-out)
- [ ] Update stage counter display (e.g., "Preparing: 4 → 3")
- [ ] Use TanStack Query's `useMutation` with `onMutate` for optimistic update

### Task 3: Implement bump rollback on server rejection (AC 4)
- [ ] In `useMutation.onError` callback: revert TanStack Query cache to previous state
- [ ] Snap ticket back to its previous stage position (no animation — instant snap)
- [ ] Apply amber flash animation (0.5s) to the reverted ticket
- [ ] Display non-blocking toast notification with rejection reason (e.g., "Order was cancelled by another user")
- [ ] Use a lightweight toast library or create simple toast component

### Task 4: Create backend bump API endpoint (AC 5)
- [ ] Add `POST /api/v1/orders/:orderId/bump` endpoint to `OrdersController`
- [ ] Apply auth guard (JWT) and role guard (`line_cook`, `expeditor`)
- [ ] Apply `TenantScope` interceptor

### Task 5: Implement OrdersService.bumpOrder() (AC 1, AC 3, AC 5)
- [ ] Implement `bumpOrder(orderId, tenantId)` method in `OrdersService`
- [ ] Look up current stage of order's items at the requesting station
- [ ] Look up next stage from `order_stages` table (by sequence + 1)
- [ ] If next stage exists: update `order_items.stage` to next stage
- [ ] If current stage is the last stage: mark as "served", set `order.status = 'served'`
- [ ] Check if ALL items across ALL stations have reached final stage — if so, set `order.status = 'completed'`
- [ ] Return updated order state
- [ ] Handle conflict: if order is already cancelled or completed, return 409

### Task 6: Emit WebSocket events on bump (AC 3, AC 5)
- [ ] After successful bump: emit `order.stage.changed` event via `OrdersGateway`
- [ ] Payload: `FoodTechEvent<{ orderId, fromStage, toStage, stationId }>` with tenantId, timestamp, eventId
- [ ] Fan out to rooms: `station:{stationId}`, `expeditor`, `customer:{orderId}`
- [ ] If order completed: emit `order.completed` event with `{ orderId, completedAt, totalTime }`
- [ ] Frontend: ticket fades out (300ms CSS transition) when final stage reached

### Task 7: Integrate BumpButton into TicketCard (AC 1, AC 2)
- [ ] Add `BumpButton` to bottom of `TicketCard` component (station variant)
- [ ] Pass order number and next stage name to BumpButton for aria-label
- [ ] Wire `onClick` to optimistic bump mutation
- [ ] Disable button while mutation is in-flight to prevent double-bumps

### Task 8: Write frontend tests (AC 1, AC 2, AC 4)
- [ ] Test BumpButton renders with correct label, size, color
- [ ] Test keyboard activation (Enter/Space)
- [ ] Test aria-label contains order number and next stage
- [ ] Test optimistic update: ticket moves immediately on bump
- [ ] Test rollback: ticket snaps back on server rejection with amber flash
- [ ] Test toast notification appears on rejection
- [ ] Test button disabled state during mutation

### Task 9: Write backend tests (AC 3, AC 5)
- [ ] Test `POST /api/v1/orders/:orderId/bump` advances to next stage
- [ ] Test bump on final stage sets order to "served"
- [ ] Test bump on already-completed order returns 409
- [ ] Test `order.stage.changed` event emitted with correct payload
- [ ] Test `order.completed` event emitted when all items reach final stage
- [ ] Test tenant isolation — cannot bump order from another tenant

## Dev Notes

### Architecture References
- Optimistic UI pattern: TanStack Query `useMutation` with `onMutate` (optimistic update) and `onError` (rollback)
- WebSocket event flow: Cook bumps → `OrderService.advanceStage()` → `EventBus.emit('order.stage.changed')` → Socket.io gateway fans out to rooms
- Event format: `FoodTechEvent<T>` wrapper with typed payload
- Guard chain for bump: `AuthGuard → TenantGuard → RolesGuard(['line_cook', 'expeditor']) → Controller`
- Conflict handling: 409 response if order already bumped/cancelled by another user

### Technical Stack
- Frontend: React 19, TanStack Query 5.x (useMutation + optimistic updates), Tailwind CSS v4.2
- Backend: NestJS 11.x, Socket.io, Drizzle ORM
- Animation: CSS transitions (200ms ease-out slide, 300ms fade-out, 50ms press feedback)

### UX Component Specifications

**BumpButton:**
- Purpose: One-tap stage advancement — the atomic interaction
- Content: "BUMP →" label
- Actions: Single tap advances ticket. No confirmation. No long-press variant.
- States: `default` (primary blue #3B82F6), `pressed` (darkened, 50ms), `bumping` (scale-down 0.98), `disabled` (grayed, during sync conflict)
- Accessibility: `role="button"`, `aria-label="Advance order [number] to [next stage]"`, keyboard Enter/Space
- Touch target: 56dp height, full card width, 24px padding

### File Structure
```
frontend/src/components/BumpButton/
├── BumpButton.tsx             # NEW
├── BumpButton.test.tsx        # NEW
└── index.ts                   # NEW

frontend/src/views/station/
├── StationView.tsx            # MODIFY — integrate BumpButton
└── hooks/
    └── useStationOrders.ts    # MODIFY — add bump mutation

frontend/src/components/TicketCard/
└── TicketCard.tsx             # MODIFY — add BumpButton slot

backend/src/modules/orders/
├── orders.controller.ts       # MODIFY — add POST /bump endpoint
├── orders.service.ts          # MODIFY — add bumpOrder() method
├── orders.gateway.ts          # MODIFY — emit stage.changed and completed events
└── orders.service.test.ts     # MODIFY — add bump tests

packages/shared-types/src/
└── events.ts                  # MODIFY — add order.stage.changed, order.completed types
```

### Testing Requirements
- Frontend: Vitest + React Testing Library for component tests, test optimistic update and rollback
- Backend: Jest for service/controller tests, test stage progression logic
- Integration: test full bump flow from tap → API → WebSocket event → cache update
- Accessibility: verify keyboard activation, ARIA labels, touch target size

### Dependencies
- Story 2.1 must be complete (order_stages table for stage sequence lookup)
- Story 2.2 must be complete (orders exist, order.created event infrastructure)
- Story 2.3 must be complete (TicketCard component, StationView, useStationOrders hook)

### References
- [Source: epics.md#Epic 2, Story 2.4]
- [Source: ux-design-specification.md#Journey 1: Marco — Bump-to-Advance]
- [Source: ux-design-specification.md#Custom Components — BumpButton]
- [Source: architecture.md#Frontend Architecture — State Management]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
