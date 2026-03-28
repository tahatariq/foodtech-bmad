# Story 7.1: Webhook Subscription & Event Delivery

Status: review

## Story

As **Dev (POS integration developer)**,
I want to subscribe to order status webhooks so my POS system receives real-time events when orders progress,
So that I can keep my system synchronized with FoodTech without polling.

## Acceptance Criteria (BDD)

**Given** Dev has valid API credentials for a tenant
**When** she creates a webhook subscription via POST `/api/v1/integrations/webhooks` with `{ url: "https://pos.example.com/hooks", events: ["order.stage.changed", "order.completed", "inventory.86d"] }`
**Then** the subscription is created and stored in the `integrations` module, and subsequent matching events are POSTed to the registered URL as `FoodTechEvent<T>` payloads with `Content-Type: application/json`

**Given** a webhook delivery fails (non-2xx response or timeout)
**When** the system processes the failure
**Then** it retries 3 times with exponential backoff (1s, 4s, 16s), and after 3 failures the event is moved to a dead-letter queue for manual review — per the architecture's webhook delivery pattern

**Given** a webhook is delivered
**When** the payload is sent
**Then** the request includes an `X-FoodTech-Signature` header containing an HMAC-SHA256 signature of the request body using the tenant's webhook secret, allowing the receiver to verify authenticity

**Given** Dev wants to manage subscriptions
**When** she calls GET `/api/v1/integrations/webhooks`
**Then** all active subscriptions are listed with their event filters, creation date, and delivery stats (success rate, last delivery timestamp)

## Tasks / Subtasks

### Task 1: Webhook Subscription Schema & CRUD (AC: subscription management)

- [ ] Create Drizzle schema: `webhook_subscriptions` table: `id` (UUID), `tenant_id`, `url`, `events` (JSONB array), `secret` (hashed), `is_active`, `created_at`, `delivery_count`, `last_delivery_at`, `success_rate`
- [ ] POST `/api/v1/integrations/webhooks` — create subscription, generate per-subscription secret
- [ ] GET `/api/v1/integrations/webhooks` — list active subscriptions with delivery stats
- [ ] DELETE `/api/v1/integrations/webhooks/:id` — deactivate subscription
- [ ] PATCH `/api/v1/integrations/webhooks/:id` — update URL or event filters

### Task 2: Webhook Delivery Engine (AC: event posting + HMAC)

- [ ] Create `backend/src/integrations/webhooks/webhook-delivery.service.ts`
- [ ] Subscribe to all emittable events via NestJS event bus
- [ ] On matching event: serialize as `FoodTechEvent<T>` JSON, compute HMAC-SHA256 signature, POST to subscription URL
- [ ] Include `X-FoodTech-Signature` header, `Content-Type: application/json`
- [ ] Set 10-second timeout per delivery attempt

### Task 3: Retry & Dead-Letter Queue (AC: 3x exponential backoff)

- [ ] On non-2xx or timeout: schedule retry with exponential backoff (1s, 4s, 16s)
- [ ] Use Redis-backed queue (Bull or custom) for retry scheduling
- [ ] After 3 failures: move event to `webhook_dead_letter` table with full payload, error details, subscription ID
- [ ] GET `/api/v1/integrations/webhooks/dead-letter` — admin view of failed deliveries
- [ ] POST `/api/v1/integrations/webhooks/dead-letter/:id/retry` — manual retry

### Task 4: Delivery Stats Tracking (AC: success rate)

- [ ] Track per-subscription: total deliveries, successful deliveries, last delivery timestamp
- [ ] Calculate success rate: successful / total
- [ ] Update stats on each delivery attempt (success or final failure)

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for webhook delivery (HMAC signing, payload format)
- [ ] Unit tests for retry logic (exponential backoff timing, DLQ after 3 failures)
- [ ] Integration test: create subscription → trigger event → verify POST to URL with signature
- [ ] Test event filtering (subscription only receives subscribed events)

## Dev Notes

- Webhook delivery is async — don't block the main event pipeline
- HMAC-SHA256 signing uses per-subscription secret (not tenant-wide)
- Dead-letter queue enables manual review and retry of failed deliveries
- Redis-backed queue (Bull/BullMQ) for reliable retry scheduling

### Project Structure Notes

- `backend/src/integrations/webhooks/` — module, service, controller, delivery engine
- `backend/src/integrations/webhooks/entities/` — Drizzle schemas (subscriptions, dead-letter)

### References

- [Source: epics.md#Story 7.1]
- [Source: architecture.md#Webhook delivery pattern]
- [Source: prd.md#FR50]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
