# Story 6.6: Adoption Metrics & Monitoring Dashboard

Status: ready-for-dev

## Story

As **Alex (system admin)**,
I want to monitor adoption metrics across onboarded restaurants,
So that I can identify underperforming locations and proactively support them.

## Acceptance Criteria (BDD)

**Given** Alex opens the Admin Console adoption dashboard
**When** the dashboard loads
**Then** it displays per-tenant metrics: bump usage rate (% of tickets bumped vs manually processed), prep checklist completion rate, active users per day, Service Tempo average, and days since onboarding — fetched via GET `/api/v1/admin/metrics/adoption`

**Given** a tenant has low bump adoption (e.g., <50% after 3 days)
**When** the dashboard renders
**Then** the tenant is flagged with an attention indicator, and Alex can drill down to see which stations or staff are underperforming

**Given** the metrics are displayed
**When** Alex wants to track a specific restaurant
**Then** he can view a timeline of adoption metrics from onboarding date to present, showing the adoption curve and identifying when staff engagement peaked or dropped

## Tasks / Subtasks

### Task 1: Adoption Metrics API (AC: GET endpoint)

- [ ] Create `backend/src/admin/metrics.service.ts`
- [ ] Calculate per-tenant metrics: bump usage rate, checklist completion rate, active users/day, Service Tempo avg, days since onboarding
- [ ] GET `/api/v1/admin/metrics/adoption` — returns all tenants with metrics
- [ ] GET `/api/v1/admin/metrics/adoption/:tenantId` — returns timeline for specific tenant
- [ ] Add `@Roles('system_admin')` guard

### Task 2: Bump Usage Rate Calculation

- [ ] Count total order stage transitions (bumps) vs total orders reaching final stage
- [ ] Calculate percentage: bumps / total completions
- [ ] Track per-station and per-staff breakdowns

### Task 3: Adoption Dashboard UI (AC: display + attention indicators)

- [ ] Create `frontend/src/views/AdminConsole/AdoptionDashboard/AdoptionDashboard.tsx`
- [ ] Display tenant list with metrics columns (sortable table)
- [ ] Flag tenants with <50% bump adoption after 3 days (attention indicator)
- [ ] Click-to-drill-down: tenant → station/staff breakdown

### Task 4: Adoption Timeline View (AC: per-tenant timeline)

- [ ] Create timeline visualization: adoption metrics over time from onboarding date
- [ ] Show bump rate, active users, checklist completion as line charts
- [ ] Highlight peaks and drops in engagement

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for metrics calculation logic
- [ ] Unit tests for dashboard component (render, sort, filter, attention flags)
- [ ] Integration test: onboard tenant → generate activity → verify metrics

## Dev Notes

- Metrics are calculated from existing event/order data — no new tracking tables needed
- Bump usage rate = stage transitions / order completions
- Low-adoption threshold (50% after 3 days) should be configurable
- Admin-only view (system_admin role)

### Project Structure Notes

- `backend/src/admin/metrics.service.ts` — metrics aggregation
- `frontend/src/views/AdminConsole/AdoptionDashboard/` — dashboard + timeline views

### References

- [Source: epics.md#Story 6.6]
- [Source: prd.md#FR47]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
