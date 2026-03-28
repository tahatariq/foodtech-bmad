# Story 4.4: Delivery Board -- Ready Queue & ETAs

Status: review

## Story

As **Jason (delivery partner)**,
I want to see a real-time queue of ready and upcoming orders with accurate ETAs on the Delivery Board,
so that I can time my arrivals perfectly and never wait at the restaurant.

## Acceptance Criteria (BDD)

**Given** Jason accesses the Delivery Board at `/delivery/:locationId`
**When** authenticated via location API key
**Then** the board displays a sorted list of orders: ready orders at top (green border + "Pick Up" button), then upcoming orders sorted by ETA ascending, each showing CountdownETA component with large minute number, "min" unit label, and current stage label

**Given** the CountdownETA component
**When** rendered on the Delivery Board
**Then** it displays a large number (minutes), "min" unit label, and stage label ("Plating", "Preparing"), with `role="timer"`, `aria-label="Estimated [X] minutes until ready"`, updates every 30 seconds from live kitchen state

**Given** the Delivery Board is displayed
**When** an order's stage changes on the backend
**Then** the order's position in the queue updates in real-time via WebSocket, the CountdownETA recalculates, and newly-ready orders animate to the top of the list -- ETA accuracy within +/-2 minutes per FR29

**Given** the Delivery Board
**When** displayed on a wall-mounted TV (32"-65") in display-only mode
**Then** the layout auto-scales for readability from 10+ feet away, no touch interaction required, large text and high-contrast colors, auto-refreshing via WebSocket

**Given** the Delivery Board on mobile
**When** Jason views it on his phone
**Then** the layout is glanceable and one-handed operable, with touch targets minimum 48x48dp, optimized for quick looks while driving (large ETAs, clear ready indicators)

## Tasks / Subtasks

### AC1: Delivery Board Page with Location API Key Auth

- [ ] Create `DeliveryBoard.tsx` view component at `frontend/src/views/delivery/`
- [ ] Implement route `/delivery/:locationId` in `router.tsx`
- [ ] Implement location API key auth flow:
  - [ ] Accept API key via query parameter or `X-API-Key` header
  - [ ] Backend: create `GET /api/v1/delivery/orders` endpoint in `delivery.controller.ts`
  - [ ] Backend: validate location API key in `api-key.strategy.ts`
  - [ ] Return tenant-scoped, read-only order list for the location
- [ ] Fetch initial order queue on page mount via REST
- [ ] Render sorted order list:
  - [ ] Ready orders at top with green border and "Pick Up" button
  - [ ] Upcoming orders sorted by ETA ascending (soonest-ready first)
  - [ ] Each order card shows: order ID/number, items summary, CountdownETA component, current stage label
- [ ] Write unit test: orders render in correct sort order (ready first, then by ETA)
- [ ] Write unit test: API key auth rejects invalid keys
- [ ] Write integration test: GET `/api/v1/delivery/orders` returns correctly sorted orders

### AC2: CountdownETA Component

- [ ] Create `CountdownETA.tsx` component at `frontend/src/components/CountdownETA/`
- [ ] Props: `minutes: number`, `stage: string`, `variant: 'large' | 'compact'`, `state: 'ready' | 'soon' | 'waiting'`
- [ ] Render layout:
  - [ ] Large number displaying minutes (28px for `large` variant, 16px for `compact`)
  - [ ] "min" unit label adjacent to number
  - [ ] Stage label below (e.g., "Plating", "Preparing")
- [ ] State-driven styling:
  - [ ] `ready`: green background/text, displays "NOW" instead of number
  - [ ] `soon` (< 3 min): amber background/text
  - [ ] `waiting` (> 3 min): white/gray default styling
- [ ] ARIA attributes: `role="timer"`, `aria-label="Estimated [X] minutes until ready"`, `aria-live="polite"` for live region updates
- [ ] Update displayed value every 30 seconds (client-side countdown between server updates)
- [ ] Write unit test: correct rendering for each state (`ready`, `soon`, `waiting`)
- [ ] Write unit test: ARIA attributes present and correct
- [ ] Write unit test: variant sizing renders correctly (large vs compact)
- [ ] Write accessibility test: screen reader announces timer updates

### AC3: Real-Time Queue Updates via WebSocket

- [ ] Establish WebSocket connection in DeliveryBoard using location API key auth
- [ ] Subscribe to WebSocket room `delivery` within tenant namespace
- [ ] Listen for events:
  - [ ] `order.stage.changed` -- update order's stage and reposition in queue
  - [ ] `order.eta.updated` -- update CountdownETA component values
  - [ ] `order.created` -- add new delivery order to queue
  - [ ] `order.picked_up` -- remove order from queue (from Story 4.5)
- [ ] Implement `delivery.gateway.ts` WebSocket gateway:
  - [ ] Auth: validate location API key on connection
  - [ ] Join client to `delivery` room
  - [ ] Emit relevant order events scoped to the location
- [ ] Animate queue reordering:
  - [ ] Newly-ready orders slide to top of list with CSS transition
  - [ ] Use `layout` animation for smooth reordering (CSS `transition` on `transform`)
- [ ] ETA accuracy target: within +/-2 minutes per FR29
- [ ] Write unit test: WebSocket event triggers correct queue reorder
- [ ] Write unit test: newly-ready order animates to top position
- [ ] Write integration test: backend stage change propagates to delivery board

### AC4: Wall-Mounted TV Display Mode

- [ ] Detect display-only mode via query parameter `?mode=display` or viewport width > 1200px
- [ ] TV display mode layout:
  - [ ] Large text sizing: order numbers 48px+, ETAs 64px+, stage labels 32px+
  - [ ] High-contrast colors: dark background with bright text (kitchen-tokens.css context)
  - [ ] No interactive elements visible (hide "Pick Up" buttons, no cursor)
  - [ ] Multi-column grid layout to show more orders simultaneously
- [ ] Auto-refreshing: WebSocket keeps board updated, no user interaction needed
- [ ] Readability: legible from 10+ feet away (minimum 32px text for all content)
- [ ] No screensaver/sleep: add `<meta>` tags and wake lock API where supported
- [ ] Write unit test: display mode hides interactive elements
- [ ] Write unit test: text sizes meet minimum for TV display
- [ ] Write visual test: layout renders correctly at 1920x1080 resolution

### AC5: Mobile-Optimized Delivery Board

- [ ] Responsive layout for mobile viewport (< 768px):
  - [ ] Single-column card stack
  - [ ] Large ETAs (easily glanceable while driving)
  - [ ] Touch targets minimum 48x48dp for all interactive elements
  - [ ] "Pick Up" button full-width on mobile cards
- [ ] Clear ready indicators: green background pulse for ready orders, large "READY" badge
- [ ] Optimized for one-handed operation: primary actions reachable in thumb zone
- [ ] Write unit test: touch targets meet 48x48dp minimum
- [ ] Write E2E test: mobile viewport renders correctly at 375px width

## Dev Notes

### Architecture References

- Backend module: `backend/src/modules/delivery/` (FR28-FR31)
- Frontend view: `frontend/src/views/delivery/DeliveryBoard.tsx`
- Component: `frontend/src/components/CountdownETA/CountdownETA.tsx`
- API boundary: `/api/v1/delivery/*` -- location API key auth, tenant-scoped, read-only
- WebSocket room: `delivery` within tenant namespace `/tenant-{id}`
- WebSocket gateway: `backend/src/modules/delivery/delivery.gateway.ts`

### Technical Stack

- **Frontend:** React with Vite, TypeScript
- **Styling:** Tailwind CSS v4.2 with kitchen-tokens.css (TV mode) and mobile-tokens.css (phone mode)
- **Components:** Radix UI v1.4.3 for accessible primitives
- **WebSocket:** Socket.io client with location API key auth
- **Animation:** CSS transitions for queue reordering, `@keyframes` for ready-state pulse
- **Wake Lock:** Web Wake Lock API for TV display mode (prevent screen sleep)

### File Structure

```
backend/src/modules/
├── delivery/
│   ├── delivery.module.ts
│   ├── delivery.controller.ts         # GET /api/v1/delivery/orders
│   ├── delivery.service.ts            # Order queue logic, ETA integration
│   ├── delivery.gateway.ts            # WebSocket: delivery room events
│   └── delivery.service.test.ts
frontend/src/
├── views/
│   └── delivery/
│       ├── DeliveryBoard.tsx           # Main delivery board view
│       ├── DeliveryBoard.test.tsx      # Unit tests
│       └── index.ts
├── components/
│   └── CountdownETA/
│       ├── CountdownETA.tsx            # Countdown timer component
│       ├── CountdownETA.test.tsx       # Unit + accessibility tests
│       └── index.ts
├── router.tsx                          # Add /delivery/:locationId route
```

### Testing Requirements

- **Unit tests:** CountdownETA states/variants/ARIA, queue sorting logic, display mode detection, mobile touch target sizes
- **Accessibility tests:** Timer `role="timer"` semantics, `aria-live` region updates, high-contrast mode compliance
- **Integration tests:** Full pipeline -- order stage change triggers queue reorder on delivery board
- **E2E tests:** Delivery board loads with sorted queue, real-time updates work
- **Visual tests:** TV display mode at 1920x1080, mobile at 375px width
- **Performance tests:** ETA accuracy within +/-2 minutes (FR29)

### Dependencies

- **Upstream:** Epics 1+2+3 must be complete; Story 4.1 (order creation with tracking data)
- **Downstream:** Story 4.5 (pickup confirmation) adds the "Pick Up" button action logic
- **Cross-module:** Tempo module provides ETA data; Orders module provides stage transitions
- **Auth:** Location API key strategy must exist in `backend/src/modules/auth/strategies/api-key.strategy.ts`

### References

- Architecture: delivery module file structure (lines 843-848 of architecture.md)
- Architecture: CountdownETA component (lines 942-945 of architecture.md)
- UX: Component spec #7 CountdownETA (lines 1067-1076 of ux-design-specification.md)
- UX: Journey 4 -- Jason Delivery Pickup Optimization (lines 842-878 of ux-design-specification.md)
- Epics: Story 4.4 acceptance criteria (lines 980-1006 of epics.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
