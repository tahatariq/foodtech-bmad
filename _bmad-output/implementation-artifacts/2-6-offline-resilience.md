# Story 2.6: Offline Resilience & State Sync

Status: ready-for-dev

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
- [ ] Create/update `frontend/src/stores/offlineStore.ts`
- [ ] Define store state: `queuedBumps: Array<{ orderId, stationId, timestamp, retryCount }>`, `isOffline: boolean`, `lastSyncTimestamp: string | null`
- [ ] Persist store to localStorage via Zustand `persist` middleware
- [ ] Actions: `queueBump(orderId, stationId)`, `dequeueBump(orderId)`, `clearQueue()`, `setOffline(boolean)`
- [ ] Queue bumps in FIFO order for sequential replay

### Task 2: Implement offline bump queueing (AC 1)
- [ ] Modify bump mutation in `useStationOrders` / `useBump` hook
- [ ] When socket is disconnected (offline): queue bump action in `offlineStore` instead of sending to API
- [ ] Apply optimistic UI update to TanStack Query cache as normal (ticket moves on screen)
- [ ] Mark ticket with `offline-queued` visual state (amber dot indicator on TicketCard)
- [ ] ConnectionIndicator transitions to `offline` state: "Offline — bumps will sync"

### Task 3: Implement bump replay on reconnection (AC 2)
- [ ] In `useSocket()` hook, listen for `reconnect` event
- [ ] On reconnect: read queued bumps from `offlineStore`
- [ ] Replay bumps sequentially (FIFO order) via POST `/api/v1/orders/:orderId/bump`
- [ ] Wait for each bump response before sending next (prevent race conditions)
- [ ] On success: dequeue bump from store, remove `offline-queued` visual state
- [ ] On conflict (409): dequeue bump, server state wins — update local cache with server's current state
- [ ] On failure (500/network error): keep in queue, retry on next reconnect

### Task 4: Implement server state reconciliation on reconnect (AC 2)
- [ ] On WebSocket reconnect: fetch fresh order list via TanStack Query refetch (`GET /api/v1/orders?stationId=X`)
- [ ] Compare server state with local optimistic state
- [ ] Resolve conflicts: server state is authoritative — overwrite local cache
- [ ] If an order was bumped by another user while offline, update local state to match (no snap-back animation — just correct the data)
- [ ] Clear all queued bumps that the server has already processed (compare order stages)

### Task 5: Implement cached-first loading (AC 3)
- [ ] Configure Zustand `persist` to cache the current ticket queue in localStorage
- [ ] On Station View mount: display cached ticket queue immediately from offlineStore/localStorage
- [ ] Simultaneously fetch fresh data via TanStack Query in background
- [ ] When fresh data arrives: merge/replace cached data with server data
- [ ] Show subtle loading indicator (not blocking) while fresh data loads
- [ ] TanStack Query `staleTime` and `cacheTime` configuration for optimal stale-while-revalidate behavior

### Task 6: Implement tiered error handling for kitchen views (AC 4)
- [ ] Level 1 — Silent auto-retry: Socket.io reconnect attempts happen silently, no UI indication for first 3 attempts
- [ ] Level 2 — Amber ConnectionIndicator: after 3 failed reconnect attempts, ConnectionIndicator turns amber with "Reconnecting..." text
- [ ] Level 3 — Inline stale data warning: if data is stale for 30+ seconds, display inline text "Data may be delayed" below ConnectionIndicator
- [ ] Never show level 4-5 blocking errors (modal, full-screen error) in kitchen views
- [ ] Bump button always remains functional — offline bumps queue locally
- [ ] Track data staleness: timestamp of last successful server sync

### Task 7: Update ConnectionIndicator for offline states (AC 1, AC 2, AC 4)
- [ ] Update `ConnectionIndicator` to read from both socket state and offlineStore
- [ ] States:
  - `connected`: green dot, "Connected"
  - `reconnecting`: amber dot, pulsing, "Reconnecting..."
  - `offline`: red dot, "Offline — bumps will sync"
  - `stale`: amber dot, "Data may be delayed" (30+ seconds without sync)
- [ ] Transition: offline → reconnecting → connected (with brief green flash)
- [ ] Show queued bump count: "Offline — 3 bumps will sync"

### Task 8: Write frontend tests (All ACs)
- [ ] Test bump while offline: action queued in offlineStore, optimistic UI applied
- [ ] Test bump replay on reconnect: queued bumps sent sequentially
- [ ] Test conflict resolution: server state overwrites local on conflict
- [ ] Test cached-first loading: cached data displayed before server response
- [ ] Test stale data warning appears after 30 seconds
- [ ] Test ConnectionIndicator transitions through all states
- [ ] Test bump button never disabled — always accepts taps
- [ ] Test localStorage persistence: reload page, cached data appears
- [ ] Test queue ordering: bumps replayed in FIFO order

### Task 9: Write backend tests for conflict handling (AC 2)
- [ ] Test bump on already-advanced order returns 409 with current state
- [ ] Test bump on cancelled order returns 409
- [ ] Test multiple rapid bumps on same order — only first succeeds
- [ ] Test GET orders endpoint returns current state for reconciliation

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
### Debug Log References
### Completion Notes List
### File List
