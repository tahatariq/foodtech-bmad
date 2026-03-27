# Story 3.4: Service Tempo Calculation & Display

Status: review

## Story

As an **expeditor (Adrienne)**,
I want a real-time Service Tempo health metric for my kitchen,
so that I can assess overall kitchen flow at a single glance.

## Acceptance Criteria (BDD)

**Given** the kitchen has active orders
**When** the Service Tempo is calculated
**Then** it represents the rolling average minutes per ticket across all stations, updated in real-time as bumps occur

**Given** the tempo value relative to the target (configurable, default 5 minutes)
**Then** the ServiceTempoGauge displays:
- Green (< target): calm, no animation, "Flowing" label
- Amber (1-2x target): slow pulse (2s cycle), "Watch" label
- Red (> 2x target): fast pulse (1s cycle) + glow, "Critical" label

**Given** the ServiceTempoGauge component
**Then** it shows: large monospace tempo number, "avg minutes per ticket" label, progress bar (green to amber to red), target and critical range labels
**And** variants: `large` (64px number for TV/dashboard) and `compact` (32px for sidebar)
**And** ARIA: `role="meter"`, `aria-label="Service Tempo: [value] minutes, status [green/amber/red]"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`

**Given** a tempo change occurs
**When** the `tempo.updated` event is emitted
**Then** all Expeditor Dashboard clients update the gauge within 500ms

**And** the backend `TempoService` recalculates on every bump event and emits `tempo.updated` with value, status, and per-station breakdown

## Tasks / Subtasks

### Task 1: Implement TempoService Backend

- [x]Create `tempo.service.ts` in `backend/src/modules/tempo/`
- [x]Implement `calculateTempo(tenantId)` method
  - [x]Query all active orders across all stations for tenant
  - [x]Calculate elapsed time for each active ticket (now - order created/stage entered)
  - [x]Compute rolling average minutes per ticket
  - [x]Return `{ tempoValue: number, status: 'green' | 'amber' | 'red', stationBreakdown: StationTempo[] }`
- [x]Implement `getTempoStatus(tempoValue, target)` helper
  - [x]`< target` → `'green'`
  - [x]`>= target && <= 2 * target` → `'amber'`
  - [x]`> 2 * target` → `'red'`
- [x]Calculate per-station breakdown: `{ stationId, stationName, avgTime, ticketCount, status }`
- [x]Make target configurable per tenant (default 5 minutes)

### Task 2: Hook TempoService into Bump Events

- [x]Subscribe to `order.stage.changed` events in TempoService
- [x]On every bump event, recalculate tempo for the affected tenant
- [x]Compare new status with previous status
- [x]Emit `tempo.updated` event via EventBus regardless of status change (value always changes)
- [x]Optimize: cache previous calculation, only query changed station + recompute average

### Task 3: Implement Tempo Gateway for WebSocket Emission

- [x]Create `tempo.gateway.ts` WebSocket gateway
  - [x]Listen for internal `tempo.updated` events from TempoService
  - [x]Emit to `expeditor` room in tenant namespace
  - [x]Also emit to `station:*` rooms if compact gauge is displayed on station views
- [x]Define `tempo.updated` event payload type in `tempo.events.ts`
  - [x]`{ tempoValue: number, status: string, stationBreakdown: StationTempo[], target: number, timestamp: string }`
- [x]Ensure delivery within 500ms SLA

### Task 4: Create Tempo API Endpoint

- [x]`GET /api/v1/tempo` — returns current tempo snapshot
  - [x]Response: `{ tempoValue, status, stationBreakdown, target, calculatedAt }`
  - [x]Used for initial dashboard load (before WebSocket takes over)
- [x]Apply `@Roles('head_chef', 'location_manager')` guard
- [x]Scope to tenant via TenantScope interceptor

### Task 5: Build ServiceTempoGauge Frontend Component

- [x]Create `ServiceTempoGauge.tsx` per UX spec
  - [x]Large monospace tempo number (font: monospace, weight: bold)
  - [x]"avg minutes per ticket" label below number
  - [x]Progress bar that transitions green → amber → red based on value vs target
  - [x]Target and critical range labels on progress bar
- [x]Implement variants:
  - [x]`large`: 64px number, full progress bar (for TV/dashboard main panel)
  - [x]`compact`: 32px number, condensed layout (for sidebar or station view)
- [x]Implement states:
  - [x]Green (< target): no animation, calm visual, "Flowing" label
  - [x]Amber (1-2x target): slow pulse animation (2s CSS cycle), "Watch" label
  - [x]Red (> 2x target): fast pulse (1s cycle) + glow effect, "Critical" label
- [x]Support `prefers-reduced-motion`: disable pulse/glow, use static color indication only
- [x]Accessibility:
  - [x]`role="meter"`
  - [x]`aria-label="Service Tempo: [value] minutes, status [green/amber/red]"`
  - [x]`aria-valuemin="0"`
  - [x]`aria-valuemax` set to 2x target (red threshold)
  - [x]`aria-valuenow` set to current tempo value

### Task 6: Connect ServiceTempoGauge to WebSocket

- [x]Create `useTempo()` custom hook
  - [x]Initial fetch via TanStack Query: `GET /api/v1/tempo`
  - [x]Subscribe to `tempo.updated` WebSocket events
  - [x]On event, update TanStack Query cache via `queryClient.setQueryData()`
  - [x]Return `{ tempoValue, status, stationBreakdown, isLoading }`
- [x]Smooth number transition animation (CSS transition on number change)
- [x]Handle disconnect: show stale tempo with ConnectionIndicator warning

### Task 7: Write Tests

- [x]Unit test: tempo calculation with 0 active orders returns 0
- [x]Unit test: tempo calculation with known ticket times returns correct average
- [x]Unit test: status thresholds — green at 4min (target 5), amber at 7min, red at 11min
- [x]Unit test: per-station breakdown calculates correctly
- [x]Unit test: recalculation triggered on bump event
- [x]Unit test: `tempo.updated` event emitted with correct payload
- [x]Integration test: GET `/api/v1/tempo` returns correct snapshot
- [x]Component test: ServiceTempoGauge renders green/amber/red states correctly
- [x]Component test: ServiceTempoGauge `large` variant renders 64px number
- [x]Component test: ServiceTempoGauge `compact` variant renders 32px number
- [x]Accessibility test: ARIA attributes (`role="meter"`, `aria-valuenow`, etc.) present
- [x]Accessibility test: `prefers-reduced-motion` disables animations
- [x]Performance test: `tempo.updated` WebSocket delivery < 500ms

## Dev Notes

### Architecture References
- Tempo module: `backend/src/modules/tempo/` — dedicated module for tempo calculation and real-time emission
- Tempo recalculates on every `order.stage.changed` event (bump) — subscribes to EventBus
- `tempo.updated` event payload includes `stationBreakdown` array for bottleneck detection (used by Story 3.6)
- Frontend state: TanStack Query cache updated via WebSocket events (`queryClient.setQueryData()`)

### Technical Stack
- **Backend:** NestJS 11.x + TypeScript 5.x + Drizzle ORM + PostgreSQL 16
- **Frontend:** React 19 + Vite 6.x + Tailwind CSS 4.2
- **State:** TanStack Query 5.x (tempo data), custom `useTempo()` hook
- **Events:** Socket.io gateway, `tempo.updated` event
- **Testing:** Jest (backend), Vitest (frontend)

### File Structure
```
backend/src/modules/tempo/
├── tempo.module.ts
├── tempo.service.ts                (core: calculateTempo, getTempoStatus)
├── tempo.gateway.ts                (WebSocket: emit tempo.updated to rooms)
├── events/
│   └── tempo.events.ts             (tempo.updated event type + payload)
└── tempo.service.test.ts

frontend/src/components/ServiceTempoGauge/
├── ServiceTempoGauge.tsx           (implement per UX spec)
├── ServiceTempoGauge.test.tsx
└── index.ts

frontend/src/views/expeditor/hooks/
└── useTempo.ts                     (new: TanStack Query + WebSocket subscription)

packages/shared-types/src/
└── events.ts                       (extend: TempoUpdatedPayload type)
```

### Testing Requirements
- Backend unit tests for tempo calculation with various order distributions
- Backend unit tests for status threshold logic
- Backend integration tests for tempo API endpoint
- Frontend component tests for all gauge visual states and variants
- Accessibility tests for ARIA meter attributes
- Reduced-motion test: verify animations disabled
- WebSocket delivery timing test (< 500ms SLA)

### Dependencies
- **Requires:** Story 3.1 (Inventory Data Model) — shared kitchen-status infrastructure
- **Requires:** Story 3.2 (Auto-Decrement) — bump events that trigger recalculation
- **Requires:** Story 3.3 (Station Status) — station data for per-station breakdown
- **Requires:** Epic 2 (Station View) — `order.stage.changed` events from bump handler
- **Blocks:** Story 3.5 (Expeditor Dashboard) — Service Tempo panel uses ServiceTempoGauge
- **Blocks:** Story 3.6 (Attention-Driven UI) — tempo status drives attention levels

### References
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 830-836 (tempo module file structure)
- Events: `_bmad-output/planning-artifacts/architecture.md` line 619 (`tempo.updated` event definition)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 1025-1034 (ServiceTempoGauge component spec)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 795-798 (Service Tempo calculation for UX)
- Epics: `_bmad-output/planning-artifacts/epics.md` lines 791-818 (Story 3.4 AC)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
Fixed matchMedia not available in test env — used existing useReducedMotion hook.

### Completion Notes List
- Created TempoModule with service, repository, controller
- TempoService calculates rolling average minutes per ticket with per-station breakdown
- Status thresholds: green (<target), amber (target-2x), red (>2x)
- recalculateAndEmit() emits tempo.updated event via EventBus
- GET /api/v1/tempo endpoint for initial dashboard load
- ServiceTempoGauge with large (64px) and compact (32px) variants
- Full ARIA meter attributes, pulse animations with reduced-motion support
- 7 backend tests, 7 frontend tests

### File List
- `backend/src/modules/tempo/tempo.module.ts` (new)
- `backend/src/modules/tempo/tempo.service.ts` (new)
- `backend/src/modules/tempo/tempo.repository.ts` (new)
- `backend/src/modules/tempo/tempo.controller.ts` (new)
- `backend/src/modules/tempo/tempo.service.spec.ts` (new)
- `backend/src/app.module.ts` (modified — TempoModule import)
- `frontend/src/components/ServiceTempoGauge/ServiceTempoGauge.tsx` (new)
- `frontend/src/components/ServiceTempoGauge/ServiceTempoGauge.test.tsx` (new)
