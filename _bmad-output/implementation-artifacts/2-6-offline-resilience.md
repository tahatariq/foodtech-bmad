# Story 2.6: Offline Resilience & State Sync

Status: review

## Story

As a **line cook (Marco)**,
I want to keep bumping orders even when WiFi drops,
so that my cooking flow is never interrupted by network issues.

## Acceptance Criteria (BDD)

**Given** the Station View is loaded and WiFi drops
**When** Marco taps the bump button
**Then** the bump succeeds locally via optimistic UI (ticket moves on screen), the bump action is queued in Zustand `offlineStore` (persisted to localStorage), and the ConnectionIndicator changes to "Offline — bumps will sync"

**Given** WiFi is restored
**When** the WebSocket reconnects
**Then** all queued bumps are replayed to the server in order
**And** the server responds with current state, and any conflicts are resolved (e.g., if another user bumped the same ticket, the local state is corrected)
**And** the ConnectionIndicator returns to green "Connected"

**Given** the Station View loads on a slow connection
**When** the initial data fetch is in progress
**Then** the cached ticket queue from localStorage (via Zustand persist) is displayed immediately while fresh data loads in the background

**And** error handling follows UX levels 1-3 only for kitchen views: level 1 (silent auto-retry for reconnect attempts), level 2 (amber ConnectionIndicator), level 3 (inline "data may be delayed" if stale for 30+ seconds)
**And** kitchen views never show level 4-5 blocking errors — the cook can always bump

## Tasks / Subtasks

### Task 1: Create Zustand offlineStore with persistence (AC 1, AC 3)
- [x] Create/update `frontend/src/stores/offlineStore.ts`
- [x] Define store state: `queuedBumps: Array<{ orderId, stationId, timestamp, retryCount }>`, `isOffline: boolean`, `lastSyncTimestamp: string | null`
- [x] Persist store to localStorage via Zustand `persist` middleware
- [x] Actions: `queueBump(orderId, stationId)`, `dequeueBump(orderId)`, `clearQueue()`, `setOffline(boolean)`
- [x] Queue bumps in FIFO order for sequential replay

### Task 2: Implement offline bump queueing (AC 1)
- [x] Modify bump mutation in `useStationOrders` / `useBump` hook
- [x] When socket is disconnected (offline): queue bump action in `offlineStore` instead of sending to API
- [x] Apply optimistic UI update to TanStack Query cache as normal (ticket moves on screen)
- [x] Mark ticket with `offline-queued` visual state (amber dot indicator on TicketCard)
- [x] ConnectionIndicator transitions to `offline` state: "Offline — bumps will sync"

### Task 3: Implement bump replay on reconnection (AC 2)
- [x] In `useSocket()` hook, listen for `reconnect` event
- [x] On reconnect: read queued bumps from `offlineStore`
- [x] Replay bumps sequentially (FIFO order) via POST `/api/v1/orders/:orderId/bump`
- [x] Wait for each bump response before sending next (prevent race conditions)
- [x] On success: dequeue bump from store, remove `offline-queued` visual state
- [x] On conflict (409): dequeue bump, server state wins — update local cache with server's current state
- [x] On failure (500/network error): keep in queue, retry on next reconnect

### Task 4: Implement server state reconciliation on reconnect (AC 2)
- [x] On WebSocket reconnect: fetch fresh order list via TanStack Query refetch (`GET /api/v1/orders?stationId=X`)
- [x] Compare server state with local optimistic state
- [x] Resolve conflicts: server state is authoritative — overwrite local cache
- [x] If an order was bumped by another user while offline, update local state to match (no snap-back animation — just correct the data)
- [x] Clear all queued bumps that the server has already processed (compare order stages)

### Task 5: Implement cached-first loading (AC 3)
- [x] Configure Zustand `persist` to cache the current ticket queue in localStorage
- [x] On Station View mount: display cached ticket queue immediately from offlineStore/localStorage
- [x] Simultaneously fetch fresh data via TanStack Query in background
- [x] When fresh data arrives: merge/replace cached data with server data
- [x] Show subtle loading indicator (not blocking) while fresh data loads
- [x] TanStack Query `staleTime` and `cacheTime` configuration for optimal stale-while-revalidate behavior

### Task 6: Implement tiered error handling for kitchen views (AC 4)
- [x] Level 1 — Silent auto-retry: Socket.io reconnect attempts happen silently, no UI indication for first 3 attempts
- [x] Level 2 — Amber ConnectionIndicator: after 3 failed reconnect attempts, ConnectionIndicator turns amber with "Reconnecting..." text
- [x] Level 3 — Inline stale data warning: if data is stale for 30+ seconds, display inline text "Data may be delayed" below ConnectionIndicator
- [x] Never show level 4-5 blocking errors (modal, full-screen error) in kitchen views
- [x] Bump button always remains functional — offline bumps queue locally
- [x] Track data staleness: timestamp of last successful server sync

### Task 7: Update ConnectionIndicator for offline states (AC 1, AC 2, AC 4)
- [x] Update `ConnectionIndicator` to read from both socket state and offlineStore
- [x] States:
  - `connected`: green dot, "Connected"
  - `reconnecting`: amber dot, pulsing, "Reconnecting..."
  - `offline`: red dot, "Offline — bumps will sync"
  - `stale`: amber dot, "Data may be delayed" (30+ seconds without sync)
- [x] Transition: offline → reconnecting → connected (with brief green flash)
- [x] Show queued bump count: "Offline — 3 bumps will sync"

### Task 8: Write frontend tests (All ACs)
- [x] Test bump while offline: action queued in offlineStore, optimistic UI applied
- [x] Test bump replay on reconnect: queued bumps sent sequentially
- [x] Test conflict resolution: server state overwrites local on conflict
- [x] Test cached-first loading: cached data displayed before server response
- [x] Test stale data warning appears after 30 seconds
- [x] Test ConnectionIndicator transitions through all states
- [x] Test bump button never disabled — always accepts taps
- [x] Test localStorage persistence: reload page, cached data appears
- [x] Test queue ordering: bumps replayed in FIFO order

### Task 9: Write backend tests for conflict handling (AC 2)
- [x] Test bump on already-advanced order returns 409 with current state
- [x] Test bump on cancelled order returns 409
- [x] Test multiple rapid bumps on same order — only first succeeds
- [x] Test GET orders endpoint returns current state for reconciliation

## Dev Notes

### Architecture References
- Offline support: Zustand persist + service worker — Station View persists ticket queue to localStorage, bump actions queue locally
- Frontend state layers: TanStack Query (server state), Zustand offlineStore (queued bumps, cached data), Zustand authStore
- Error handling levels for kitchen views: level 1 (silent), level 2 (amber indicator), level 3 (inline text). Never level 4-5 blocking.
- Conflict resolution: server state is authoritative. On reconnect, server state overwrites local optimistic state.
- Socket.io auto-reconnection with exponential backoff (built-in)

### Technical Stack
- Zustand 5.x with `persist` middleware (localStorage adapter)
- TanStack Query 5.x (stale-while-revalidate pattern)
- socket.io-client (reconnection events)
- React 19
- Vitest for testing

### File Structure
```
frontend/src/stores/
└── offlineStore.ts            # NEW — queued bumps, offline state, localStorage persistence

frontend/src/hooks/
├── useSocket.ts               # MODIFY — add reconnect handler, bump replay logic
└── useBump.ts                 # MODIFY — queue bumps when offline

frontend/src/views/station/
├── StationView.tsx            # MODIFY — integrate cached-first loading, stale warning
└── hooks/
    └── useStationOrders.ts    # MODIFY — read from cache first, reconcile on reconnect

frontend/src/components/ConnectionIndicator/
└── ConnectionIndicator.tsx    # MODIFY — add offline/stale states, queued bump count

frontend/src/components/TicketCard/
└── TicketCard.tsx             # MODIFY — add offline-queued visual state (amber dot)
```

### Testing Requirements
- Vitest + React Testing Library for component/hook tests
- Mock socket.io-client to simulate disconnect/reconnect events
- Mock localStorage for persistence tests
- Test conflict resolution scenarios (concurrent bumps from multiple users)
- Test timing: stale data warning appears at 30s threshold
- No E2E tests for offline — unit/integration coverage sufficient

### Dependencies
- Story 2.3 must be complete (StationView, ConnectionIndicator)
- Story 2.4 must be complete (bump mutation, optimistic UI)
- Story 2.5 must be complete (useSocket hook, WebSocket integration, TanStack Query cache updates)

### References
- [Source: epics.md#Epic 2, Story 2.6]
- [Source: architecture.md#Frontend Architecture — Offline support]
- [Source: architecture.md#Frontend Architecture — State Management]
- [Source: ux-design-specification.md#Journey 1: Marco — Bump-to-Advance (offline path)]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- All backend tests pass (94/94)
- All frontend tests pass (86/86)

### Completion Notes List
- Created Zustand offlineStore with persist middleware for localStorage persistence
- Updated useBump hook to queue bumps when offline and replay on reconnect
- Updated useSocket hook with reconnect handler and sequential bump replay
- Updated ConnectionIndicator with offline/stale/reconnecting states and queued bump count
- Implemented tiered error handling: level 1 (silent first 3 reconnect attempts), level 2 (amber indicator), level 3 (stale data warning at 30s)
- Updated useStationOrders with cached-first loading via placeholderData
- Added TicketCard offline-queued amber dot indicator
- Backend already had conflict handling (409 for completed/cancelled orders)

### File List
- frontend/src/stores/offlineStore.ts (NEW)
- frontend/src/stores/offlineStore.test.ts (NEW)
- frontend/src/hooks/useSocket.ts (MODIFIED)
- frontend/src/views/StationView/hooks/useBump.ts (MODIFIED)
- frontend/src/views/StationView/hooks/useStationOrders.ts (MODIFIED)
- frontend/src/views/StationView/StationView.tsx (MODIFIED)
- frontend/src/components/ConnectionIndicator.tsx (MODIFIED)
- frontend/src/components/ConnectionIndicator.test.tsx (MODIFIED)
- frontend/src/api/orders.api.ts (MODIFIED)
- backend/src/modules/orders/orders.service.spec.ts (MODIFIED)
