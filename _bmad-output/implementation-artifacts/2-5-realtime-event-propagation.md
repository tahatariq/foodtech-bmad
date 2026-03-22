# Story 2.5: Real-Time Order Updates & Event Propagation

Status: ready-for-dev

## Story

As a **kitchen user**,
I want all views to update in real-time when any order event occurs,
so that everyone sees the same current state within 500ms.

## Acceptance Criteria (BDD)

**Given** a bump event occurs on one Station View
**When** the `order.stage.changed` event propagates
**Then** all clients in the tenant namespace receive the event within 500ms (end-to-end)
**And** the TanStack Query cache is updated via `queryClient.setQueryData()` in the `useSocket()` hook — no manual refetch needed

**Given** a new order is created (via API or manual entry)
**When** the `order.created` event fires
**Then** the appropriate station's ticket queue updates automatically with the new ticket sliding in with a brief highlight animation (0.5s)

**Given** the `useSocket()` React hook is configured
**Then** it manages Socket.io connection lifecycle, auto-reconnection, room joining based on user role, and integrates WebSocket events with TanStack Query cache
**And** connection state is exposed to the ConnectionIndicator component

**And** the frontend uses TanStack Query for initial data fetch (GET `/api/v1/orders?stationId=X`) and WebSocket for subsequent real-time updates
**And** Zustand `authStore` manages user/token/tenant/role state
**And** React Router routes to Station View based on `line_cook` role on login

## Tasks / Subtasks

### Task 1: Implement `useSocket()` React hook (AC 3)
- [ ] Create `frontend/src/hooks/useSocket.ts`
- [ ] Initialize `socket.io-client` connection to backend WebSocket server
- [ ] Connect to tenant namespace: `/tenant-{tenantId}` (read tenantId from Zustand `authStore`)
- [ ] Attach JWT token to connection handshake for authentication
- [ ] Join rooms based on user role:
  - `line_cook` → join `station:{stationId}` room
  - `expeditor` → join `expeditor` room
  - Other roles → join appropriate rooms
- [ ] Manage connection lifecycle: connect, disconnect, auto-reconnect
- [ ] Expose connection state (`connected`, `reconnecting`, `offline`) for ConnectionIndicator
- [ ] Handle reconnection with exponential backoff (Socket.io built-in)
- [ ] Clean up on component unmount (disconnect socket)

### Task 2: Integrate WebSocket events with TanStack Query cache (AC 1, AC 2)
- [ ] In `useSocket()` hook, listen for `order.stage.changed` events
- [ ] On `order.stage.changed`: update TanStack Query cache via `queryClient.setQueryData(['orders', stationId], updater)` — modify the affected order's stage in-place
- [ ] On `order.created`: update TanStack Query cache — append new order to the relevant station's order list
- [ ] On `order.completed`: update TanStack Query cache — remove completed order from station list
- [ ] No manual `queryClient.invalidateQueries()` or refetch needed — cache is updated directly from events
- [ ] Deduplicate events using `eventId` from `FoodTechEvent<T>` wrapper (store processed eventIds in a Set, TTL 60s)

### Task 3: Implement new ticket slide-in animation (AC 2)
- [ ] When `order.created` event adds a new ticket to the queue, apply a slide-in animation
- [ ] New ticket slides in from left/top with a brief highlight animation (0.5s)
- [ ] Highlight: temporary brighter background or border glow, fades to normal attention state
- [ ] Respect `prefers-reduced-motion` — skip animation, just appear

### Task 4: Backend WebSocket room management (AC 1, AC 3)
- [ ] Update `backend/src/gateways/events.gateway.ts` to handle room joins
- [ ] On client connection: authenticate JWT, extract tenant/role, join appropriate rooms
- [ ] Implement `handleJoinRoom` event for clients to request room membership
- [ ] Verify room access against user role (e.g., line_cook can only join their station room)
- [ ] Use Redis adapter for Socket.io to support multi-node WebSocket (pub/sub event fanout)

### Task 5: Ensure event propagation meets 500ms SLA (AC 1)
- [ ] Backend: emit events immediately after database write (no batching/queuing)
- [ ] Redis pub/sub adapter for multi-node event distribution
- [ ] Frontend: process incoming events synchronously — no debouncing on event handlers
- [ ] Add server-side timestamp to events for latency measurement
- [ ] Log event delivery latency for monitoring (timestamp diff between emit and receive)

### Task 6: Configure Zustand authStore for role-based routing (AC 4)
- [ ] Update `frontend/src/stores/authStore.ts` to expose `user`, `token`, `tenantId`, `role`, `stationId`
- [ ] Persist auth state to handle page refresh
- [ ] Provide `login()`, `logout()`, `refreshToken()` actions

### Task 7: Configure React Router role-based routing (AC 4)
- [ ] Update `frontend/src/router.tsx` to route based on role from authStore
- [ ] `line_cook` role → redirect to Station View (`/station`)
- [ ] `expeditor` role → redirect to Expeditor Dashboard (`/expeditor`)
- [ ] Protected route wrapper: redirect to login if not authenticated
- [ ] Lazy-load views with `React.lazy()` + Suspense for code splitting

### Task 8: Create SocketContext provider (AC 3)
- [ ] Create `frontend/src/hooks/SocketContext.tsx` (or integrate into existing context)
- [ ] Wrap app with SocketContext provider that initializes `useSocket()` hook
- [ ] Expose socket instance and connection state to child components
- [ ] ConnectionIndicator reads state from this context

### Task 9: Backend GET endpoint for station orders (AC 4)
- [ ] Add `GET /api/v1/orders?stationId={stationId}` endpoint to `OrdersController`
- [ ] Return paginated list of orders with items assigned to the specified station
- [ ] Filter by active statuses only (received, preparing, plating — not served/completed/cancelled)
- [ ] Apply tenant scoping
- [ ] Support query params: `stationId`, `status`, `page`, `limit`

### Task 10: Write tests (All ACs)
- [ ] Test `useSocket()` hook connects to correct tenant namespace
- [ ] Test `useSocket()` joins correct room based on role
- [ ] Test `order.stage.changed` event updates TanStack Query cache (no refetch)
- [ ] Test `order.created` event adds ticket to cache with slide-in animation
- [ ] Test event deduplication (same eventId processed only once)
- [ ] Test ConnectionIndicator reflects socket connection state
- [ ] Test role-based routing: line_cook → Station View, expeditor → Expeditor Dashboard
- [ ] Backend: test GET `/api/v1/orders?stationId=X` returns filtered, paginated results
- [ ] Backend: test room join authorization (line_cook cannot join expeditor room)
- [ ] Performance: measure event propagation end-to-end latency (target < 500ms)

## Dev Notes

### Architecture References
- WebSocket topology: namespace-per-tenant (`/tenant-{id}`), room-per-view (`station:{stationId}`, `expeditor`, `customer:{orderId}`, `delivery`)
- Event format: `FoodTechEvent<T>` — `{ event, payload, tenantId, timestamp, eventId }`
- Frontend state architecture:
  - TanStack Query Cache: server state (orders, stations) — updated via WebSocket events
  - Zustand Stores: client state (authStore, uiStore, offlineStore)
  - React Context: DesignTokenContext, SocketContext
- Socket.io auto-reconnection handles transient disconnects
- Redis adapter required for multi-node Socket.io deployment

### Technical Stack
- Frontend: socket.io-client, TanStack Query 5.x, Zustand 5.x, React Router 7.x, React 19
- Backend: NestJS 11.x, @nestjs/platform-socket.io, @nestjs/websockets, Redis 7.x (Socket.io adapter)
- Shared: `FoodTechEvent<T>` types from packages/shared-types

### File Structure
```
frontend/src/hooks/
├── useSocket.ts               # NEW — Socket.io connection + TanStack Query integration
├── SocketContext.tsx           # NEW — Socket provider context
└── useAuth.ts                 # MODIFY — wire to authStore

frontend/src/stores/
└── authStore.ts               # MODIFY — expose role, stationId, tenantId

frontend/src/router.tsx        # MODIFY — role-based routing

frontend/src/views/station/
└── hooks/
    └── useStationOrders.ts    # MODIFY — integrate with useSocket for real-time updates

frontend/src/components/ConnectionIndicator/
└── ConnectionIndicator.tsx    # MODIFY — read from SocketContext

backend/src/gateways/
└── events.gateway.ts          # MODIFY — room management, auth, Redis adapter

backend/src/modules/orders/
├── orders.controller.ts       # MODIFY — add GET /orders?stationId endpoint
└── orders.gateway.ts          # MODIFY — ensure events fan out to correct rooms
```

### Testing Requirements
- Frontend: Vitest, mock socket.io-client, test cache updates from events
- Backend: Jest, test room join/leave, test event fanout to correct rooms
- Integration: E2E test with real WebSocket connection — bump on one client, verify update on another
- Performance: instrument event delivery latency, assert < 500ms
- Test co-location

### Dependencies
- Story 2.2 must be complete (order.created event emission)
- Story 2.3 must be complete (StationView, TicketCard, ConnectionIndicator components)
- Story 2.4 must be complete (order.stage.changed event emission, bump API)
- Epic 1: Socket.io gateway infrastructure, Redis configuration, auth module

### References
- [Source: epics.md#Epic 2, Story 2.5]
- [Source: architecture.md#Communication Patterns — WebSocket Event Flow]
- [Source: architecture.md#Frontend Architecture — State Management]
- [Source: architecture.md#Frontend Architecture — WebSocket client]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
