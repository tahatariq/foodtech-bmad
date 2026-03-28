# Story 6.3: API Credential Generation for POS Integration

Status: review

## Story

As **Alex (system admin)**,
I want to generate API credentials for restaurant POS integrations during onboarding,
So that POS vendors can connect to FoodTech's order ingestion API.

## Acceptance Criteria (BDD)

**Given** Alex reaches step 7 (POS Integration) in the wizard
**When** he clicks "Generate API Credentials"
**Then** the system creates a new API key + HMAC secret pair via POST `/api/v1/admin/tenants/:tenantId/api-keys`, displays both values with a "Copy" button, and shows a warning that the secret will not be shown again after leaving this page

**Given** the API credentials are generated
**When** displayed
**Then** the page also shows the webhook URL for the tenant's order ingestion endpoint (`/api/v1/ingest/orders`) and a link to the API documentation portal

**Given** an admin wants to revoke or rotate credentials
**When** they access the tenant settings after onboarding
**Then** they can revoke existing keys via DELETE `/api/v1/admin/tenants/:tenantId/api-keys/:keyId` and generate new ones — revocation is immediate

## Tasks / Subtasks

### Task 1: API Key Generation Service (AC: key + secret pair)

- [ ] Create `backend/src/admin/api-keys.service.ts`
- [ ] Generate API key: `ft_key_` prefix + 32-char random hex
- [ ] Generate HMAC secret: 64-char random hex
- [ ] Store hashed secret (SHA-256) in database — raw secret never stored
- [ ] Return both key and secret in response (one-time display)

### Task 2: API Key Endpoints (AC: CRUD)

- [ ] POST `/api/v1/admin/tenants/:tenantId/api-keys` — generate new key pair
- [ ] GET `/api/v1/admin/tenants/:tenantId/api-keys` — list keys (secret NOT included)
- [ ] DELETE `/api/v1/admin/tenants/:tenantId/api-keys/:keyId` — revoke immediately
- [ ] Add `@Roles('system_admin', 'location_manager')` guard

### Task 3: API Key Database Schema (AC: storage)

- [ ] Create `api_keys` table: `id` (UUID), `tenant_id` (FK), `key_prefix` (for display), `key_hash` (SHA-256), `secret_hash` (SHA-256), `is_active`, `created_at`, `revoked_at`
- [ ] Index on `key_hash` for lookup during authentication

### Task 4: Wizard Step UI (AC: display + copy)

- [ ] Create POS Integration wizard step component
- [ ] "Generate API Credentials" button → displays key + secret with Copy buttons
- [ ] Warning banner: "Save this secret now — it won't be shown again"
- [ ] Display webhook URL: `/api/v1/ingest/orders`
- [ ] Link to API documentation portal (`/api/docs`)

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for key generation (format, uniqueness)
- [ ] Unit tests for secret hashing (stored hash, never raw)
- [ ] Integration test: generate → list (no secret) → revoke → verify inactive
- [ ] UI test: copy button functionality, warning display

## Dev Notes

- Secret is displayed ONCE at generation — never retrievable again
- API key format: `ft_key_` + 32-char hex (easy to identify as FoodTech key)
- Revocation is immediate — active connections using revoked key fail on next request

### Project Structure Notes

- `backend/src/admin/api-keys.service.ts` — generation + hashing logic
- `backend/src/admin/api-keys.controller.ts` — CRUD endpoints
- `frontend/src/views/AdminConsole/OnboardingWizard/PosIntegrationStep/`

### References

- [Source: epics.md#Story 6.3]
- [Source: architecture.md#Authentication & Security]
- [Source: prd.md#FR46]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
