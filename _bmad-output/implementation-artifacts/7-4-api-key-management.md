# Story 7.4: API Key Management & Webhook Security

Status: ready-for-dev

## Story

As **Dev (POS integration developer) or Alex (admin)**,
I want to manage API keys and webhook signing secrets securely,
So that integrations are authenticated and webhook payloads are tamper-proof.

## Acceptance Criteria (BDD)

**Given** Dev or Alex needs to create API credentials
**When** they call POST `/api/v1/integrations/api-keys` (or use the Admin Console wizard)
**Then** the system generates an API key (public identifier) and HMAC secret (private signing key), returns both once (the secret is never retrievable again), and stores a hashed version of the secret — per the architecture's API key + HMAC auth pattern

**Given** an external system sends a request to FoodTech
**When** the request is authenticated
**Then** the API key identifies the tenant, the request body is verified against the `X-FoodTech-Signature` HMAC-SHA256 header using the stored secret hash, and invalid signatures receive a 401 with RFC 7807 error body

**Given** an admin wants to rotate or revoke keys
**When** they call DELETE `/api/v1/integrations/api-keys/:keyId` or POST `/api/v1/integrations/api-keys/:keyId/rotate`
**Then** revocation is immediate (existing key stops working), rotation generates a new key pair and returns it, and the old key enters a 24-hour grace period before full revocation (configurable) — allowing zero-downtime key rotation

**Given** rate limiting is applied
**When** an API consumer exceeds their per-tenant, per-endpoint rate limit
**Then** the system returns 429 with `Retry-After` header and RFC 7807 error body, with Enterprise tier receiving higher limits than Growth/Indie per the subscription tier configuration

## Tasks / Subtasks

### Task 1: API Key CRUD Endpoints (AC: key management)

- [ ] POST `/api/v1/integrations/api-keys` — generate key + secret pair, return both once
- [ ] GET `/api/v1/integrations/api-keys` — list active keys (key prefix only, no secrets)
- [ ] DELETE `/api/v1/integrations/api-keys/:keyId` — immediate revocation
- [ ] POST `/api/v1/integrations/api-keys/:keyId/rotate` — generate new pair, old enters grace period
- [ ] Add `@Roles('system_admin', 'location_manager')` guard

### Task 2: HMAC Authentication Guard (AC: request verification)

- [ ] Create `backend/src/common/guards/hmac-auth.guard.ts`
- [ ] Extract API key from request header (`X-FoodTech-Key`)
- [ ] Look up tenant by API key hash
- [ ] Compute HMAC-SHA256 of request body using stored secret
- [ ] Compare against `X-FoodTech-Signature` header
- [ ] On mismatch: return 401 with RFC 7807 error body
- [ ] On match: populate `request.tenant` with tenant context

### Task 3: Key Rotation with Grace Period (AC: zero-downtime rotation)

- [ ] On rotation: generate new key pair, mark old key with `grace_period_until` (now + 24h)
- [ ] During grace period: both old and new keys are valid
- [ ] After grace period: old key becomes fully revoked (scheduled cleanup)
- [ ] Grace period duration configurable via environment variable
- [ ] Create NestJS cron job to clean up expired grace-period keys

### Task 4: Per-Tier Rate Limiting (AC: tiered rate limits)

- [ ] Configure @nestjs/throttler with per-tenant, per-endpoint limits
- [ ] Tier-based limits: Indie (100 req/min), Growth (500 req/min), Enterprise (2000 req/min)
- [ ] Return 429 with `Retry-After` header and RFC 7807 body on limit exceeded
- [ ] Rate limit values configurable via environment variables

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for HMAC auth guard (valid signature, invalid, missing)
- [ ] Unit tests for key rotation (grace period, expiration)
- [ ] Integration test: generate key → authenticate request → verify signature
- [ ] Test rate limiting per tier (Indie hits limit before Enterprise)
- [ ] Test key revocation (immediate, requests fail after revoke)

## Dev Notes

- API key format: `ft_key_` + 32-char hex (public), 64-char hex secret (private)
- Secret stored as SHA-256 hash — raw secret never persisted
- HMAC-SHA256 for request signing — industry standard for webhook verification
- Grace period enables zero-downtime key rotation for production integrations
- Rate limits are per-tenant, per-endpoint — not global

### Project Structure Notes

- `backend/src/integrations/api-keys/` — key management module
- `backend/src/common/guards/hmac-auth.guard.ts` — HMAC authentication guard
- `backend/src/common/interceptors/rate-limit.interceptor.ts` — tier-aware rate limiting

### References

- [Source: epics.md#Story 7.4]
- [Source: architecture.md#Authentication & Security]
- [Source: prd.md#FR53]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
