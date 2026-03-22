# Story 2.5: Real-Time Order Updates & Event Propagation

Status: ready-for-dev

## Story

As a **kitchen user**,
I want all views to update in real-time when any order event occurs,
So that everyone sees the same current state within 500ms.

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
- [ ] Connect to tenant namespace: `/tenant-{tenantId}` (read `tenantId` from Zustand `authStore`)
- [ ] Attach JWT token to connection handshake `auth` option for server-side authentication
- [ ] Join rooms based on user role on connect:
  - `line_cook` -> join `station:{stationId}` room
  - `expeditor` -> join `expeditor` room
  - Other roles -> join appropriate rooms per architecture spec
- [ ] Manage connection lifecycle: connect on mount, disconnect on unmount/logout
- [ ] Handle auto-reconnection with Socket.io built-in exponential backoff
- [ ] Expose connection state (`connected`, `reconnecting`, `disconnected`) via return value
- [ ] Store connection state in a ref to avoid unnecessary re-renders
- [ ] Clean up all event listeners on unmount

### Task 2: Integrate WebSocket events with TanStack Query cache (AC 1, AC 2)
- [ ] In `useSocket()` hook, register event listeners for order events
- [ ] On `order.stage.changed` event:
  - Update TanStack Query cache via `queryClient.setQueryData(['orders', stationId], updater)`
  - Modify the affected order's stage in-place within the cached array
  - If order moved out of this station's scope, remove it from cache
- [ ] On `order.created` event:
  - Determine which station(s) the new order's items belong to
  - Append new order to the relevant station's cached order list via `queryClient.setQueryData`
- [ ] On `order.completed` event:
  - Remove completed order from station caches via `queryClient.setQueryData`
- [ ] No `queryClient.invalidateQueries()` or manual refetch — cache is updated directly from events
- [ ] Deduplicate events: maintain a `Set<string>` of processed `eventId` values with 60-second TTL cleanup

### Task 3: Implement new ticket slide-in animation (AC 2)
- [ ] When `order.created` event adds a new ticket to the queue, mark it with a `isNew` flag
- [ ] Apply CSS slide-in animation: `@keyframes slideIn` from `translateY(-20px), opacity: 0` to `translateY(0), opacity: 1` over 0.5s
- [ ] Apply brief highlight: temporary brighter border glow (brand blue) for 0.5s, then transition to normal attention state
- [ ] Clear `isNew` flag after animation completes (500ms timeout)
- [ ] Respect `prefers-reduced-motion`: skip animation, ticket appears instantly

### Task 4: Create SocketContext provider (AC 3)
- [ ] Create `frontend/src/providers/SocketProvider.tsx`
- [ ] Create React context: `SocketContext` with value `{ connectionState, socket }`
- [ ] Initialize `useSocket()` hook within provider
- [ ] Wrap app root with `SocketProvider` (below AuthProvider, above router)
- [ ] `ConnectionIndicator` consumes `connectionState` from this context
- [ ] Export `useSocketContext()` convenience hook

### Task 5: Backend WebSocket room management (AC 1, AC 3)
- [ ] Update `backend/src/gateways/events.gateway.ts` to handle room joins on connection
- [ ] On client `connection` event: extract JWT from handshake, verify token, extract `tenantId`, `role`, `stationId`
- [ ] Auto-join client to rooms based on role:
  - `line_cook` -> `station:{stationId}`
  - `expeditor` -> `expeditor`
  - `location_manager` -> `manager`
- [ ] Implement `handleJoinRoom` event for clients to dynamically request room changes
- [ ] Validate room access: `line_cook` can only join their assigned station room
- [ ] Configure Redis adapter for Socket.io (`@socket.io/redis-adapter`) for multi-node event fanout

### Task 6: Ensure event propagation meets 500ms SLA (AC 1)
- [ ] Backend: emit events immediately after database write completes (no batching, no queue delay)
- [ ] Redis pub/sub adapter handles multi-node distribution
- [ ] Frontend: process incoming events synchronously in `useSocket` event handlers — no debounce/throttle
- [ ] Add `emittedAt` timestamp to all `FoodTechEvent<T>` payloads
- [ ] On frontend receive: log `Date.now() - event.emittedAt` for latency monitoring (dev mode only)
- [ ] If measured latency exceeds 500ms in testing, profile and optimize the bottleneck

### Task 7: Configure Zustand authStore for socket integration (AC 4)
- [ ] Update `frontend/src/stores/authStore.ts` to expose: `user`, `token`, `tenantId`, `role`, `stationId`
- [ ] Implement `login(credentials)` -> sets all auth fields from JWT decode
- [ ] Implement `logout()` -> clears all auth fields, disconnects socket
- [ ] Persist auth state via Zustand `persist` middleware (localStorage) for page refresh survival
- [ ] Provide `getToken()` selector for socket handshake and API interceptor

### Task 8: Configure React Router role-based routing (AC 4)
- [ ] Update `frontend/src/router.tsx` with role-based route configuration
- [ ] Routes:
  - `/station` -> `StationView` (lazy loaded via `React.lazy`)
  - `/expeditor` -> `ExpeditorDashboard` (lazy loaded, placeholder for Epic 3)
  - `/login` -> `LoginView`
- [ ] Post-login redirect: read `role` from `authStore`, redirect to role-appropriate view
  - `line_cook` -> `/station`
  - `expeditor` -> `/expeditor`
- [ ] Protected route wrapper: check `authStore.token`, redirect to `/login` if absent
- [ ] `React.Suspense` fallback with loading spinner for lazy-loaded views

### Task 9: Backend GET orders endpoint with station filter (AC 4)
- [ ] Add `GET /api/v1/orders` endpoint to `backend/src/orders/orders.controller.ts`
- [ ] Query params: `stationId` (required for station view), `status` (optional filter), `page` (default 1), `limit` (default 50)
- [ ] Return orders with items assigned to the specified station
- [ ] Filter by active statuses only by default: `received`, `preparing`, `plating` (exclude `served`, `completed`, `cancelled`)
- [ ] Apply `TenantScope` interceptor for tenant isolation
- [ ] Return shape: `{ data: Order[], meta: { page, limit, total } }`

### Task 10: Write frontend tests (AC 1, AC 2, AC 3, AC 4)
- [ ] Test `useSocket()` hook connects to correct tenant namespace (`/tenant-{tenantId}`)
- [ ] Test `useSocket()` joins correct room based on role (mock `authStore`)
- [ ] Test `order.stage.changed` event updates TanStack Query cache without refetch
- [ ] Test `order.created` event adds new ticket to cache
- [ ] Test `order.completed` event removes ticket from cache
- [ ] Test event deduplication: same `eventId` processed only once
- [ ] Test slide-in animation class applied to new tickets
- [ ] Test `ConnectionIndicator` reflects socket connection state from `SocketContext`
- [ ] Test role-based routing: `line_cook` redirects to `/station`
- [ ] Test protected route redirects to `/login` when unauthenticated

### Task 11: Write backend tests (AC 1, AC 3, AC 4)
- [ ] Test `GET /api/v1/orders?stationId=X` returns only orders with items for that station
- [ ] Test station filter excludes completed/cancelled orders by default
- [ ] Test pagination: `page` and `limit` params return correct slices
- [ ] Test tenant isolation: cannot fetch orders from another tenant
- [ ] Test WebSocket room join: `line_cook` joins `station:{stationId}` on connection
- [ ] Test room access control: `line_cook` cannot join `expeditor` room
- [ ] Test event fanout: `order.stage.changed` emitted to correct rooms
- [ ] Performance: measure event propagation end-to-end latency (target < 500ms)

## Dev Notes

### Architecture Patterns
- WebSocket topology: namespace-per-tenant (`/tenant-{id}`), room-per-view (`station:{stationId}`, `expeditor`, `customer:{orderId}`, `delivery`)
- Event format: `FoodTechEvent<T>` — `{ event, payload, tenantId, timestamp, eventId }`
- Frontend state architecture:
  - TanStack Query Cache: server state (orders, stations) — updated via WebSocket events, no polling
  - Zustand Stores: client state (`authStore`, `uiStore`, `offlineStore`)
  - React Context: `KitchenTokenProvider`, `SocketProvider`
- Socket.io auto-reconnection handles transient disconnects with exponential backoff
- Redis adapter required for multi-node Socket.io deployment (horizontal scaling)
- Event deduplication via `eventId` Set prevents duplicate cache updates

### Project Structure Notes

```
frontend/src/hooks/
├── useSocket.ts                      # NEW — Socket.io connection + TanStack Query integration
└── useAuth.ts                        # MODIFY — wire to authStore

frontend/src/providers/
└── SocketProvider.tsx                 # NEW — Socket context provider

frontend/src/stores/
└── authStore.ts                      # MODIFY — expose role, stationId, tenantId, persist

frontend/src/router.tsx               # MODIFY — role-based routing, lazy loading

frontend/src/views/StationView/
└── hooks/
    └── useStationOrders.ts           # MODIFY — integrate with useSocket for real-time cache updates

frontend/src/components/kitchen/ConnectionIndicator/
└── ConnectionIndicator.tsx           # MODIFY — consume SocketContext

backend/src/gateways/
└── events.gateway.ts                 # MODIFY — room management, JWT auth, Redis adapter

backend/src/orders/
├── orders.controller.ts              # MODIFY — add GET /orders endpoint with station filter
└── orders.gateway.ts                 # MODIFY — ensure events fan out to correct rooms
```

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
