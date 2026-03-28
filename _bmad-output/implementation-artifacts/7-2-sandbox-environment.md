# Story 7.2: Sandbox Environment for Integration Testing

Status: review

## Story

As **Dev (POS integration developer)**,
I want a sandbox environment where I can test my integration against realistic data without affecting production,
So that I can build and debug my integration safely.

## Acceptance Criteria (BDD)

**Given** Dev generates sandbox credentials via the developer portal or API
**When** she creates a sandbox tenant via POST `/api/v1/integrations/sandbox`
**Then** a fully functional test tenant is provisioned with sample stations, stages, menu items, and inventory — isolated from production data, with a sandbox flag on all API responses

**Given** the sandbox is active
**When** Dev sends orders to the sandbox's ingestion endpoint
**Then** orders flow through the full pipeline (API → database → event bus → WebSocket) identically to production, including webhook delivery to registered sandbox URLs — allowing end-to-end integration testing

**Given** the sandbox environment
**When** Dev runs tests
**Then** sandbox data is automatically cleaned up after 7 days of inactivity, rate limits are relaxed (higher limits than production), and sandbox API responses include an `X-FoodTech-Environment: sandbox` header

**Given** Dev wants to trigger specific scenarios
**When** she uses the demo simulator API (`POST /api/v1/simulator/start`) within the sandbox
**Then** realistic order patterns generate events that exercise her webhook subscriptions — allowing her to test event handling without manually creating orders

## Tasks / Subtasks

### Task 1: Sandbox Provisioning API (AC: create sandbox tenant)

- [ ] Create `backend/src/integrations/sandbox/sandbox.module.ts`
- [ ] POST `/api/v1/integrations/sandbox` — provision sandbox tenant
- [ ] Create tenant with `is_sandbox: true` flag, sample data (3 stations, 4 stages, 20 menu items, inventory)
- [ ] Generate sandbox API credentials (key + secret)
- [ ] Return sandbox tenant details, credentials, and ingestion endpoint URL

### Task 2: Sandbox Isolation (AC: production isolation)

- [ ] Add `is_sandbox` boolean to `locations` table
- [ ] Sandbox tenants use same database but are flagged — queries can exclude them from production reports
- [ ] Add `X-FoodTech-Environment: sandbox` header to all API responses for sandbox tenants
- [ ] Implement via NestJS interceptor checking tenant's sandbox flag

### Task 3: Relaxed Rate Limits (AC: higher limits for testing)

- [ ] Configure per-tenant rate limits based on sandbox flag
- [ ] Sandbox tenants get 10x production rate limits
- [ ] Use existing @nestjs/throttler configuration with dynamic limits

### Task 4: Auto-Cleanup Scheduler (AC: 7-day inactivity cleanup)

- [ ] Create `backend/src/integrations/sandbox/sandbox-cleanup.service.ts`
- [ ] Track last activity timestamp per sandbox tenant
- [ ] Scheduled job (daily): delete sandbox tenants with >7 days inactivity
- [ ] Delete all associated data (orders, inventory, subscriptions) in cascade

### Task 5: Simulator Integration (AC: use simulator in sandbox)

- [ ] Verify demo simulator (Story 6.4) works within sandbox tenants
- [ ] Simulated orders trigger webhook deliveries to sandbox webhook URLs
- [ ] No additional code needed if simulator uses standard order API

### Task 6: Write Tests (AC: all)

- [ ] Unit tests for sandbox provisioning (sample data creation, credentials)
- [ ] Unit tests for cleanup scheduler (inactivity detection, cascade delete)
- [ ] Integration test: provision sandbox → submit order → verify full pipeline → webhook delivered
- [ ] Test sandbox header presence on all responses

## Dev Notes

- Sandbox uses the REAL backend pipeline — not a separate environment
- Sandbox tenants are marked with `is_sandbox: true` on the locations table
- Rate limits are dynamically configured per tenant (sandbox vs production)
- Cleanup scheduler runs as a NestJS cron job (@nestjs/schedule)

### Project Structure Notes

- `backend/src/integrations/sandbox/` — module, service, cleanup scheduler
- `backend/src/common/interceptors/sandbox-header.interceptor.ts` — adds environment header

### References

- [Source: epics.md#Story 7.2]
- [Source: prd.md#FR51]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
