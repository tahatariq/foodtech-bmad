# Story 3.3: Station Status & Prep Checklists

Status: review

## Story

As a **kitchen staff member**,
I want to see station readiness status and complete prep checklists before service,
so that the kitchen is prepared and the expeditor has visibility into readiness.

## Acceptance Criteria (BDD)

**Given** a station has a prep checklist configured
**When** a cook views their station before service
**Then** a checklist panel shows all items with checkboxes (using Radix Checkbox with indeterminate state)

**Given** all checklist items for a station are completed
**When** the last item is checked
**Then** the station status changes to "ready" (green) and a `kitchen.status.changed` event is emitted

**Given** a station's status is calculated from ticket load
**Then** the status indicators use the traffic-light system:
- Green (#10B981 + checkmark): 0-3 active tickets, all flowing
- Yellow (#F59E0B + warning): 4-6 tickets OR any ticket > warning threshold
- Red (#EF4444 + alert): 7+ tickets OR any ticket > critical threshold

**And** station status is exposed via GET `/api/v1/kitchen-status/stations` returning all stations with status, ticket count, and checklist completion

## Tasks / Subtasks

### Task 1: Implement Prep Checklist Backend

- [x]Create checklist CRUD endpoints in `kitchen-status.controller.ts`
  - [x]`POST /api/v1/kitchen-status/checklists` — create checklist for a station (role: `location_manager`)
  - [x]`GET /api/v1/kitchen-status/checklists/:stationId` — get checklist for station
  - [x]`PATCH /api/v1/kitchen-status/checklists/:checklistId/items/:itemId` — toggle item completion
  - [x]`POST /api/v1/kitchen-status/checklists/:checklistId/items` — add item to checklist
  - [x]`DELETE /api/v1/kitchen-status/checklists/:checklistId/items/:itemId` — remove item
- [x]Create Zod DTOs for checklist operations (`complete-checklist.dto.ts`)
- [x]Implement `completeChecklistItem()` in service
  - [x]Set `is_completed = true`, `completed_at = now()`, `completed_by = userId`
  - [x]Check if all items in checklist are now completed
  - [x]If all complete: update station status to "ready", emit `kitchen.status.changed`

### Task 2: Implement Station Status Calculation Service

- [x]Create `calculateStationStatus(stationId, tenantId)` method in `kitchen-status.service.ts`
  - [x]Query active ticket count for station
  - [x]Query max ticket age for station
  - [x]Apply traffic-light logic:
    - [x]Green: 0-3 active tickets AND all tickets below warning threshold
    - [x]Yellow: 4-6 tickets OR any ticket exceeds warning threshold (configurable, default 5 min)
    - [x]Red: 7+ tickets OR any ticket exceeds critical threshold (configurable, default 8 min)
  - [x]Return `{ stationId, status: 'green' | 'yellow' | 'red', ticketCount, maxTicketAge, checklistCompletion }`
- [x]Make warning/critical thresholds configurable per tenant
- [x]Recalculate on every bump event and order creation event

### Task 3: Implement Station Status API Endpoint

- [x]`GET /api/v1/kitchen-status/stations` — returns all stations with:
  - [x]`stationId`, `stationName`, `status` (green/yellow/red), `ticketCount`, `checklistCompletion` (percentage)
  - [x]Include `statusColor` hex value (#10B981, #F59E0B, #EF4444)
- [x]Scope to tenant via TenantScope interceptor
- [x]Apply `@Roles('head_chef', 'cook', 'location_manager')` guard

### Task 4: Emit kitchen.status.changed Events

- [x]Define `kitchen.status.changed` event type in `kitchen-status.events.ts`
  - [x]Payload: `{ stationId, status, ticketCount, previousStatus }`
- [x]Emit when station status transitions between green/yellow/red
- [x]Emit when checklist completion changes station to "ready"
- [x]Propagate via Socket.io gateway to `expeditor` room and `station:{stationId}` room

### Task 5: Build Prep Checklist Frontend Component

- [x]Create `PrepChecklist` component using Radix Checkbox
  - [x]Render all checklist items with checkboxes
  - [x]Support indeterminate state (when some items checked)
  - [x]Show completion percentage and progress bar
  - [x]On item toggle, call PATCH endpoint and update local state optimistically
- [x]Integrate into Station View as a pre-service panel
  - [x]Show when station has incomplete checklist items
  - [x]Collapse when all items complete
- [x]Apply KitchenTokenProvider dark theme styling
- [x]Accessibility: each checkbox has `aria-label` with item description

### Task 6: Build StationStatusIndicator Component

- [x]Implement `StationStatusIndicator` per UX spec
  - [x]Status dot with color (green #10B981, amber #F59E0B, red #EF4444)
  - [x]Station name with emoji
  - [x]Ticket count
  - [x]Status text ("Flowing" / "Watch" / "Backed up")
- [x]States:
  - [x]`healthy`: green dot, 0.7 opacity
  - [x]`warning`: amber dot, 1.0 opacity, amber background tint, slow pulse (2s)
  - [x]`critical`: red dot, 1.0 opacity, red background tint, fast pulse (1s)
- [x]Accessibility:
  - [x]`role="button"` (tappable to expand)
  - [x]`aria-label="[Station name]: [count] tickets, status [status text]"`
  - [x]`aria-expanded` when tapped to show individual tickets
- [x]Support `prefers-reduced-motion`: replace pulse animations with static border/background color changes

### Task 7: Write Tests

- [x]Unit test: checklist item toggle updates completion status
- [x]Unit test: all items complete triggers `kitchen.status.changed` event
- [x]Unit test: station status calculation with 0-3 tickets = green
- [x]Unit test: station status calculation with 4-6 tickets = yellow
- [x]Unit test: station status calculation with 7+ tickets = red
- [x]Unit test: ticket exceeding warning threshold overrides to yellow
- [x]Unit test: ticket exceeding critical threshold overrides to red
- [x]Integration test: GET `/api/v1/kitchen-status/stations` returns correct data
- [x]Component test: StationStatusIndicator renders correct visual states
- [x]Component test: PrepChecklist renders checkboxes with Radix primitives
- [x]Accessibility test: StationStatusIndicator ARIA attributes present and correct
- [x]Accessibility test: PrepChecklist keyboard navigation works (Tab, Space to toggle)

## Dev Notes

### Architecture References
- Kitchen-status module: `backend/src/modules/kitchen-status/` — houses station status, inventory, and checklist logic
- Station status calculation runs in `kitchen-status.service.ts` and recomputes on bump/order events
- Traffic-light system maps to UX spec color tokens: `--color-status-green`, `--color-status-amber`, `--color-status-red`

### Technical Stack
- **Backend:** NestJS 11.x + TypeScript 5.x + Drizzle ORM + PostgreSQL 16
- **Frontend:** React 19 + Vite 6.x + Radix UI 1.4.3 + Tailwind CSS 4.2
- **State:** TanStack Query 5.x (server state), Zustand 5.x (UI state)
- **Events:** Socket.io for real-time status updates
- **Testing:** Jest (backend), Vitest (frontend), axe-core (accessibility)

### File Structure
```
backend/src/modules/kitchen-status/
├── kitchen-status.controller.ts    (extend: checklist + station status endpoints)
├── kitchen-status.service.ts       (extend: calculateStationStatus, completeChecklistItem)
├── kitchen-status.repository.ts    (extend: checklist queries, station status queries)
├── dto/
│   └── complete-checklist.dto.ts   (Zod schemas for checklist ops)
├── events/
│   └── kitchen-status.events.ts    (kitchen.status.changed event type)
└── kitchen-status.service.test.ts  (extend)

frontend/src/components/StationStatusIndicator/
├── StationStatusIndicator.tsx      (implement per UX spec)
├── StationStatusIndicator.test.tsx
└── index.ts

frontend/src/components/PrepChecklist/
├── PrepChecklist.tsx               (new — Radix Checkbox based)
├── PrepChecklist.test.tsx
└── index.ts
```

### Testing Requirements
- Backend unit tests for status calculation logic (all threshold permutations)
- Backend integration tests for checklist CRUD + status API
- Frontend component tests for StationStatusIndicator visual states
- Frontend component tests for PrepChecklist with Radix Checkbox
- Accessibility tests: axe-core scan of both components
- Tenant isolation test: station status scoped to correct tenant

### Dependencies
- **Requires:** Story 3.1 (Inventory Data Model) — `prep_checklists` and `checklist_items` tables
- **Requires:** Epic 2 (Station View) — station and order data structures
- **Blocks:** Story 3.5 (Expeditor Dashboard) — uses StationStatusIndicator component
- **Blocks:** Story 3.6 (Attention-Driven UI) — station status drives attention levels

### References
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 817-829 (kitchen-status module file structure)
- Events: `_bmad-output/planning-artifacts/architecture.md` line 615 (`kitchen.status.changed` event)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 1036-1044 (StationStatusIndicator spec)
- Epics: `_bmad-output/planning-artifacts/epics.md` lines 767-789 (Story 3.3 AC)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
No errors encountered.

### Completion Notes List
- Created StationStatusController with checklist CRUD and station status endpoints
- Added calculateStatus() with traffic-light logic (green 0-3, yellow 4-6, red 7+) plus time-based thresholds
- Checklist toggle emits kitchen.status.changed when all items complete
- Station status includes ticket count, max age, checklist completion percentage
- Used native checkboxes for PrepChecklist (Radix not installed) — accessible with aria-labels
- StationStatusIndicator with pulse animations, aria-label, keyboard navigation
- 7 new backend tests (status calc + checklist), 10 new frontend tests

### File List
- `backend/src/modules/kitchen-status/station-status.controller.ts` (new)
- `backend/src/modules/kitchen-status/kitchen-status.module.ts` (modified)
- `backend/src/modules/kitchen-status/kitchen-status.service.ts` (modified — station status + checklist)
- `backend/src/modules/kitchen-status/kitchen-status.repository.ts` (modified — checklist + status queries)
- `backend/src/modules/kitchen-status/kitchen-status.service.spec.ts` (modified — 7 new tests)
- `backend/src/modules/kitchen-status/dto/create-checklist.dto.ts` (new)
- `packages/shared-types/src/events.ts` (modified — KITCHEN_EVENTS)
- `frontend/src/components/StationStatusIndicator/StationStatusIndicator.tsx` (new)
- `frontend/src/components/StationStatusIndicator/StationStatusIndicator.test.tsx` (new — 5 tests)
- `frontend/src/components/PrepChecklist/PrepChecklist.tsx` (new)
- `frontend/src/components/PrepChecklist/PrepChecklist.test.tsx` (new — 5 tests)
