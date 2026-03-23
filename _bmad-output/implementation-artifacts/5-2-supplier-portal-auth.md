# Story 5.2: Supplier Portal Authentication & Dashboard

Status: ready-for-dev

## Story

As **Linda (supplier)**,
I want to log into a dedicated Supplier Portal and see a dashboard of demand signals across all my linked restaurants,
So that I can proactively manage inventory and spot trends.

## Acceptance Criteria (BDD)

**Given** Linda navigates to the Supplier Portal (separate SPA, separate domain from the restaurant app)
**When** she logs in with her supplier credentials
**Then** she receives a JWT with `role: 'supplier'` and `supplierId` claim, and the portal loads the DemandDashboard component showing aggregated inventory levels and consumption trends across all linked restaurants

**Given** the DemandDashboard is loaded
**When** rendered
**Then** it displays: (1) total pending reorders count, (2) restaurants approaching reorder thresholds (sorted by urgency), (3) consumption trend charts per item category, (4) a RestaurantFilter component to filter by specific client — all data fetched via GET `/api/v1/supplier/demand`

**Given** Linda is viewing the dashboard
**When** an `inventory.reorder.triggered` event fires from any linked restaurant
**Then** the dashboard updates in real-time via WebSocket (room: `supplier:{supplierId}`), and a notification badge appears on the orders tab

## Tasks / Subtasks

### Task 1: Supplier Authentication (AC: JWT with supplier role)

- [ ] Add supplier login endpoint POST `/api/v1/auth/supplier/login` returning JWT with `role: 'supplier'`, `supplierId` claim
- [ ] Create supplier auth strategy in `backend/src/auth/strategies/supplier.strategy.ts`
- [ ] Add supplier password hashing (bcrypt, cost factor 12) to supplier user creation flow
- [ ] Verify JWT payload includes `supplierId` for downstream authorization

### Task 2: Demand Dashboard API (AC: GET /api/v1/supplier/demand)

- [ ] Create `backend/src/supplier/demand.service.ts` — aggregates inventory levels across linked restaurants
- [ ] Implement GET `/api/v1/supplier/demand` returning: pending reorders count, threshold-approaching items (sorted by urgency), consumption trends per category
- [ ] Enforce data access via `SupplierRestaurantLink` JOIN — no unlinked restaurant data
- [ ] Add RestaurantFilter query param support (`?locationId=X`)

### Task 3: Supplier Portal Frontend — DemandDashboard (AC: UI components)

- [ ] Create `supplier-portal/src/views/DemandDashboard/DemandDashboard.tsx` with 4-section layout
- [ ] Create `supplier-portal/src/components/RestaurantFilter/` — dropdown filter component
- [ ] Implement pending reorders summary card with count badge
- [ ] Implement threshold-approaching restaurants list (sorted by urgency)
- [ ] Implement consumption trend charts per item category
- [ ] Style with Tailwind CSS v4.2, light theme (OfficeTokenProvider), desktop-first layout (UX-DR15)

### Task 4: Real-Time WebSocket Integration (AC: live updates)

- [ ] Configure Socket.io client in supplier-portal with JWT auth
- [ ] Subscribe to `supplier:{supplierId}` room on connection
- [ ] Handle `inventory.reorder.triggered` event — update TanStack Query cache, show notification badge
- [ ] Backend: emit `inventory.reorder.triggered` to `supplier:{supplierId}` room when any linked restaurant triggers reorder

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for demand service (aggregation logic, cross-tenant isolation)
- [ ] Unit tests for DemandDashboard component (render, filter, real-time update)
- [ ] Integration test: supplier login → demand dashboard → WebSocket event

## Dev Notes

- Supplier Portal is a **separate SPA** in `supplier-portal/` — separate Vite build, separate domain
- Uses OfficeTokenProvider (light theme, desktop-first per UX-DR15)
- WebSocket room pattern: `supplier:{supplierId}` — distinct from tenant namespaces
- Data table with sidebar layout, 12-column grid, sticky header, keyboard navigable (UX-DR15)

### Project Structure Notes

- `supplier-portal/src/views/DemandDashboard/` — main dashboard view
- `supplier-portal/src/components/RestaurantFilter/` — filter component
- `supplier-portal/src/stores/` — Zustand stores for auth, UI state
- `backend/src/supplier/demand.service.ts` — aggregation service

### References

- [Source: epics.md#Story 5.2]
- [Source: ux-design-specification.md#UX-DR15]
- [Source: architecture.md#Frontend Architecture]
- [Source: prd.md#FR32-FR33]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
