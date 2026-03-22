# Story 3.6: Attention-Driven UI & Bottleneck Detection

Status: ready-for-dev

## Story

As an **expeditor (Adrienne)**,
I want problems to visually glow and healthy operations to fade,
so that my eye is drawn to what needs attention without manually scanning the dashboard.

## Acceptance Criteria (BDD)

**Given** all stations are flowing normally
**When** the dashboard renders
**Then** all StationStatusIndicators display at 0.7 opacity with green status — the dashboard feels calm and quiet

**Given** one station's tickets exceed the warning threshold
**When** the station enters warning state
**Then** its StationStatusIndicator transitions to 1.0 opacity, amber background tint, slow pulse (2s) — Adrienne notices in peripheral vision within 5 seconds

**Given** a station enters critical state (tickets > 8 min or 7+ active tickets)
**When** the critical state applies
**Then** the StationStatusIndicator shows 1.0 opacity, red background tint, fast pulse (1s) — demands immediate attention

**Given** Adrienne resolves the issue (manually or via order reassignment)
**When** the station returns to healthy
**Then** a brief green flash plays (200ms), then the station fades back to 0.7 opacity — confirming resolution

**Given** the backend detects a bottleneck
**When** a station's average ticket time exceeds other stations by 2x
**Then** an alert indicator appears on that station and Service Tempo reflects the impact
**And** the `tempo.updated` event includes a `stationBreakdown` array identifying the problematic station

## Tasks / Subtasks

### Task 1: Create AttentionWrapper Component

- [ ] Create `AttentionWrapper.tsx` in `frontend/src/components/AttentionWrapper/`
- [ ] Accept `attentionLevel` prop: `'calm'` | `'watching'` | `'warning'` | `'critical'`
- [ ] Apply visual styles based on attention level:
  - [ ] `calm`: opacity 0.7, no animation, no background tint
  - [ ] `watching`: opacity 0.85, subtle border highlight
  - [ ] `warning`: opacity 1.0, amber background tint (`rgba(245, 158, 11, 0.1)`), slow pulse (2s CSS animation cycle)
  - [ ] `critical`: opacity 1.0, red background tint (`rgba(239, 68, 68, 0.15)`), fast pulse (1s CSS animation cycle), glow effect (`box-shadow`)
- [ ] Implement CSS transitions for smooth state changes (300ms ease-in-out)
- [ ] Support `prefers-reduced-motion`:
  - [ ] Disable pulse and glow animations
  - [ ] Use static border color changes (2px solid amber/red) instead
  - [ ] Maintain opacity changes (not motion-sensitive)
- [ ] Wrap any child component — generic attention container

### Task 2: Implement Resolution Flash Animation

- [ ] When attention level transitions from `warning`/`critical` → `calm`:
  - [ ] Play green flash: background `rgba(16, 185, 129, 0.3)` for 200ms
  - [ ] Then fade to 0.7 opacity over 300ms
- [ ] Use CSS `@keyframes` for flash animation
- [ ] With `prefers-reduced-motion`: skip flash, instant transition to calm
- [ ] Track previous attention level to detect resolution transitions

### Task 3: Calculate Attention Levels from Station Data

- [ ] Create `useAttentionLevel(stationData)` hook
  - [ ] Input: `{ ticketCount, maxTicketAge, status }` from station status data
  - [ ] Output: `'calm'` | `'watching'` | `'warning'` | `'critical'`
  - [ ] Logic:
    - [ ] `calm`: 0-3 tickets, all < 3 min → 0.7 opacity
    - [ ] `watching`: any ticket 3-5 min → 0.85 opacity
    - [ ] `warning`: 4-6 tickets OR any ticket 5-8 min → 1.0 opacity, amber
    - [ ] `critical`: 7+ tickets OR any ticket > 8 min → 1.0 opacity, red
- [ ] Thresholds configurable via tenant settings (default values above)
- [ ] Recalculate on every station status update

### Task 4: Apply AttentionWrapper to StationStatusIndicator

- [ ] Wrap each `StationStatusIndicator` on Expeditor Dashboard with `AttentionWrapper`
- [ ] Pass computed attention level from `useAttentionLevel()` hook
- [ ] Ensure transitions feel natural:
  - [ ] Calm → Warning: 300ms ease-in (gradual draw of attention)
  - [ ] Warning → Critical: 200ms ease-in (urgency escalation)
  - [ ] Critical → Calm: green flash (200ms) + fade (300ms)
- [ ] All stations start at 0.7 opacity on dashboard load (calm by default)

### Task 5: Apply Attention to TicketCards in Rail

- [ ] Apply attention-driven opacity to TicketCard components in The Rail panel
  - [ ] Ticket age-based attention per UX spec:
    - [ ] 0-3 min: 0.7 opacity (healthy)
    - [ ] 3-5 min: 0.85 opacity (watching)
    - [ ] 5-8 min: 1.0 opacity, amber glow (warning)
    - [ ] 8+ min: 1.0 opacity, red glow (critical)
- [ ] Create `useTicketAttention(ticketAge)` hook for per-ticket calculation
- [ ] Apply via AttentionWrapper around each TicketCard

### Task 6: Implement Bottleneck Detection

- [ ] Backend: extend TempoService to detect bottlenecks
  - [ ] On each `tempo.updated` calculation, compare per-station averages
  - [ ] If any station's avg ticket time > 2x the average of other stations, flag as bottleneck
  - [ ] Add `isBottleneck: boolean` flag to each entry in `stationBreakdown` array
  - [ ] Include `bottleneckStationIds: string[]` in `tempo.updated` event payload
- [ ] Frontend: consume bottleneck data from `tempo.updated` event
  - [ ] Show alert indicator (warning icon) on bottleneck station's StationStatusIndicator
  - [ ] Override attention level to at least `warning` for bottleneck stations
  - [ ] ServiceTempoGauge reflects bottleneck: show "Bottleneck: [station name]" label

### Task 7: Write Tests

- [ ] Component test: AttentionWrapper renders correct opacity for each level
  - [ ] calm: opacity 0.7
  - [ ] watching: opacity 0.85
  - [ ] warning: opacity 1.0, amber tint
  - [ ] critical: opacity 1.0, red tint
- [ ] Component test: resolution flash plays on transition to calm
- [ ] Component test: `prefers-reduced-motion` disables animations
- [ ] Hook test: `useAttentionLevel` returns correct level for threshold inputs
  - [ ] 2 tickets, 2 min max → calm
  - [ ] 3 tickets, 4 min max → watching
  - [ ] 5 tickets, 6 min max → warning
  - [ ] 8 tickets, 9 min max → critical
- [ ] Hook test: `useTicketAttention` returns correct level for ticket ages
- [ ] Integration test: station status change updates attention level on dashboard
- [ ] Integration test: resolution (critical → calm) triggers green flash
- [ ] Backend test: bottleneck detection flags station with 2x avg time
- [ ] Backend test: `tempo.updated` includes bottleneck station IDs
- [ ] Accessibility test: attention changes announced via ARIA live region
- [ ] Accessibility test: reduced motion disables all CSS animations
- [ ] Visual regression test: screenshot comparison for each attention state

## Dev Notes

### Architecture References
- Attention-driven UI is an architectural principle: component visual state (opacity, pulse, glow) driven by data freshness and thresholds
- Requires reactive state layer: attention levels computed from raw station/ticket data in hooks
- AttentionWrapper is a generic container — can wrap any component, not just StationStatusIndicator
- Bottleneck detection runs in TempoService on backend, results propagated via `tempo.updated` event

### Technical Stack
- **Frontend:** React 19 + Tailwind CSS 4.2 + CSS custom properties + CSS animations
- **State:** Zustand uiStore for attention state, TanStack Query for station data
- **Animations:** CSS `@keyframes` for pulse/glow, CSS transitions for opacity, `prefers-reduced-motion` media query
- **Backend:** TempoService bottleneck detection logic
- **Testing:** Vitest + React Testing Library + axe-core

### File Structure
```
frontend/src/components/AttentionWrapper/
├── AttentionWrapper.tsx            (generic attention container)
├── AttentionWrapper.test.tsx
├── attention-animations.css        (pulse, glow, flash keyframes)
└── index.ts

frontend/src/hooks/
├── useAttentionLevel.ts            (compute attention from station data)
└── useTicketAttention.ts           (compute attention from ticket age)

frontend/src/views/expeditor/
├── ExpeditorDashboard.tsx          (extend: wrap stations + tickets with AttentionWrapper)
└── panels/
    ├── KitchenStatusPanel.tsx      (extend: attention wrappers on stations)
    └── RailPanel.tsx               (extend: attention wrappers on tickets)

backend/src/modules/tempo/
├── tempo.service.ts                (extend: bottleneck detection logic)
└── tempo.service.test.ts           (extend: bottleneck tests)
```

### Testing Requirements
- Component tests for AttentionWrapper at all 4 attention levels
- Animation tests: verify CSS class application for pulse/glow/flash
- Reduced-motion tests: verify no animations, static alternatives applied
- Hook tests for attention level calculation with edge cases
- Backend bottleneck detection tests
- Integration test: full flow from station status change → attention update
- Visual regression tests for each attention state
- ARIA live region test: attention changes announced to screen readers

### Dependencies
- **Requires:** Story 3.3 (Station Status) — station status data drives attention levels
- **Requires:** Story 3.4 (Service Tempo) — tempo data and `stationBreakdown` for bottleneck detection
- **Requires:** Story 3.5 (Expeditor Dashboard Layout) — dashboard structure to wrap with attention
- **Blocks:** Story 3.7 (Order Reassignment) — reassignment resolves attention states

### References
- Architecture: `_bmad-output/planning-artifacts/architecture.md` line 82 (attention-driven UI as architectural decision)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 786-798 (attention-driven UI timing table)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 1043 (StationStatusIndicator states)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 1009 (TicketCard attention states)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 950-953 (AttentionWrapper component in file structure)
- Epics: `_bmad-output/planning-artifacts/epics.md` lines 850-877 (Story 3.6 AC)

## Dev Agent Record

### Agent Model Used
<!-- To be filled during implementation -->

### Debug Log References
<!-- To be filled during implementation -->

### Completion Notes List
<!-- To be filled during implementation -->

### File List
<!-- To be filled during implementation -->
