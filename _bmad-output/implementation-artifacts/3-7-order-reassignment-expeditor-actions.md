# Story 3.7: Order Reassignment & Expeditor Actions

Status: ready-for-dev

## Story

As an **expeditor (Adrienne)**,
I want to reassign orders between stations and revert accidental bumps,
so that I can rebalance kitchen load and correct mistakes.

## Acceptance Criteria (BDD)

**Given** Adrienne views a ticket on the Expeditor Dashboard
**When** she reassigns it to a different station (via drag or reassign action)
**Then** the ticket moves to the new station's queue, a POST to `/api/v1/orders/:orderId/reassign` updates the backend, and an `order.stage.changed` event propagates to all views

**Given** Marco accidentally bumped a ticket
**When** Adrienne taps the ticket and selects "Revert"
**Then** the ticket returns to its previous stage, a POST to `/api/v1/orders/:orderId/revert` processes the change, and all views update
**And** a confirmation dialog appears for revert actions (destructive action pattern — one confirmation step)

**Given** the 86 Board panel on the Expeditor Dashboard
**When** rendered
**Then** all currently 86'd items are displayed as Badge86 components (board variant — larger) with item name, time since 86'd, and which station is affected

## Tasks / Subtasks

### Task 1: Implement Order Reassignment Backend

- [ ] Create `POST /api/v1/orders/:orderId/reassign` endpoint in `orders.controller.ts`
  - [ ] Request body: `{ targetStationId: string }`
  - [ ] Validate target station exists and belongs to same tenant
  - [ ] Validate order exists, is active, and belongs to tenant
- [ ] Implement `OrderService.reassignOrder(orderId, targetStationId)` method
  - [ ] Update order's `station_id` to target station
  - [ ] Preserve current stage (order stays at same preparation stage)
  - [ ] Record reassignment in order history/audit log
- [ ] Emit `order.stage.changed` event with:
  - [ ] `{ orderId, fromStage: currentStage, toStage: currentStage, stationId: targetStationId, previousStationId, action: 'reassigned' }`
- [ ] Propagate event to all rooms: source station, target station, expeditor, customer
- [ ] Apply `@Roles('head_chef', 'location_manager')` guard — only expeditor-level roles
- [ ] Create Zod DTO: `reassign-order.dto.ts` with `targetStationId` validation

### Task 2: Implement Order Revert Backend

- [ ] Create `POST /api/v1/orders/:orderId/revert` endpoint in `orders.controller.ts`
  - [ ] No request body needed (reverts to previous stage)
  - [ ] Validate order exists, is active, has a previous stage to revert to
  - [ ] Validate order is not at first stage (cannot revert "received")
- [ ] Implement `OrderService.revertOrder(orderId)` method
  - [ ] Retrieve order's stage history (requires stage history tracking)
  - [ ] Set order stage to previous stage
  - [ ] If reverting from consumption stage: reverse inventory decrement (add back quantities)
  - [ ] Record revert in order history/audit log
- [ ] Emit `order.stage.changed` event with:
  - [ ] `{ orderId, fromStage: currentStage, toStage: previousStage, stationId, action: 'reverted' }`
- [ ] Propagate event to all rooms
- [ ] Apply `@Roles('head_chef', 'location_manager')` guard

### Task 3: Implement Drag-to-Reassign on Frontend

- [ ] Add drag capability to TicketCard (expeditor variant) in The Rail panel
  - [ ] Use HTML5 Drag and Drop API or lightweight library (e.g., @dnd-kit)
  - [ ] TicketCard becomes draggable with drag handle indicator
  - [ ] Drop targets: StationStatusIndicator components in Kitchen Status panel
- [ ] On drop:
  - [ ] Optimistically move ticket to target station in UI
  - [ ] Call `POST /api/v1/orders/:orderId/reassign` with `targetStationId`
  - [ ] On success: confirm move (TanStack Query cache already updated)
  - [ ] On failure: revert optimistic update, show error toast
- [ ] Drag visual feedback:
  - [ ] Dragged card: slightly transparent (0.5 opacity), elevated shadow
  - [ ] Valid drop target: green highlight border on StationStatusIndicator
  - [ ] Invalid drop target (same station): no highlight
- [ ] Accessibility: provide non-drag alternative — "Reassign" button in ticket context menu

### Task 4: Implement Reassign Action Button (Non-Drag Alternative)

- [ ] Add "Reassign" action to ticket tap/expand view on Expeditor Dashboard
- [ ] On tap → show station picker (list of available stations, excluding current)
- [ ] Use Radix DropdownMenu or Radix Select for station selection
- [ ] On station selected: call reassign API, update UI
- [ ] This is the primary interaction on touch devices (drag may be unreliable on tablets)
- [ ] Accessibility: fully keyboard navigable (Tab to action, Enter to open menu, Arrow keys to select station)

### Task 5: Implement Revert Action with Confirmation Dialog

- [ ] Add "Revert" action to ticket tap/expand view on Expeditor Dashboard
- [ ] On "Revert" tap → show confirmation dialog (Radix AlertDialog)
  - [ ] Title: "Revert Order #[number]?"
  - [ ] Description: "This will return the order to [previous stage]. This cannot be undone."
  - [ ] Actions: "Cancel" (secondary) and "Revert" (destructive/red)
- [ ] On confirm:
  - [ ] Optimistically revert stage in UI
  - [ ] Call `POST /api/v1/orders/:orderId/revert`
  - [ ] On success: confirm revert, show success toast
  - [ ] On failure: rollback optimistic update, show error toast
- [ ] One confirmation step only (per destructive action pattern)
- [ ] Accessibility:
  - [ ] Dialog traps focus
  - [ ] Cancel button focused by default (safe default)
  - [ ] Escape key dismisses dialog

### Task 6: Implement 86 Board Panel (Full Rendering)

- [ ] Ensure 86 Board within Kitchen Status panel renders completely per AC
- [ ] Each Badge86 (board variant) shows:
  - [ ] Item name (e.g., "Salmon")
  - [ ] Time since 86'd (e.g., "86'd 23 min ago") — live updating
  - [ ] Affected station(s) — which stations have orders with this item
- [ ] Badge86 board variant styling:
  - [ ] Larger than inline variant
  - [ ] Red background (`rgba(239, 68, 68, 0.15)`)
  - [ ] Item name in bold, time in muted text
- [ ] Accessibility:
  - [ ] `role="status"` on each Badge86
  - [ ] `aria-label="[Item name] is 86'd — unavailable"`
  - [ ] Live region: new 86'd items announced to screen readers
- [ ] Subscribe to `inventory.86d` and `inventory.updated` events for real-time updates

### Task 7: Handle Inventory Reversal on Revert

- [ ] When reverting an order from a post-consumption stage back to pre-consumption:
  - [ ] Identify inventory items that were decremented for this order
  - [ ] Add back the consumed quantities
  - [ ] If item was 86'd and revert restores quantity > 0: set `is_86d = false`
  - [ ] Emit `inventory.updated` event with restored quantities
- [ ] Store consumption record on order (what was decremented and by how much)
  - [ ] Create `order_consumption_log` table or add to order history
  - [ ] Used for accurate reversal
- [ ] Wrap revert + inventory restoration in database transaction

### Task 8: Trigger Station Status & Tempo Recalculation

- [ ] After reassignment: trigger station status recalculation for both source and target stations
  - [ ] Source station: ticket count decreases → may improve status
  - [ ] Target station: ticket count increases → may worsen status
- [ ] After reassignment/revert: trigger tempo recalculation
  - [ ] TempoService recalculates on `order.stage.changed` event (already subscribed)
- [ ] Attention-driven UI updates automatically via status changes (from Story 3.6)
  - [ ] If reassignment resolves a bottleneck → green flash on source station
  - [ ] If reassignment creates pressure → target station may enter warning

### Task 9: Write Tests

- [ ] Backend unit test: reassign order updates station_id correctly
- [ ] Backend unit test: reassign emits `order.stage.changed` with correct payload
- [ ] Backend unit test: reassign rejected for non-existent target station
- [ ] Backend unit test: reassign rejected for cross-tenant station
- [ ] Backend unit test: revert returns order to previous stage
- [ ] Backend unit test: revert rejected for orders at first stage
- [ ] Backend unit test: revert restores inventory quantities
- [ ] Backend unit test: revert of 86'd item restores availability
- [ ] Backend integration test: full reassign → event propagation flow
- [ ] Backend integration test: full revert → inventory restoration → event flow
- [ ] Frontend component test: drag-to-reassign moves ticket card
- [ ] Frontend component test: reassign button opens station picker
- [ ] Frontend component test: revert button shows confirmation dialog
- [ ] Frontend component test: confirmation dialog has Cancel and Revert buttons
- [ ] Frontend component test: optimistic update on reassign, rollback on failure
- [ ] Frontend component test: Badge86 board variant shows item name, time, station
- [ ] Frontend component test: new 86'd item appears via WebSocket event
- [ ] Accessibility test: reassign action keyboard navigable
- [ ] Accessibility test: revert dialog focus trap and Escape dismiss
- [ ] Accessibility test: Badge86 live region announces new 86'd items
- [ ] RBAC test: only head_chef/location_manager can reassign/revert

## Dev Notes

### Architecture References
- Reassign and revert are expeditor-level actions, restricted to `head_chef` and `location_manager` roles
- Both actions go through the standard event pipeline: Service → EventBus → Socket.io → all rooms
- Inventory reversal on revert requires transaction wrapping and consumption logging
- Optimistic updates on frontend with TanStack Query cache manipulation

### Technical Stack
- **Backend:** NestJS 11.x + TypeScript 5.x + Drizzle ORM + PostgreSQL 16
- **Frontend:** React 19 + Vite 6.x + Tailwind CSS 4.2 + Radix UI 1.4.3
- **Drag & Drop:** HTML5 DnD API or @dnd-kit (evaluate for touch support)
- **Dialogs:** Radix AlertDialog (confirmation), Radix DropdownMenu (station picker)
- **State:** TanStack Query 5.x (optimistic updates), Zustand 5.x (UI state)
- **Testing:** Jest (backend), Vitest (frontend), axe-core (accessibility)

### File Structure
```
backend/src/modules/orders/
├── orders.controller.ts            (extend: /reassign and /revert endpoints)
├── orders.service.ts               (extend: reassignOrder, revertOrder methods)
├── orders.repository.ts            (extend: update station, revert stage queries)
├── dto/
│   └── reassign-order.dto.ts       (Zod schema for reassign)
├── events/
│   └── order.events.ts             (extend: reassigned/reverted action types)
└── orders.service.test.ts          (extend)

backend/src/modules/kitchen-status/
├── kitchen-status.service.ts       (inventory reversal on revert)
└── kitchen-status.service.test.ts  (extend)

frontend/src/views/expeditor/
├── ExpeditorDashboard.tsx          (extend: drag-drop integration)
├── panels/
│   ├── RailPanel.tsx               (extend: draggable tickets)
│   └── KitchenStatusPanel.tsx      (extend: drop targets, 86 Board full rendering)
├── components/
│   ├── ReassignMenu.tsx            (station picker for reassign action)
│   ├── RevertDialog.tsx            (Radix AlertDialog for revert confirmation)
│   └── DraggableTicket.tsx         (drag wrapper for TicketCard)
└── hooks/
    ├── useReassignOrder.ts         (mutation hook for reassign)
    └── useRevertOrder.ts           (mutation hook for revert)

frontend/src/components/Badge86/
├── Badge86.tsx                     (extend: board variant with time + station)
└── Badge86.test.tsx                (extend)
```

### Testing Requirements
- Backend unit tests for reassign and revert logic with all edge cases
- Backend integration tests for full event propagation
- Backend tests for inventory reversal correctness
- Frontend component tests for drag-drop, reassign menu, revert dialog
- Frontend optimistic update tests (success and failure rollback)
- Accessibility tests: keyboard navigation, focus traps, ARIA attributes, live regions
- RBAC tests: role enforcement on both endpoints
- Transaction integrity tests: revert + inventory restoration atomicity

### Dependencies
- **Requires:** Story 3.1 (Inventory Data Model) — inventory items for 86 Board
- **Requires:** Story 3.2 (Auto-Decrement) — consumption tracking for revert reversal
- **Requires:** Story 3.3 (Station Status) — station data for reassignment targets
- **Requires:** Story 3.4 (Service Tempo) — tempo recalculation after reassign/revert
- **Requires:** Story 3.5 (Expeditor Dashboard Layout) — dashboard structure for actions
- **Requires:** Story 3.6 (Attention-Driven UI) — attention states respond to reassign/revert
- **End of Epic 3** — no further stories depend on this within Epic 3

### References
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 340-353 (event flow including reassignment)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 808-811 (reassign-order.dto.ts in file structure)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 766-783 (Expeditor journey: reassign and revert flows)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 1046-1055 (Badge86 component spec — board variant)
- Epics: `_bmad-output/planning-artifacts/epics.md` lines 879-898 (Story 3.7 AC)

## Dev Agent Record

### Agent Model Used
<!-- To be filled during implementation -->

### Debug Log References
<!-- To be filled during implementation -->

### Completion Notes List
<!-- To be filled during implementation -->

### File List
<!-- To be filled during implementation -->
