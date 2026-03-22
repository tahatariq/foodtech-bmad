# Story 4.3: Customer ETA & Status Push Notifications

Status: ready-for-dev

## Story

As **Priya (customer)**,
I want to receive real-time ETA updates and status change notifications while I'm on the tracker page,
so that I can do other things and still know exactly when my food will be ready.

## Acceptance Criteria (BDD)

**Given** Priya has the Customer Tracker open
**When** the WebSocket connection is established using the order token
**Then** the connection subscribes to `order.stage.changed` and `order.eta.updated` events for that specific order only -- no cross-order visibility

**Given** the kitchen state changes (e.g., station load shifts)
**When** the ETA is recalculated
**Then** the displayed ETA updates smoothly (no jarring jumps), with accuracy within +/-3 minutes of actual ready time as specified in FR27

**Given** the ETA display
**When** rendered at different stages
**Then** confidence levels are reflected: "Received" shows "~15 min" (low confidence), "Preparing" shows "~8 min" (medium confidence), "Plating" shows "~2 min" (high confidence), "Ready" shows "NOW" (certain)

**Given** the WebSocket connection drops (e.g., mobile network flicker)
**When** the connection is re-established
**Then** the page receives the current order state and updates immediately -- no stale data displayed

## Tasks / Subtasks

### AC1: WebSocket Connection Scoped to Single Order

- [ ] Implement WebSocket auth in `customer-tracker.gateway.ts` using order token (not JWT)
  - [ ] Validate token on connection handshake
  - [ ] Reject connection if token is expired or invalid
  - [ ] Extract `orderId` from token lookup
- [ ] Join the client to WebSocket room `customer:{orderId}` on successful auth
- [ ] Ensure the gateway ONLY emits events for the connected order -- no room enumeration, no cross-order data
- [ ] Backend: emit `order.stage.changed` event to `customer:{orderId}` room when order stage transitions
- [ ] Backend: emit `order.eta.updated` event to `customer:{orderId}` room when ETA is recalculated
- [ ] Frontend: create `useCustomerSocket` hook that connects using the order token
  - [ ] Subscribe to `order.stage.changed` and `order.eta.updated` events
  - [ ] Update tracker state on event receipt
- [ ] Write unit test: WebSocket rejects expired token
- [ ] Write unit test: WebSocket only joins the correct room
- [ ] Write integration test: stage change on backend triggers event on client

### AC2: Smooth ETA Updates with Accuracy Target

- [ ] Backend: implement ETA calculation in `customer-tracker.service.ts`
  - [ ] Calculate ETA based on current order stage, station load, and average preparation times
  - [ ] Target accuracy: within +/-3 minutes of actual ready time (FR27)
  - [ ] Emit `order.eta.updated` event whenever ETA changes by more than 30 seconds
- [ ] Frontend: implement smooth ETA transition in CustomerTracker view
  - [ ] Animate ETA number changes (count up/down smoothly, not jump)
  - [ ] Use CSS `transition` on the ETA text element
  - [ ] If ETA changes by more than 5 minutes, show a brief "Updated" indicator
- [ ] Write unit test: ETA calculation produces reasonable values per stage
- [ ] Write unit test: frontend smoothly transitions between ETA values

### AC3: Stage-Based Confidence Display

- [ ] Create ETA display component (or extend existing) with confidence levels:
  - [ ] Stage "Received" (step 1): display "~15 min" with low-confidence styling (lighter text, tilde prefix)
  - [ ] Stage "Preparing" (step 2): display "~8 min" with medium-confidence styling
  - [ ] Stage "Plating" (step 3): display "~2 min" with high-confidence styling (bolder text)
  - [ ] Stage "Ready" (step 4): display "NOW" with certain styling (green, bold)
- [ ] Confidence level affects text styling:
  - [ ] Low: `text-gray-500`, prefix with "~"
  - [ ] Medium: `text-gray-700`, prefix with "~"
  - [ ] High: `text-gray-900`, no prefix
  - [ ] Certain: `text-green-600 font-bold`
- [ ] Dynamic ETA values override defaults when available (e.g., "Preparing" might show "~6 min" based on actual kitchen load instead of default "~8 min")
- [ ] Write unit test: each stage renders correct confidence text and styling
- [ ] Write unit test: dynamic ETA overrides default stage values

### AC4: WebSocket Reconnection with State Sync

- [ ] Frontend: implement auto-reconnect logic in `useCustomerSocket` hook
  - [ ] Detect connection drop (Socket.io `disconnect` event)
  - [ ] Show `ConnectionIndicator` component in disconnected state
  - [ ] Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s)
- [ ] On reconnect:
  - [ ] Re-authenticate with order token
  - [ ] Rejoin `customer:{orderId}` room
  - [ ] Fetch current order state via REST `GET /api/v1/track/:token` as fallback
  - [ ] Reconcile: update all displayed data (stage, ETA) to match server state
  - [ ] Hide `ConnectionIndicator` once synced
- [ ] Backend: support `sync` event on reconnection that sends full current order state
- [ ] Write unit test: reconnection fetches current state and updates UI
- [ ] Write unit test: ConnectionIndicator shows/hides on disconnect/reconnect
- [ ] Write integration test: simulate disconnect, verify no stale data after reconnect

## Dev Notes

### Architecture References

- WebSocket gateway: `backend/src/modules/customer-tracker/customer-tracker.gateway.ts`
- Service: `backend/src/modules/customer-tracker/customer-tracker.service.ts`
- WebSocket room: `customer:{orderId}` within tenant namespace `/tenant-{id}`
- Events: `order.stage.changed`, `order.eta.updated`
- REST fallback: `GET /api/v1/track/:token` (from Story 4.1)
- ConnectionIndicator component: `frontend/src/components/ConnectionIndicator/`

### Technical Stack

- **WebSocket:** Socket.io (server + client) with Redis adapter for multi-node
- **Backend:** NestJS WebSocket gateway with custom token-based auth guard
- **Frontend:** React custom hook `useCustomerSocket` wrapping Socket.io client
- **ETA Calculation:** Server-side, based on order stage + station load + historical averages from tempo module
- **Reconnection:** Socket.io built-in reconnection with custom state sync on reconnect

### File Structure

```
backend/src/modules/
├── customer-tracker/
│   ├── customer-tracker.gateway.ts    # WebSocket gateway: token auth, room management
│   ├── customer-tracker.service.ts    # ETA calculation, state sync on reconnect
│   └── customer-tracker.service.test.ts
frontend/src/
├── views/
│   └── customer/
│       └── CustomerTracker.tsx        # Modify: integrate useCustomerSocket hook
├── components/
│   └── ConnectionIndicator/
│       └── ConnectionIndicator.tsx    # Show connection status
├── hooks/
│   └── useCustomerSocket.ts           # New: token-based WebSocket hook with reconnect
```

### Testing Requirements

- **Unit tests:** WebSocket token auth, room scoping, ETA calculation, confidence level display, reconnection state sync
- **Integration tests:** Full pipeline -- kitchen stage change triggers WebSocket event updates customer tracker
- **E2E tests:** Customer tracker WebSocket updates in real-time (part of `customer-tracker.e2e.ts`)
- **Security tests:** Cross-order isolation -- connecting with one token cannot see events from another order
- **Performance tests:** ETA accuracy tracking -- log predicted vs actual ready times

### Dependencies

- **Upstream:** Story 4.1 (token generation), Story 4.2 (tracker page and CustomerProgressSteps component)
- **Cross-module:** Tempo module (`backend/src/modules/tempo/`) provides station load data for ETA calculation
- **Epics 1+2+3:** Order lifecycle stage transitions and kitchen status events must be emitting correctly

### References

- Architecture: WebSocket namespace/room structure (line 1061 of architecture.md)
- Architecture: customer-tracker.gateway.ts (line 841 of architecture.md)
- UX: ETA accuracy design table (lines 870-878 of ux-design-specification.md)
- UX: Zero-friction requirements -- real-time updates (lines 831-841 of ux-design-specification.md)
- Epics: Story 4.3 acceptance criteria (lines 956-979 of epics.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
