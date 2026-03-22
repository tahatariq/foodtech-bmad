# Story 3.5: Expeditor Dashboard — 3-Panel Layout

Status: ready-for-dev

## Story

As an **expeditor (Adrienne)**,
I want a single-screen command center showing The Rail, Kitchen Status, and Service Tempo,
so that I can monitor all stations without scrolling or switching views.

## Acceptance Criteria (BDD)

**Given** Adrienne logs in with role `head_chef`
**When** the Expeditor Dashboard loads
**Then** a 3-panel layout displays: The Rail (all orders across all stations as compact TicketCards), Kitchen Status (all stations as StationStatusIndicator components), and Service Tempo (ServiceTempoGauge)
**And** all three panels are visible simultaneously with no scrolling required on iPad landscape or TV

**Given** the dashboard layout
**Then** it uses dark theme (KitchenTokenProvider), landscape-optimized, with ConnectionIndicator in the header
**And** there is minimal navigation — stations expand/collapse within the dashboard via tap

**Given** a StationStatusIndicator is tapped
**When** it expands
**Then** individual tickets for that station are shown inline with `aria-expanded="true"`
**And** the station can be collapsed back

**Given** the dashboard is accessed on a wall-mounted TV (1920x1080+)
**When** rendered
**Then** auto-scaling applies: larger type, increased spacing, display-only mode (no interactive elements)
**And** Kitchen TV mode activates via `?mode=tv` URL parameter or fullscreen API detection

**And** skeleton loading shows 3-panel skeleton with gray station dots while data loads
**And** empty state shows "All clear. Kitchen is idle." with Service Tempo gauge at zero

## Tasks / Subtasks

### Task 1: Create ExpeditorDashboard Page Component

- [ ] Create `ExpeditorDashboard.tsx` in `frontend/src/views/expeditor/`
- [ ] Implement 3-panel CSS Grid layout:
  - [ ] Panel 1 (left, ~40% width): The Rail — all orders across all stations
  - [ ] Panel 2 (center, ~35% width): Kitchen Status — StationStatusIndicator grid + 86 Board
  - [ ] Panel 3 (right, ~25% width): Service Tempo — ServiceTempoGauge (large variant)
- [ ] All three panels visible simultaneously with no vertical scroll on:
  - [ ] iPad Pro landscape (1366x1024)
  - [ ] Standard tablet landscape (1280x800)
  - [ ] TV (1920x1080+)
- [ ] Apply `KitchenTokenProvider` for dark theme
- [ ] Add `ConnectionIndicator` component in dashboard header
- [ ] Minimal navigation: no tabs, no sidebar, no page switching

### Task 2: Implement The Rail Panel

- [ ] Fetch all active orders across all stations via `GET /api/v1/orders?status=active`
- [ ] Render as compact `TicketCard` components (variant: `expeditor`)
  - [ ] Show order number, items, station label, elapsed time
  - [ ] Show Badge86 on any 86'd items
- [ ] Group or sort by station for visual organization
- [ ] Subscribe to `order.created`, `order.stage.changed`, `order.completed` WebSocket events
- [ ] Update TanStack Query cache on each event for real-time updates
- [ ] Scrollable within panel if orders exceed panel height (internal scroll only)

### Task 3: Implement Kitchen Status Panel

- [ ] Fetch station statuses via `GET /api/v1/kitchen-status/stations`
- [ ] Render each station as `StationStatusIndicator` component
  - [ ] Grid layout: 2-3 columns depending on station count
  - [ ] Each indicator shows status dot, name, ticket count, status text
- [ ] Implement expand/collapse interaction:
  - [ ] Tap `StationStatusIndicator` to expand inline
  - [ ] Show individual tickets for that station when expanded
  - [ ] Set `aria-expanded="true"` on expanded state
  - [ ] Tap again to collapse
- [ ] Subscribe to `kitchen.status.changed` events for real-time updates

### Task 4: Implement 86 Board Sub-Panel

- [ ] Add 86 Board section within Kitchen Status panel (or as bottom section)
- [ ] Fetch 86'd items via `GET /api/v1/inventory-items/86d`
- [ ] Render each 86'd item as `Badge86` component (variant: `board` — larger)
  - [ ] Show: item name, time since 86'd, affected station(s)
- [ ] Subscribe to `inventory.86d` and `inventory.updated` events
  - [ ] Add new Badge86 when `inventory.86d` received
  - [ ] Remove Badge86 when item restocked (`inventory.updated` with `is86d: false`)
- [ ] Empty state: "No 86'd items" or simply hide section

### Task 5: Implement Service Tempo Panel

- [ ] Render `ServiceTempoGauge` component (variant: `large`)
- [ ] Connect via `useTempo()` hook (from Story 3.4)
- [ ] Show per-station tempo breakdown below gauge if space permits
- [ ] Empty/zero state: gauge at 0.0 with "Flowing" label

### Task 6: Implement TV Mode

- [ ] Detect TV mode via:
  - [ ] URL parameter: `?mode=tv`
  - [ ] Fullscreen API detection: `document.fullscreenElement` check
  - [ ] Viewport width >= 1920px heuristic
- [ ] In TV mode:
  - [ ] Scale up typography (1.5x base size)
  - [ ] Increase spacing (1.5x padding/margins)
  - [ ] Disable all interactive elements (no tap, no expand, no buttons)
  - [ ] Auto-scroll The Rail if content overflows (slow scroll, 30px/s)
  - [ ] Hide ConnectionIndicator header or move to corner
- [ ] CSS custom properties for TV scaling: `--tv-scale: 1.5`

### Task 7: Implement Loading & Empty States

- [ ] Skeleton loading state:
  - [ ] 3-panel skeleton layout matching final structure
  - [ ] Gray animated placeholder dots for station status indicators
  - [ ] Gray animated placeholder bars for ticket cards
  - [ ] Pulsing placeholder for tempo gauge
- [ ] Empty state (no active orders):
  - [ ] "All clear. Kitchen is idle." centered message
  - [ ] ServiceTempoGauge showing 0.0 with "Flowing" label
  - [ ] Station indicators all showing green/ready
- [ ] Error state: show error message with retry button

### Task 8: Implement Route & Auth Guard

- [ ] Add `/expeditor` route in `router.tsx`
- [ ] Apply role guard: only `head_chef` and `location_manager` roles can access
- [ ] Redirect unauthorized users to their default view
- [ ] Code-split: lazy load ExpeditorDashboard (separate bundle from Station View)

### Task 9: Create useExpeditorState Hook

- [ ] Create `useExpeditorState.ts` in `frontend/src/views/expeditor/hooks/`
- [ ] Orchestrate data fetching:
  - [ ] `useOrders()` — all active orders
  - [ ] `useStationStatus()` — all station statuses
  - [ ] `useTempo()` — current tempo
  - [ ] `use86dItems()` — 86'd inventory items
- [ ] Manage UI state:
  - [ ] `expandedStationId` — which station is expanded (null = none)
  - [ ] `tvMode` — boolean for TV mode
- [ ] Return unified state object for ExpeditorDashboard component

### Task 10: Write Tests

- [ ] Component test: 3-panel layout renders all three panels
- [ ] Component test: The Rail shows all active orders with expeditor variant TicketCards
- [ ] Component test: Kitchen Status shows StationStatusIndicator for each station
- [ ] Component test: StationStatusIndicator expand/collapse works with aria-expanded
- [ ] Component test: 86 Board renders Badge86 components for 86'd items
- [ ] Component test: ServiceTempoGauge renders in large variant
- [ ] Component test: skeleton loading state renders correctly
- [ ] Component test: empty state shows "All clear. Kitchen is idle."
- [ ] Component test: TV mode applies scaling and disables interactions
- [ ] Integration test: WebSocket events update all three panels in real-time
- [ ] Accessibility test: all panels have proper ARIA landmarks
- [ ] Accessibility test: keyboard navigation between panels
- [ ] Responsive test: layout works on iPad landscape (1366x1024)
- [ ] Responsive test: layout works on TV (1920x1080)
- [ ] Route test: only head_chef/location_manager can access /expeditor

## Dev Notes

### Architecture References
- Expeditor Dashboard is a single-page view within the Restaurant SPA (frontend)
- 3-panel layout: CSS Grid, landscape-optimized, no page switching
- All data arrives via REST (initial load) + WebSocket (real-time updates)
- Frontend state: TanStack Query for server state, Zustand for UI state (expanded station, TV mode)
- Code-split via React.lazy — Expeditor Dashboard loads as separate chunk from Station View

### Technical Stack
- **Frontend:** React 19 + Vite 6.x + Tailwind CSS 4.2 + Radix UI 1.4.3
- **State:** TanStack Query 5.x + Zustand 5.x
- **Routing:** React Router 7.x (SPA mode, role-guarded routes)
- **Events:** socket.io-client via `useSocket()` hook
- **Design tokens:** KitchenTokenProvider (dark theme)
- **Testing:** Vitest + React Testing Library + axe-core

### File Structure
```
frontend/src/views/expeditor/
├── ExpeditorDashboard.tsx          (main 3-panel layout)
├── ExpeditorDashboard.test.tsx
├── panels/
│   ├── RailPanel.tsx               (The Rail — all orders)
│   ├── KitchenStatusPanel.tsx      (stations + 86 Board)
│   └── TempoPanel.tsx              (ServiceTempoGauge)
├── hooks/
│   ├── useExpeditorState.ts        (orchestrate all data + UI state)
│   ├── use86dItems.ts              (fetch + subscribe to 86'd items)
│   └── useStationStatus.ts        (fetch + subscribe to station statuses)
└── index.ts

frontend/src/components/
├── ServiceTempoGauge/              (from Story 3.4)
├── StationStatusIndicator/         (from Story 3.3)
├── Badge86/                        (board variant for 86 Board)
├── TicketCard/                     (expeditor variant — compact with station label)
└── ConnectionIndicator/            (from Epic 2)

frontend/src/router.tsx             (extend: add /expeditor route with role guard)
```

### Testing Requirements
- Component tests for all panels and layout
- Integration tests for WebSocket event propagation to all panels
- Accessibility tests: ARIA landmarks, keyboard nav, screen reader flow
- Responsive tests: iPad landscape and TV resolutions
- TV mode tests: scaling applied, interactions disabled
- Performance test: initial load < 3s, WebSocket updates < 500ms
- Route guard test: unauthorized roles redirected

### Dependencies
- **Requires:** Story 3.1 (Inventory Data Model) — 86'd items data
- **Requires:** Story 3.2 (Auto-Decrement) — Badge86 on tickets
- **Requires:** Story 3.3 (Station Status) — StationStatusIndicator component and API
- **Requires:** Story 3.4 (Service Tempo) — ServiceTempoGauge component and API
- **Requires:** Epic 2 (Station View) — TicketCard component, WebSocket infrastructure, ConnectionIndicator
- **Blocks:** Story 3.6 (Attention-Driven UI) — attention layer applied on top of this layout
- **Blocks:** Story 3.7 (Order Reassignment) — actions within this dashboard

### References
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 961-966 (expeditor view file structure)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` lines 369-386 (frontend state architecture)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 750-798 (Expeditor journey flow)
- Epics: `_bmad-output/planning-artifacts/epics.md` lines 820-848 (Story 3.5 AC)

## Dev Agent Record

### Agent Model Used
<!-- To be filled during implementation -->

### Debug Log References
<!-- To be filled during implementation -->

### Completion Notes List
<!-- To be filled during implementation -->

### File List
<!-- To be filled during implementation -->
