# Story 3.4: Service Tempo Calculation & Display

Status: ready-for-dev

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

- [ ] Create `tempo.service.ts` in `backend/src/modules/tempo/`
- [ ] Implement `calculateTempo(tenantId)` method
  - [ ] Query all active orders across all stations for tenant
  - [ ] Calculate elapsed time for each active ticket (now - order created/stage entered)
  - [ ] Compute rolling average minutes per ticket
  - [ ] Return `{ tempoValue: number, status: 'green' | 'amber' | 'red', stationBreakdown: StationTempo[] }`
- [ ] Implement `getTempoStatus(tempoValue, target)` helper
  - [ ] `< target` → `'green'`
  - [ ] `>= target && <= 2 * target` → `'amber'`
  - [ ] `> 2 * target` → `'red'`
- [ ] Calculate per-station breakdown: `{ stationId, stationName, avgTime, ticketCount, status }`
- [ ] Make target configurable per tenant (default 5 minutes)

### Task 2: Hook TempoService into Bump Events

- [ ] Subscribe to `order.stage.changed` events in TempoService
- [ ] On every bump event, recalculate tempo for the affected tenant
- [ ] Compare new status with previous status
- [ ] Emit `tempo.updated` event via EventBus regardless of status change (value always changes)
- [ ] Optimize: cache previous calculation, only query changed station + recompute average

### Task 3: Implement Tempo Gateway for WebSocket Emission

- [ ] Create `tempo.gateway.ts` WebSocket gateway
  - [ ] Listen for internal `tempo.updated` events from TempoService
  - [ ] Emit to `expeditor` room in tenant namespace
  - [ ] Also emit to `station:*` rooms if compact gauge is displayed on station views
- [ ] Define `tempo.updated` event payload type in `tempo.events.ts`
  - [ ] `{ tempoValue: number, status: string, stationBreakdown: StationTempo[], target: number, timestamp: string }`
- [ ] Ensure delivery within 500ms SLA

### Task 4: Create Tempo API Endpoint

- [ ] `GET /api/v1/tempo` — returns current tempo snapshot
  - [ ] Response: `{ tempoValue, status, stationBreakdown, target, calculatedAt }`
  - [ ] Used for initial dashboard load (before WebSocket takes over)
- [ ] Apply `@Roles('head_chef', 'location_manager')` guard
- [ ] Scope to tenant via TenantScope interceptor

### Task 5: Build ServiceTempoGauge Frontend Component

- [ ] Create `ServiceTempoGauge.tsx` per UX spec
  - [ ] Large monospace tempo number (font: monospace, weight: bold)
  - [ ] "avg minutes per ticket" label below number
  - [ ] Progress bar that transitions green → amber → red based on value vs target
  - [ ] Target and critical range labels on progress bar
- [ ] Implement variants:
  - [ ] `large`: 64px number, full progress bar (for TV/dashboard main panel)
  - [ ] `compact`: 32px number, condensed layout (for sidebar or station view)
- [ ] Implement states:
  - [ ] Green (< target): no animation, calm visual, "Flowing" label
  - [ ] Amber (1-2x target): slow pulse animation (2s CSS cycle), "Watch" label
  - [ ] Red (> 2x target): fast pulse (1s cycle) + glow effect, "Critical" label
- [ ] Support `prefers-reduced-motion`: disable pulse/glow, use static color indication only
- [ ] Accessibility:
  - [ ] `role="meter"`
  - [ ] `aria-label="Service Tempo: [value] minutes, status [green/amber/red]"`
  - [ ] `aria-valuemin="0"`
  - [ ] `aria-valuemax` set to 2x target (red threshold)
  - [ ] `aria-valuenow` set to current tempo value

### Task 6: Connect ServiceTempoGauge to WebSocket

- [ ] Create `useTempo()` custom hook
  - [ ] Initial fetch via TanStack Query: `GET /api/v1/tempo`
  - [ ] Subscribe to `tempo.updated` WebSocket events
  - [ ] On event, update TanStack Query cache via `queryClient.setQueryData()`
  - [ ] Return `{ tempoValue, status, stationBreakdown, isLoading }`
- [ ] Smooth number transition animation (CSS transition on number change)
- [ ] Handle disconnect: show stale tempo with ConnectionIndicator warning

### Task 7: Write Tests

- [ ] Unit test: tempo calculation with 0 active orders returns 0
- [ ] Unit test: tempo calculation with known ticket times returns correct average
- [ ] Unit test: status thresholds — green at 4min (target 5), amber at 7min, red at 11min
- [ ] Unit test: per-station breakdown calculates correctly
- [ ] Unit test: recalculation triggered on bump event
- [ ] Unit test: `tempo.updated` event emitted with correct payload
- [ ] Integration test: GET `/api/v1/tempo` returns correct snapshot
- [ ] Component test: ServiceTempoGauge renders green/amber/red states correctly
- [ ] Component test: ServiceTempoGauge `large` variant renders 64px number
- [ ] Component test: ServiceTempoGauge `compact` variant renders 32px number
- [ ] Accessibility test: ARIA attributes (`role="meter"`, `aria-valuenow`, etc.) present
- [ ] Accessibility test: `prefers-reduced-motion` disables animations
- [ ] Performance test: `tempo.updated` WebSocket delivery < 500ms

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
<!-- To be filled during implementation -->

### Debug Log References
<!-- To be filled during implementation -->

### Completion Notes List
<!-- To be filled during implementation -->

### File List
<!-- To be filled during implementation -->
