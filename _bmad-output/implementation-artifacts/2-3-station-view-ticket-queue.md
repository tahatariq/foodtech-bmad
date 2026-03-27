# Story 2.3: Station View — Ticket Queue & Display

Status: review

## Story

As a **line cook (Marco)**,
I want to see only my station's orders displayed as ticket cards sorted by urgency,
So that I always know what to cook next without searching.

## Acceptance Criteria (BDD)

**Given** Marco logs in with role `line_cook` assigned to the "Grill" station
**When** the Station View loads
**Then** only orders with items assigned to "Grill" are displayed as TicketCard components in a single-column stack

**Given** tickets are displayed
**When** they are sorted
**Then** they are ordered by urgency (time in current stage, oldest first), with the most urgent ticket at the top

**Given** each TicketCard renders
**Then** it shows: order number (monospace, large), item list with quantities, elapsed time in current stage, and station label
**And** cards use the attention-driven system: healthy (0.7 opacity), watching (0.85), warning (amber glow, 2s pulse at 5+ min), critical (red glow, 1s pulse at 8+ min)

**Given** the Station View layout
**Then** it uses dark theme (KitchenTokenProvider), single column, portrait-optimized for 7"-10" tablet, with ConnectionIndicator visible
**And** there is zero navigation UI — only a station selector dropdown as UI chrome
**And** the view meets WCAG 2.1 AA with 56dp+ touch targets, high contrast, and triple-encoded status indicators

**Given** no tickets exist for the station
**When** the view loads
**Then** an empty state displays: "No tickets right now. Orders will appear here automatically."

**And** skeleton loading shows 3 ticket card placeholders while data loads

## Tasks / Subtasks

### Task 1: Create StationView page component (AC 1, AC 4, AC 5, AC 6)
- [x] Create `frontend/src/views/StationView/StationView.tsx` as the main page component
- [x] Wrap entire view in `KitchenTokenProvider` for dark theme design tokens
- [x] Layout: single-column, portrait-optimized, full viewport height, dark background (`--kitchen-bg`)
- [x] Include `ConnectionIndicator` component fixed at top-right of view
- [x] Include station selector dropdown as the only UI chrome element (top of view)
- [x] Implement empty state: render "No tickets right now. Orders will appear here automatically." centered message when no tickets for station
- [x] Implement loading state: render 3 skeleton `TicketCard` placeholders while data fetches (animated shimmer)
- [x] Ensure no horizontal scrollbar — vertical-only scroll for ticket list
- [x] Create `frontend/src/views/StationView/index.ts` barrel re-export

### Task 2: Implement `useStationOrders` hook with TanStack Query (AC 1, AC 2)
- [x] Create `frontend/src/views/StationView/hooks/useStationOrders.ts`
- [x] Fetch orders via TanStack Query: `GET /api/v1/orders?stationId={stationId}`
- [x] Read `stationId` from Zustand `authStore` (user's assigned station)
- [x] Sort orders by urgency: compute elapsed time in current stage, oldest first (most urgent at top)
- [x] Return typed array of station-filtered orders with `isLoading`, `isError`, `data` states
- [x] Compute `elapsedMs` per ticket from stage entry timestamp for downstream use by AttentionWrapper

### Task 3: Create TicketCard component (AC 3)
- [x] Create `frontend/src/components/kitchen/TicketCard/TicketCard.tsx`
- [x] Display order number in monospace, large font (24px+, `font-variant-numeric: tabular-nums`)
- [x] Display item list with quantities (e.g., "2x Ribeye Steak")
- [x] Display elapsed time in current stage (human-readable: "2m", "5m 30s") — update every second via `useInterval`
- [x] Display station label badge
- [x] Accept `variant` prop: `"station"` (large, full bump button) vs `"expeditor"` (compact) vs `"rail"` (mini)
- [x] Set `role="article"` and `aria-label="Order [number], [status], [time] elapsed"`
- [x] Create `frontend/src/components/kitchen/TicketCard/index.ts` barrel re-export
- [x] Create `frontend/src/components/kitchen/TicketCard/TicketCard.test.tsx`

### Task 4: Create AttentionWrapper HOC (AC 3)
- [x] Create `frontend/src/components/kitchen/AttentionWrapper/AttentionWrapper.tsx`
- [x] Accept `attentionLevel` prop: `'healthy' | 'watching' | 'warning' | 'critical' | 'resolved'`
- [x] Apply visual states:
  - `healthy`: opacity 0.7, scale 1.0, no animation
  - `watching`: opacity 0.85, no animation
  - `warning`: opacity 1.0, scale 1.02, amber glow (`box-shadow: 0 0 12px rgba(245, 158, 11, 0.6)`), 2s CSS pulse animation
  - `critical`: opacity 1.0, scale 1.05, red glow (`box-shadow: 0 0 16px rgba(239, 68, 68, 0.7)`), 1s CSS pulse animation
  - `resolved`: brief green flash (0.3s), transition to healthy
- [x] Add `aria-live="assertive"` when transitioning to critical, `aria-live="polite"` for warning
- [x] Respect `prefers-reduced-motion`: disable pulse/glow animations, communicate via border/background color only
- [x] Create `frontend/src/components/kitchen/AttentionWrapper/index.ts` barrel re-export
- [x] Create `frontend/src/components/kitchen/AttentionWrapper/AttentionWrapper.test.tsx`

### Task 5: Create `useAttention` hook for threshold calculation (AC 3)
- [x] Create `frontend/src/hooks/useAttention.ts`
- [x] Accept `elapsedMs: number` parameter
- [x] Return computed `attentionLevel` based on time in current stage:
  - 0–3 min → `healthy`
  - 3–5 min → `watching`
  - 5–8 min → `warning`
  - 8+ min → `critical`
- [x] Make thresholds configurable via optional props (for different stage types)
- [x] Unit test: `frontend/src/hooks/useAttention.test.ts`

### Task 6: Create ConnectionIndicator component (AC 4)
- [x] Create `frontend/src/components/kitchen/ConnectionIndicator/ConnectionIndicator.tsx`
- [x] Display small colored dot (8px) + text:
  - `connected`: green dot (#22C55E), text "Connected" (or hide text to save space)
  - `reconnecting`: amber dot (#F59E0B), pulsing animation, "Reconnecting..." text
  - `offline`: red dot (#EF4444), "Offline — bumps will sync" text
- [x] Set `role="status"` and `aria-live="polite"` for screen reader announcements
- [x] Consume connection state from `useSocket()` hook or SocketContext
- [x] Create `frontend/src/components/kitchen/ConnectionIndicator/index.ts` barrel re-export
- [x] Create `frontend/src/components/kitchen/ConnectionIndicator/ConnectionIndicator.test.tsx`

### Task 7: Create station selector dropdown (AC 4)
- [x] Create dropdown component within StationView (or use Radix Select primitive)
- [x] Fetch available stations from `authStore` or API
- [x] Default to user's assigned station
- [x] On change, update the `stationId` filter in `useStationOrders` hook
- [x] 56dp+ touch target, high contrast styling consistent with dark theme

### Task 8: Create orders API client (AC 1)
- [x] Create `frontend/src/api/orders.api.ts`
- [x] Implement `getOrdersByStation(stationId: string): Promise<Order[]>` — GET `/api/v1/orders?stationId={stationId}`
- [x] Type request/response using shared-types package interfaces
- [x] Include auth token header via Axios/fetch interceptor from `authStore`

### Task 9: Implement KitchenTokenProvider (AC 4)
- [x] Create `frontend/src/providers/KitchenTokenProvider.tsx`
- [x] Apply dark theme CSS custom properties via React context:
  - `--kitchen-bg: #0F172A` (dark slate)
  - `--kitchen-surface: #1E293B`
  - `--kitchen-text: #F8FAFC` (high contrast white)
  - `--kitchen-text-secondary: #94A3B8`
  - Kitchen-optimized spacing, font sizes
- [x] Wrap children with the provider div that applies the CSS class/variables

### Task 10: Configure React Router for Station View (AC 4)
- [x] Add route in `frontend/src/router.tsx`: `/station` path renders `StationView`
- [x] Implement role-based redirect: `line_cook` role redirects to `/station` on login
- [x] Read role and station assignment from Zustand `authStore`
- [x] Protect route: redirect to `/login` if not authenticated

### Task 11: Write tests (All ACs)
- [x] Test `StationView` renders only tickets for the assigned station (mock API response)
- [x] Test tickets are sorted by urgency (oldest in stage first)
- [x] Test TicketCard displays order number, items, elapsed time, station label
- [x] Test AttentionWrapper applies correct visual states at each time threshold
- [x] Test empty state message renders when ticket list is empty
- [x] Test skeleton loading state renders 3 shimmer placeholders
- [x] Test ConnectionIndicator renders correct state for connected/reconnecting/offline
- [x] Test WCAG: verify ARIA roles, labels, `aria-live` regions, touch target sizes (56dp+)
- [x] Test station selector dropdown changes filter

## Dev Notes

### Architecture Patterns
- Frontend state: TanStack Query 5.x for server state (orders), Zustand 5.x `authStore` for user/role/tenant/station
- Design tokens: `KitchenTokenProvider` provides dark theme CSS custom properties via React context
- Component variants: TicketCard has `station` variant (large, full bump button) vs `expeditor` (compact) vs `rail` (mini)
- Attention-driven UI: problems glow and grow, healthy fades — opacity/scale/animation driven by data freshness
- Zero navigation UI in Station View — only station selector dropdown as chrome
- WCAG 2.1 AA: 56dp+ touch targets, 7:1 contrast ratio (AAA target), triple-encoded status (color + animation + text)

### Project Structure Notes

```
frontend/src/views/StationView/
├── StationView.tsx                   # NEW — main page component
├── StationView.test.tsx              # NEW
├── hooks/
│   └── useStationOrders.ts           # NEW — TanStack Query fetch + sort
└── index.ts                          # NEW — barrel export

frontend/src/components/kitchen/TicketCard/
├── TicketCard.tsx                    # NEW
├── TicketCard.test.tsx               # NEW
└── index.ts                          # NEW

frontend/src/components/kitchen/AttentionWrapper/
├── AttentionWrapper.tsx              # NEW
├── AttentionWrapper.test.tsx         # NEW
└── index.ts                          # NEW

frontend/src/components/kitchen/ConnectionIndicator/
├── ConnectionIndicator.tsx           # NEW
├── ConnectionIndicator.test.tsx      # NEW
└── index.ts                          # NEW

frontend/src/hooks/useAttention.ts    # NEW
frontend/src/api/orders.api.ts        # NEW or MODIFY
frontend/src/providers/KitchenTokenProvider.tsx  # NEW
frontend/src/router.tsx               # MODIFY — add Station View route
frontend/src/stores/authStore.ts      # MODIFY — ensure stationId exposed
```

### References
- [Source: epics.md#Epic 2, Story 2.3]
- [Source: ux-design-specification.md#Journey 1: Marco — Bump-to-Advance]
- [Source: ux-design-specification.md#Custom Components — TicketCard, AttentionWrapper, ConnectionIndicator]
- [Source: architecture.md#Frontend Architecture]
- UX-DR2 (attention-driven design), UX-DR11 (station view layout)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A

### Completion Notes List
- All 11 tasks implemented with 32 frontend tests passing (13 new)
- StationView: dark theme via KitchenTokenProvider, station selector dropdown, ConnectionIndicator, empty state, skeleton loading
- TicketCard: order number (monospace), item list, elapsed time (updates every second), attention-driven styling
- useAttention hook: configurable thresholds (healthy/watching/warning/critical)
- useStationOrders hook with TanStack Query, sorted by urgency (oldest first)
- Zustand authStore with login/logout/setStationId
- orders.api.ts with fetchWithAuth helper
- React Router with /station route
- Tasks 4, 6, 9 reused from Story 1.6 (AttentionWrapper, ConnectionIndicator, KitchenTokenProvider)

### File List
- frontend/src/views/StationView/StationView.tsx
- frontend/src/views/StationView/StationView.test.tsx
- frontend/src/views/StationView/hooks/useStationOrders.ts
- frontend/src/views/StationView/index.ts
- frontend/src/components/kitchen/TicketCard/TicketCard.tsx
- frontend/src/components/kitchen/TicketCard/TicketCard.test.tsx
- frontend/src/components/kitchen/TicketCard/index.ts
- frontend/src/hooks/useAttention.ts
- frontend/src/hooks/useAttention.test.ts
- frontend/src/stores/authStore.ts
- frontend/src/api/orders.api.ts
- frontend/src/router.tsx
- frontend/package.json (modified — added @tanstack/react-query, zustand, react-router-dom)
