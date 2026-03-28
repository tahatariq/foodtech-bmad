# Story 6.5: Organization Dashboard & Multi-Location Views

Status: review

## Story

As **David (organization owner)**,
I want to view all my locations from a single dashboard and drill down to identify bottlenecks,
So that I can manage multiple restaurants without driving between them.

## Acceptance Criteria (BDD)

**Given** David logs in with the `organization_owner` role
**When** the Management Console loads
**Then** it displays a card grid of all locations under his organization (up to subscription tier limit: Indie=1, Growth=10, Enterprise=unlimited), each card showing: location name, current Service Tempo status (green/amber/red), active order count, and staff on duty — fetched via GET `/api/v1/organizations/:orgId/locations`

**Given** the location cards are displayed
**When** David clicks a location card
**Then** the view transitions seamlessly (summary-to-detail pattern) to the individual location detail, showing the same Expeditor Dashboard data: Station Status, Kitchen Status, Service Tempo, and the order rail — drill-down per FR41

**Given** David is viewing the organization dashboard
**When** a location's Service Tempo changes
**Then** the card updates in real-time via WebSocket (David subscribes to events for all locations in his organization), and locations with amber/red Tempo rise to the top of the grid

**Given** David wants to compare locations
**When** he views the consolidated dashboard
**Then** cross-location analytics are available: average ticket times, order volumes, Service Tempo history, and inventory alerts across all locations — accessible via sidebar navigation (per UX-DR22 navigation pattern)

## Tasks / Subtasks

### Task 1: Organizations API (AC: location listing)

- [ ] Create `backend/src/organizations/organizations.module.ts`
- [ ] GET `/api/v1/organizations/:orgId/locations` — returns all locations with summary metrics
- [ ] Include per-location: name, Service Tempo status, active order count, staff on duty count
- [ ] Add `@Roles('org_owner')` guard, verify user belongs to organization

### Task 2: Location Card Grid (AC: dashboard display)

- [ ] Create `frontend/src/views/ManagementConsole/ManagementConsole.tsx` — card grid layout
- [ ] Create `frontend/src/components/management/LocationCard/LocationCard.tsx`
- [ ] Display location name, Service Tempo indicator (green/amber/red), order count, staff count
- [ ] Responsive grid: 2-4 columns based on viewport (UX-DR17)
- [ ] Light theme (OfficeTokenProvider), desktop-first with tablet landscape support

### Task 3: Location Detail Drill-Down (AC: summary-to-detail)

- [ ] Implement click-to-drill-down: card → location detail view
- [ ] Reuse Expeditor Dashboard components: Station Status, Kitchen Status, Service Tempo, order rail
- [ ] Add back navigation to return to grid view
- [ ] Animate transition (summary-to-detail pattern per UX-DR17)

### Task 4: Real-Time Location Updates (AC: WebSocket)

- [ ] Subscribe David to events for all locations in his organization
- [ ] Handle `tempo.updated` events — update location card Service Tempo
- [ ] Re-sort grid: amber/red locations rise to top
- [ ] Update TanStack Query cache on WebSocket events

### Task 5: Cross-Location Analytics (AC: consolidated dashboard)

- [ ] Create analytics sidebar view with: average ticket times, order volumes, Service Tempo history, inventory alerts
- [ ] Aggregate data across all organization locations
- [ ] GET `/api/v1/organizations/:orgId/analytics` endpoint

### Task 6: Write Tests (AC: all)

- [ ] Unit tests for LocationCard component
- [ ] Unit tests for drill-down transition
- [ ] Integration test: org dashboard → real-time update → drill-down → back
- [ ] API tests for organization endpoints with role guards

## Dev Notes

- Management Console uses OfficeTokenProvider (light theme, desktop-first)
- Card grid with status indicators follows UX-DR17
- David subscribes to WebSocket events for ALL locations in his org — fan-in pattern
- Reuses Expeditor Dashboard components for drill-down (avoid duplication)

### Project Structure Notes

- `frontend/src/views/ManagementConsole/` — dashboard + drill-down views
- `frontend/src/components/management/LocationCard/` — card component
- `backend/src/organizations/` — org management module

### References

- [Source: epics.md#Story 6.5]
- [Source: ux-design-specification.md#UX-DR17, UX-DR22]
- [Source: prd.md#FR39, FR40, FR41]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
