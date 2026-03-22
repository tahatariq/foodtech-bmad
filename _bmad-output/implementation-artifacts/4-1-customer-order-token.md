# Story 4.1: Customer Order Token & Tracking Link Generation

Status: ready-for-dev

## Story

As a **system (on behalf of Priya)**,
I want to generate a unique tracking token and URL when an order is created,
so that customers can track their order without creating an account or installing an app.

## Acceptance Criteria (BDD)

**Given** a new order is created via POST `/api/v1/orders`
**When** the order is persisted successfully
**Then** the system generates a unique, cryptographically random token (>=32 characters), creates a tracking URL in the format `/track/:token`, stores the token in the `orders` table with a 24-hour expiry timestamp, and returns the tracking URL in the order response body

**Given** the restaurant has QR code generation enabled
**When** the tracking URL is generated
**Then** a QR code image is generated server-side (PNG, 200x200px minimum) and available at `/api/v1/orders/:orderId/qr` for receipt printing

**Given** a tracking token has expired (>24 hours)
**When** a customer visits the tracking URL
**Then** the system returns a friendly error page: "This link has expired" with no order details revealed -- no auth bypass possible

## Tasks / Subtasks

### AC1: Token Generation on Order Creation

- [ ] Add `tracking_token` (VARCHAR 64, unique, indexed) and `tracking_token_expires_at` (TIMESTAMP) columns to `orders` table migration
- [ ] Create a `generateTrackingToken()` utility function using `crypto.randomBytes(32).toString('hex')` to produce a 64-character hex token
- [ ] Modify the `orders.service.ts` `create()` method to:
  - [ ] Generate the tracking token on successful order persistence
  - [ ] Set `tracking_token_expires_at` to `now + 24 hours`
  - [ ] Include `trackingUrl` field in the create order response DTO
- [ ] Update `create-order.dto.ts` response type to include `trackingUrl: string`
- [ ] Write unit tests for token generation (uniqueness, length, format)
- [ ] Write integration test: POST `/api/v1/orders` returns `trackingUrl` in response body

### AC2: QR Code Generation Endpoint

- [ ] Install `qrcode` npm package (server-side QR generation)
- [ ] Add `qr_enabled` boolean column to tenant/restaurant settings (default: true)
- [ ] Create `GET /api/v1/orders/:orderId/qr` endpoint in `orders.controller.ts`
  - [ ] Check tenant setting for QR code generation enabled
  - [ ] Generate QR code PNG from tracking URL (minimum 200x200px)
  - [ ] Return PNG image with `Content-Type: image/png`
  - [ ] Return 404 if QR generation is disabled for the restaurant
- [ ] Add JWT auth guard (staff role required) to QR endpoint -- receipt printing is a staff action
- [ ] Write unit test: QR code contains correct tracking URL
- [ ] Write unit test: 404 returned when QR generation is disabled
- [ ] Write integration test: GET `/api/v1/orders/:orderId/qr` returns valid PNG

### AC3: Token Expiry and Friendly Error Page

- [ ] Create `customer-tracker.controller.ts` GET `/api/v1/track/:token` endpoint
  - [ ] Look up order by `tracking_token`
  - [ ] Check `tracking_token_expires_at` against current time
  - [ ] If expired or not found: return a lightweight HTML error page with "This link has expired" message
  - [ ] If valid: return order tracking data (current stage, ETA, order ID)
- [ ] Ensure no order details leak in the expired/not-found response (no order ID, no items, no customer info)
- [ ] Write unit test: expired token returns friendly error, no data leakage
- [ ] Write unit test: non-existent token returns same friendly error (no enumeration)
- [ ] Write unit test: valid token returns order tracking data
- [ ] Write integration test: full lifecycle -- create order, get token, access tracker, wait for expiry, verify error

## Dev Notes

### Architecture References

- Backend module: `backend/src/modules/customer-tracker/` (FR24-FR27)
- Order module: `backend/src/modules/orders/` (FR1-FR10)
- API boundary: `/api/v1/track/:token` -- token-based auth, no login required
- The customer tracker endpoint is a separate API boundary from the main restaurant API -- no JWT required, token IS the auth

### Technical Stack

- **Runtime:** Node.js with NestJS framework
- **Language:** TypeScript
- **Database:** PostgreSQL with row-level tenant scoping
- **QR Generation:** `qrcode` npm package (server-side PNG rendering)
- **Token Generation:** Node.js `crypto.randomBytes()` -- cryptographically secure
- **Validation:** Zod (via `zod-validation.pipe.ts`)

### File Structure

```
backend/src/modules/
├── orders/
│   ├── orders.service.ts          # Modify: add token generation to create()
│   ├── orders.controller.ts       # Add: GET /orders/:orderId/qr endpoint
│   ├── dto/
│   │   └── create-order.dto.ts    # Modify: add trackingUrl to response
│   └── entities/
│       └── order.schema.ts        # Modify: add tracking_token fields
├── customer-tracker/
│   ├── customer-tracker.module.ts
│   ├── customer-tracker.controller.ts  # Create: GET /track/:token endpoint
│   └── customer-tracker.service.ts     # Create: token lookup, expiry check
```

### Testing Requirements

- **Unit tests:** Token generation utility, QR code generation, token expiry logic, error page content (no data leakage)
- **Integration tests:** Full order creation with token in response, QR endpoint returns valid PNG, token lifecycle (valid -> expired)
- **Security tests:** Expired tokens reveal no data, invalid tokens return same response as expired (no enumeration), no auth bypass possible

### Dependencies

- **Upstream:** Epics 1 + 2 + 3 must be complete (order lifecycle, kitchen status, service tempo)
- **Downstream:** Story 4.2 (Customer Tracker Status Page) depends on this story for token generation and the `/api/v1/track/:token` endpoint
- **NPM:** `qrcode` package for server-side QR code generation

### References

- Architecture: API Boundaries table (line 1051-1061 of architecture.md)
- UX: Journey 3 -- Priya QR-to-Status flow (lines 800-841 of ux-design-specification.md)
- Epics: Story 4.1 acceptance criteria (lines 908-927 of epics.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
