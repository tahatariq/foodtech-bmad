# Story 6.4: Demo Simulator

Status: ready-for-dev

## Story

As **Alex (system admin) and restaurant owners**,
I want to run a demo simulator that generates realistic order patterns through the real backend,
So that new restaurants can see FoodTech in action before going live and staff can practice bumping.

## Acceptance Criteria (BDD)

**Given** Alex has completed tenant configuration
**When** he clicks "Run Demo Simulator" (offered at step 8 or from Admin Console)
**Then** the simulator starts via POST `/api/v1/simulator/start` with configurable pace (`rush`, `steady`, `slow`), generating realistic orders that flow through the full event pipeline (API → database → event bus → WebSocket → all views)

**Given** the simulator is running
**When** orders are generated
**Then** tickets appear on the Station View Rail, Kitchen Status updates with inventory decrements, Service Tempo responds to the simulated load, and all views update in real-time — proving the architecture works end-to-end

**Given** staff interact with simulated orders
**When** a cook bumps a simulated ticket
**Then** the bump is processed identically to a real order (same API, same events, same inventory decrement) — ensuring staff learn the real workflow

**Given** the simulator is running
**When** Alex clicks "Stop Simulator" or the simulator completes its configured order count
**Then** all simulated orders are flagged as `is_simulated: true` in the database, and an option to "Clear Simulated Data" removes them without affecting real data

## Tasks / Subtasks

### Task 1: Simulator Module (AC: NestJS module)

- [ ] Create `backend/src/simulator/simulator.module.ts`
- [ ] Create `backend/src/simulator/simulator.service.ts`
- [ ] Create `backend/src/simulator/simulator.controller.ts`
- [ ] Register module in app.module.ts

### Task 2: Order Generation Logic (AC: realistic patterns)

- [ ] Implement pace configurations: `rush` (order every 15-30s), `steady` (45-90s), `slow` (2-5min)
- [ ] Generate realistic orders using tenant's configured stations, stages, and menu items
- [ ] Randomize: order size (1-5 items), station distribution, item selection
- [ ] Submit orders through the real order ingestion API (POST `/api/v1/orders`) — not database shortcuts
- [ ] Mark generated orders with `is_simulated: true`

### Task 3: Simulator Control API (AC: start/stop)

- [ ] POST `/api/v1/simulator/start` — accepts `{ pace: 'rush' | 'steady' | 'slow', orderCount?: number }`
- [ ] POST `/api/v1/simulator/stop` — stops active simulator for tenant
- [ ] GET `/api/v1/simulator/status` — returns running state, orders generated count
- [ ] POST `/api/v1/simulator/clear` — deletes all `is_simulated: true` orders for tenant
- [ ] Add `@Roles('system_admin', 'location_manager')` guard

### Task 4: Simulator UI (AC: admin console integration)

- [ ] Add "Run Demo" button to wizard step 8 and Admin Console dashboard
- [ ] Pace selector: rush/steady/slow radio buttons
- [ ] Running indicator with order count
- [ ] "Stop" and "Clear Simulated Data" buttons

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for order generation (pace timing, realistic distribution)
- [ ] Integration test: start simulator → orders appear in views → bump works → stop → clear
- [ ] Test `is_simulated` flag isolation (clear doesn't touch real data)

## Dev Notes

- Simulator runs through the **real backend** — NestJS SimulatorModule, not client-side mocks
- Orders are submitted via the real order ingestion API to exercise the full pipeline
- `is_simulated` flag on orders table enables cleanup without affecting real data
- Pace uses `setInterval` with jitter for realistic timing

### Project Structure Notes

- `backend/src/simulator/simulator.module.ts` — NestJS module
- `backend/src/simulator/simulator.service.ts` — order generation logic
- `backend/src/simulator/simulator.controller.ts` — control endpoints
- `frontend/src/views/AdminConsole/` — UI integration

### References

- [Source: epics.md#Story 6.4]
- [Source: architecture.md#Demo Simulator]
- [Source: prd.md#FR48]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
