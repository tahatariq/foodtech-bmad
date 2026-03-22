# Story 2.2: Order Ingestion API (POS & Manual Entry)

Status: ready-for-dev

## Story

As a **POS system** or **kitchen staff member**,
I want to submit orders to FoodTech via REST API or quick-entry interface,
so that orders appear on the correct station's queue automatically.

## Acceptance Criteria (BDD)

**Given** a valid API key (for POS) or authenticated staff member
**When** they POST to `/api/v1/orders` with `{ orderNumber, items: [{ itemName, stationId, quantity }] }`
**Then** the order is created with status "received", items are routed to specified stations, and a 201 response returns the order with ID

**Given** an order is created
**When** items reference a station
**Then** each `order_item` is assigned to the correct station with initial stage matching the first configured stage

**Given** the order is created successfully
**When** the system processes it
**Then** an `order.created` event is emitted via WebSocket to the tenant namespace with full order payload wrapped in `FoodTechEvent<T>`

**Given** a malformed order payload (missing items, invalid stationId)
**When** submitted via API
**Then** a 422 response is returned in RFC 7807 format with field-level Zod validation errors

**And** API authentication supports both JWT (staff) and API key + HMAC (POS) via the guard chain

## Tasks / Subtasks

### Task 1: Create Order Ingestion DTOs with Zod validation (AC 1, AC 4)
- [ ] Create `backend/src/modules/orders/dto/create-order.dto.ts`
- [ ] Define Zod schema: `{ orderNumber: string (required), items: array of { itemName: string (required), stationId: string (UUID, required), quantity: number (min 1, required) } (min 1 item) }`
- [ ] Ensure validation errors produce field-level detail for RFC 7807 response

### Task 2: Implement OrdersController with POST endpoint (AC 1, AC 4, AC 5)
- [ ] Create/update `backend/src/modules/orders/orders.controller.ts`
- [ ] Add `POST /api/v1/orders` endpoint
- [ ] Apply dual auth guard: accept both JWT (staff) and API key + HMAC (POS)
- [ ] Use `ZodValidationPipe` for request body validation
- [ ] Return 201 with created order (id, orderNumber, status, items, createdAt)
- [ ] Return 422 in RFC 7807 format for validation errors

### Task 3: Implement OrdersService.createOrder() (AC 1, AC 2)
- [ ] Create/update `backend/src/modules/orders/orders.service.ts`
- [ ] Implement `createOrder(payload, tenantId)` method
- [ ] Generate UUID v4 for order ID
- [ ] Set order status to `'received'`
- [ ] Look up the first configured order stage for the tenant (from `order_stages` table)
- [ ] Create `order_items` records, each assigned to the specified `station_id` with initial stage set to first configured stage
- [ ] Validate that all `stationId` values reference existing stations within the tenant
- [ ] Wrap in a database transaction (order + all order_items created atomically)

### Task 4: Implement OrdersRepository database operations (AC 1, AC 2)
- [ ] Create/update `backend/src/modules/orders/orders.repository.ts`
- [ ] Implement `create(order, items, tenantId)` using Drizzle transaction
- [ ] Implement `findStationsByIds(stationIds, tenantId)` for station validation
- [ ] Implement `findFirstStage(tenantId)` to get initial stage from `order_stages`
- [ ] All queries scoped by `tenant_id`

### Task 5: Emit `order.created` WebSocket event (AC 3)
- [ ] Create/update `backend/src/modules/orders/orders.gateway.ts` — Socket.io gateway for order events
- [ ] After successful order creation, emit `order.created` event to tenant namespace `/tenant-{id}`
- [ ] Wrap payload in `FoodTechEvent<T>` format: `{ event: 'order.created', payload: { orderId, orderNumber, items, status }, tenantId, timestamp (ISO 8601 UTC), eventId (UUID) }`
- [ ] Create `backend/src/modules/orders/events/order.events.ts` with typed event interfaces

### Task 6: Implement dual authentication guard (AC 5)
- [ ] Create/update composite guard that accepts either JWT token or API key + HMAC signature
- [ ] JWT path: validate token, extract user/role/tenant from claims
- [ ] API key path: validate `X-FoodTech-API-Key` header, verify HMAC-SHA256 signature of request body, extract tenant from API key record
- [ ] Both paths result in a request context with `tenantId` and authenticated identity

### Task 7: Configure OrdersModule (AC 1)
- [ ] Create/update `backend/src/modules/orders/orders.module.ts`
- [ ] Register controller, service, repository, gateway
- [ ] Import required modules (database, auth, gateway)
- [ ] Register in `app.module.ts`

### Task 8: Write unit tests (All ACs)
- [ ] Test `OrdersService.createOrder()` creates order with status `'received'`
- [ ] Test items are assigned to correct stations with first configured stage
- [ ] Test invalid stationId throws validation error
- [ ] Test empty items array throws validation error
- [ ] Test `order.created` event is emitted with correct `FoodTechEvent<T>` wrapper
- [ ] Test RFC 7807 error format for validation failures

### Task 9: Write integration tests (AC 1, AC 3, AC 4, AC 5)
- [ ] Test POST `/api/v1/orders` with JWT auth returns 201 with order
- [ ] Test POST `/api/v1/orders` with API key + HMAC returns 201
- [ ] Test POST `/api/v1/orders` without auth returns 401
- [ ] Test POST `/api/v1/orders` with invalid payload returns 422 RFC 7807
- [ ] Test WebSocket client in tenant namespace receives `order.created` event
- [ ] Test cross-tenant isolation — order created in tenant A not visible to tenant B

## Dev Notes

### Architecture References
- Dual auth: JWT (staff/managers) and API key + HMAC-SHA256 (POS/machine integration)
- Guard chain: `AuthGuard → TenantGuard → RolesGuard → Controller`
- WebSocket topology: namespace-per-tenant (`/tenant-{id}`), room-per-view (`station:{stationId}`, `expeditor`)
- Event format: `FoodTechEvent<T>` typed wrapper with `event`, `payload`, `tenantId`, `timestamp`, `eventId`
- Error responses: RFC 7807 Problem Details with field-level Zod errors for 422
- All database operations are transactional for order + items creation

### Technical Stack
- NestJS 11.x with @nestjs/platform-socket.io
- Socket.io for WebSocket event emission
- Drizzle ORM for database transactions
- Zod for request validation
- PostgreSQL 16
- Jest for testing

### File Structure
```
backend/src/modules/orders/
├── orders.module.ts           # NEW
├── orders.controller.ts       # NEW
├── orders.service.ts          # NEW
├── orders.gateway.ts          # NEW
├── orders.repository.ts       # NEW
├── dto/
│   └── create-order.dto.ts    # NEW
├── events/
│   └── order.events.ts        # NEW
└── orders.service.test.ts     # NEW

packages/shared-types/src/
├── events.ts                  # MODIFY — add order.created event type
└── models.ts                  # MODIFY — add Order, OrderItem types
```

### Testing Requirements
- Unit tests: mock repository and gateway, test service logic (stage assignment, validation)
- Integration tests: full HTTP request cycle with test database, verify WebSocket event emission
- Test both authentication paths (JWT and API key)
- Test co-location: tests next to source files

### Dependencies
- Story 2.1 must be complete (stations, order_stages, orders, order_items tables exist)
- Epic 1 auth module (JWT guards, API key guard, TenantScope interceptor)
- Socket.io gateway infrastructure from Epic 1

### References
- [Source: epics.md#Epic 2, Story 2.2]
- [Source: architecture.md#API & Communication Patterns]
- [Source: architecture.md#Authentication & Security]
- [Source: architecture.md#Communication Patterns — WebSocket Event Naming]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
