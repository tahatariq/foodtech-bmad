# Story 1.5: Real-Time Event Infrastructure

Status: ready-for-dev

## Story

As a **kitchen user**,
I want real-time event delivery via WebSocket with tenant-isolated channels,
So that all views update instantly when kitchen state changes.

## Acceptance Criteria (BDD)

**Given** a WebSocket gateway is configured with Socket.io
**When** an authenticated client connects
**Then** the connection is authenticated via JWT (sent as handshake auth), assigned to the `/tenant-{id}` namespace, and joined to appropriate rooms based on role

**Given** the Redis adapter is configured
**When** multiple backend instances are running
**Then** events emitted on one instance are received by clients connected to other instances via Redis pub/sub

**Given** a `FoodTechEvent<T>` is emitted (with `event`, `payload`, `tenantId`, `timestamp`, `eventId` fields)
**When** it is broadcast to a tenant namespace
**Then** only clients in that tenant's namespace receive it
**And** event delivery completes within 200ms (server to connected client)

**Given** a client disconnects
**When** it reconnects with a valid JWT
**Then** it is automatically re-authenticated, re-joined to its rooms, and receives any missed state via a full state sync mechanism

**And** the `shared-types` package exports the `FoodTechEvent<T>` interface and all event name constants

## Tasks / Subtasks

### Task 1: Install WebSocket Dependencies (AC: Socket.io gateway configured)

- [ ] Install in `backend/`: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`
- [ ] Install Redis adapter: `@socket.io/redis-adapter`, `ioredis`
- [ ] Install in `frontend/` and `supplier-portal/`: `socket.io-client`
- [ ] Add `REDIS_URL` to backend `.env.example` if not already present

### Task 2: Define FoodTechEvent Interface and Event Constants (AC: shared-types exports FoodTechEvent<T> and event constants)

- [ ] Update `packages/shared-types/src/events.ts`:
  - Define `FoodTechEvent<T>` interface:
    ```typescript
    interface FoodTechEvent<T = unknown> {
      event: string;
      payload: T;
      tenantId: string;
      timestamp: string; // ISO 8601
      eventId: string;   // UUID v4
    }
    ```
  - Define event name constants organized by domain:
    - `ORDER_EVENTS`: `order.created`, `order.stage.changed`, `order.bumped`, `order.completed`, `order.voided`
    - `STATION_EVENTS`: `station.updated`, `station.load.changed`
    - `INVENTORY_EVENTS`: `inventory.level.changed`, `inventory.86d`, `inventory.un86d`
    - `SYSTEM_EVENTS`: `system.connection.status`, `system.state.sync`
  - Define room name helpers:
    - `getTenantNamespace(tenantId: string)` → `/tenant-${tenantId}`
    - `getStationRoom(stationId: string)` → `station:${stationId}`
    - `getCustomerRoom(orderId: string)` → `customer:${orderId}`
    - Constants: `EXPEDITOR_ROOM`, `DELIVERY_ROOM`
- [ ] Export all types and constants from `packages/shared-types/src/index.ts`

### Task 3: Configure Socket.io Gateway with Redis Adapter (AC: Redis adapter configured, multi-instance support)

- [ ] Create `backend/src/gateways/events.gateway.ts`:
  - Use `@WebSocketGateway()` decorator with CORS configuration
  - Configure namespace pattern: `/tenant-{id}` (dynamic namespaces)
  - Inject Redis adapter for pub/sub event distribution
- [ ] Create `backend/src/gateways/gateways.module.ts`:
  - Import and configure `@socket.io/redis-adapter` with `ioredis` client
  - Register the Redis adapter with Socket.io server
  - Provide Redis connection from `REDIS_URL` environment variable
- [ ] Configure Socket.io server options:
  - `cors`: allow configured origins
  - `transports`: `['websocket', 'polling']` (prefer WebSocket)
  - `pingInterval`: 25000ms
  - `pingTimeout`: 20000ms

### Task 4: Implement WebSocket Authentication (AC: connection authenticated via JWT handshake)

- [ ] Create `backend/src/gateways/middleware/ws-auth.middleware.ts`:
  - Extract JWT from `socket.handshake.auth.token`
  - Verify JWT using the same secret as HTTP auth (`JWT_SECRET`)
  - On valid token: attach user payload to `socket.data.user` (with `userId`, `tenantId`, `role`, `email`)
  - On invalid/missing token: disconnect with `{ message: 'Unauthorized' }` error
- [ ] Apply middleware in `EventsGateway.afterInit()` via `server.use(wsAuthMiddleware)`
- [ ] Write unit test: valid JWT → connection accepted, invalid JWT → connection rejected

### Task 5: Implement Tenant Namespace and Room Management (AC: assigned to namespace, joined to rooms based on role)

- [ ] In `EventsGateway.handleConnection(client)`:
  - Extract `tenantId` from `client.data.user`
  - Verify client connected to correct namespace (`/tenant-{tenantId}`)
  - Join client to role-appropriate rooms:
    - `line_cook` → `station:{assignedStationId}` room
    - `head_chef` → `expeditor` room + all station rooms
    - `location_manager` → `expeditor` room
    - `org_owner` → `expeditor` room
    - `customer` → `customer:{orderId}` room
    - `delivery_partner` → `delivery` room
    - `supplier` → `supplier:{supplierId}` room
  - Log connection with `userId`, `tenantId`, `role`, rooms joined
- [ ] In `EventsGateway.handleDisconnect(client)`:
  - Log disconnection with `userId`, `tenantId`
  - Clean up any client-specific state

### Task 6: Implement Event Broadcasting Service (AC: FoodTechEvent broadcast, tenant isolation, <200ms delivery)

- [ ] Create `backend/src/gateways/services/event-bus.service.ts`:
  - `emit<T>(event: FoodTechEvent<T>)`: broadcasts to the tenant namespace
    - Validates `tenantId` is present
    - Adds `eventId` (UUID v4) and `timestamp` (ISO 8601) if not set
    - Emits to `/tenant-{tenantId}` namespace
  - `emitToRoom<T>(tenantId: string, room: string, event: FoodTechEvent<T>)`: broadcasts to a specific room within the tenant
  - `emitToUser<T>(tenantId: string, userId: string, event: FoodTechEvent<T>)`: broadcasts to a specific user's socket(s)
- [ ] Make `EventBusService` injectable across all NestJS modules
- [ ] Write unit tests:
  - Event emitted to correct namespace
  - Event not received by other tenant namespaces
  - Room-specific events only reach clients in that room

### Task 7: Implement Reconnection and State Sync (AC: reconnects re-auth, re-join rooms, missed state sync)

- [ ] Create `backend/src/gateways/handlers/state-sync.handler.ts`:
  - On client reconnection (detected via `handleConnection` after disconnect):
    - Re-authenticate (JWT from handshake is re-validated)
    - Re-join rooms (same logic as initial connection)
    - Emit `system.state.sync` event with current state snapshot
  - State sync payload includes:
    - Active orders for the user's station/view
    - Current station status
    - Inventory alerts (86'd items)
- [ ] Create `@SubscribeMessage('request:state-sync')` handler:
  - Client can explicitly request a full state sync
  - Returns current state for the client's role and rooms
- [ ] Track last-seen event per client (via `eventId`) to determine what was missed

### Task 8: Create Frontend WebSocket Hook (AC: client connectivity)

- [ ] Create `frontend/src/hooks/useSocket.ts`:
  - Connects to `/tenant-{tenantId}` namespace with JWT in handshake auth
  - Manages connection state: `connected`, `reconnecting`, `disconnected`
  - Auto-reconnects on disconnect with exponential backoff
  - Provides `subscribe(event, callback)` and `unsubscribe(event)` methods
  - Exposes `connectionStatus` for UI indicators
  - Requests state sync on reconnection
- [ ] Create `frontend/src/contexts/SocketContext.tsx`:
  - React context provider wrapping `useSocket` for app-wide access
  - Provides `socket` instance, `connectionStatus`, and event subscription methods
- [ ] Write unit tests for hook lifecycle and reconnection logic

## Dev Notes

### Architecture References
- WebSocket topology: **namespace-per-tenant, room-per-view** — `/tenant-{id}` namespace isolates events; rooms: `station:{stationId}`, `expeditor`, `customer:{orderId}`, `delivery`, `supplier:{supplierId}` (architecture.md, "API & Communication Patterns")
- Event format: `{ event: string, payload: T, timestamp: ISO8601, tenantId: string }` — type-safe across frontend/backend (architecture.md)
- Redis required for Socket.io adapter for multi-node WebSocket (architecture.md, "Caching")
- WebSocket client: `socket.io-client` + custom React hook integrating with TanStack Query cache (architecture.md, "Frontend Architecture")

### Technical Stack
- `@nestjs/websockets` — NestJS WebSocket support
- `@nestjs/platform-socket.io` — Socket.io platform adapter for NestJS
- `socket.io` v4.x — WebSocket server
- `socket.io-client` v4.x — WebSocket client
- `@socket.io/redis-adapter` — Redis adapter for Socket.io
- `ioredis` — Redis client for Node.js
- Redis 7.x (from Docker Compose, Story 1.1)

### File Structure
```
backend/src/
├── gateways/
│   ├── gateways.module.ts
│   ├── events.gateway.ts
│   ├── events.gateway.test.ts
│   ├── middleware/
│   │   └── ws-auth.middleware.ts
│   ├── handlers/
│   │   └── state-sync.handler.ts
│   └── services/
│       └── event-bus.service.ts
frontend/src/
├── hooks/
│   └── useSocket.ts
├── contexts/
│   └── SocketContext.tsx
packages/
└── shared-types/
    └── src/
        └── events.ts                # Updated with full event types
```

### Testing Requirements
- Unit tests for `ws-auth.middleware.ts`: JWT validation on connect
- Unit tests for `EventsGateway`: connection handling, room assignment by role, disconnect cleanup
- Unit tests for `EventBusService`: tenant-scoped broadcasting, room targeting
- Unit tests for `useSocket` hook: connection lifecycle, reconnection, state sync request
- Integration test: connect two clients to different tenants, verify event isolation
- Integration test: emit event on one server instance, verify receipt on client connected to another instance (Redis pub/sub)
- Performance test: verify event delivery < 200ms (simple timing test)

### Dependencies
- **Story 1.1** (Monorepo Scaffold) — Docker Compose with Redis, shared-types package, frontend project
- **Story 1.2** (Database Schema) — tenant_id concept, location data for namespace mapping
- **Story 1.3** (Authentication) — JWT strategy and secret for WebSocket auth verification
- **Story 1.4** (RBAC) — role definitions for room assignment logic

### References
- [Source: epics.md#Epic 1, Story 1.5]
- [Source: architecture.md#API & Communication Patterns (WebSocket topology)]
- [Source: architecture.md#WebSocket Event Flow]
- [Source: architecture.md#Frontend Architecture (WebSocket client)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
