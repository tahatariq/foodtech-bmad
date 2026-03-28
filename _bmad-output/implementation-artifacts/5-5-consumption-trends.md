# Story 5.5: Supplier Consumption Trends & Demand Intelligence

Status: review

## Story

As **Linda (supplier)**,
I want to view aggregated consumption trends and demand signals across my restaurant clients,
So that I can proactively stock items and identify growth opportunities.

## Acceptance Criteria (BDD)

**Given** Linda navigates to the demand intelligence view on the Supplier Portal
**When** the view loads
**Then** it displays aggregated inventory levels across all linked restaurants, consumption rate trends (daily/weekly), items trending upward (proactive stocking opportunities), and items frequently 86'd (supply gap indicators) — all fetched via GET `/api/v1/supplier/trends`

**Given** Linda filters by a specific restaurant
**When** she selects a restaurant in the RestaurantFilter
**Then** the trends data scopes to that single restaurant, showing item-level consumption history and reorder frequency

**Given** the data displayed
**When** rendered
**Then** all cross-tenant data access is enforced via `SupplierRestaurantLink` — Linda can only see data from restaurants she is linked to, and no data from unlinked restaurants is ever returned by the API

## Tasks / Subtasks

### Task 1: Trends API Endpoint (AC: GET /api/v1/supplier/trends)

- [ ] Create `backend/src/supplier/trends.service.ts`
- [ ] Aggregate inventory levels across linked restaurants (JOIN via `SupplierRestaurantLink`)
- [ ] Calculate consumption rate trends: daily and weekly rolling averages
- [ ] Identify upward-trending items (7-day trend > 14-day trend)
- [ ] Identify frequently 86'd items (count of `is_86d = true` events in last 30 days)
- [ ] Support `?locationId=X` query param for per-restaurant filtering
- [ ] Create GET `/api/v1/supplier/trends` endpoint with `@Roles('supplier')` guard

### Task 2: Consumption Trends View (AC: UI)

- [ ] Create `supplier-portal/src/views/ConsumptionTrends/ConsumptionTrends.tsx`
- [ ] Display aggregated inventory levels section
- [ ] Display consumption rate charts (daily/weekly) — use simple bar/line charts
- [ ] Display trending-up items highlight section
- [ ] Display frequently 86'd items section with supply gap indicators
- [ ] Integrate RestaurantFilter component for per-restaurant scoping

### Task 3: Cross-Tenant Security (AC: data isolation)

- [ ] Verify all queries in trends.service.ts use `SupplierRestaurantLink` JOIN
- [ ] Add integration test: supplier A cannot see data from restaurants linked only to supplier B
- [ ] Add test: filtering by unlinked restaurant returns empty results

### Task 4: Write Tests (AC: all)

- [ ] Unit tests for trends service (aggregation, filtering, trend detection)
- [ ] Unit tests for ConsumptionTrends component
- [ ] Integration test: end-to-end trends API with cross-tenant isolation

## Dev Notes

- All aggregation queries MUST join through `SupplierRestaurantLink` — never filter in application code
- Trend detection: simple comparison of 7-day vs 14-day consumption averages
- 86'd frequency: count distinct days where item was marked 86'd in last 30 days

### Project Structure Notes

- `supplier-portal/src/views/ConsumptionTrends/` — trends view
- `backend/src/supplier/trends.service.ts` — aggregation logic

### References

- [Source: epics.md#Story 5.5]
- [Source: prd.md#FR33]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
