# Story 4.2: Customer Tracker -- Real-Time Status Page

Status: review

## Story

As **Priya (customer)**,
I want to see my order's current status, progress through stages, and estimated time to ready on a single mobile-optimized page,
so that I know exactly when to pick up my food without asking anyone.

## Acceptance Criteria (BDD)

**Given** Priya scans the QR code and opens the tracking URL
**When** the token is valid and the order exists
**Then** the page loads in under 2 seconds, displays the CustomerProgressSteps component (4 steps: Received -> Preparing -> Plating -> Ready), current stage label, and estimated time to ready -- all visible without scrolling on a 375px-wide viewport

**Given** the Customer Tracker page is loaded
**When** rendered
**Then** the CustomerProgressSteps component displays with `role="progressbar"`, `aria-label="Order progress: [current stage] of 4 stages"`, `aria-valuenow=[step number]`, `aria-valuemax=4`, per-step states: `done` (green, checkmark), `active` (blue, pulsing softly), `pending` (gray, number)

**Given** Priya is viewing the Customer Tracker
**When** the order stage changes on the backend (e.g., Preparing -> Plating)
**Then** the progress step advances with a smooth animation, the stage label updates, and the ETA recalculates -- delivered via WebSocket `order.stage.changed` event, no page refresh required

**Given** the order reaches the "Ready" stage
**When** the Customer Tracker updates
**Then** a celebration micro-animation plays, the status shows "Ready! Pick up at counter", and the ETA is replaced with "NOW"

**Given** the Customer Tracker page
**When** rendered on any mobile device
**Then** max-width is 480px, system fonts are used as fallback, no tracking cookies are set (token is in URL only), and the page works in any modern mobile browser (Chrome, Safari, Firefox)

## Tasks / Subtasks

### AC1: Customer Tracker Page Load and Initial Render

- [ ] Create `CustomerTracker.tsx` view component at `frontend/src/views/customer/`
- [ ] Implement route `/track/:token` in `router.tsx` -- this route must NOT require JWT auth
- [ ] On mount, call `GET /api/v1/track/:token` to fetch initial order state
- [ ] Render CustomerProgressSteps component with initial stage data
- [ ] Display current stage label prominently (e.g., "Preparing your order")
- [ ] Display estimated time to ready below the progress steps
- [ ] Ensure all content is above the fold on a 375px-wide viewport (no scroll needed)
- [ ] Performance budget: page load under 2 seconds (lazy-load this route, minimal bundle)
- [ ] Write unit test: component renders all 4 stages with correct initial state
- [ ] Write unit test: expired/invalid token shows error page (not tracker)

### AC2: CustomerProgressSteps Component with Accessibility

- [ ] Create `CustomerProgressSteps.tsx` component at `frontend/src/components/CustomerProgressSteps/`
- [ ] Implement 4-step horizontal progress bar: Received -> Preparing -> Plating -> Ready
- [ ] Props: `currentStep: 1 | 2 | 3 | 4`, `stages: string[]`
- [ ] Render per-step states:
  - [ ] `done`: green background, checkmark icon, completed label
  - [ ] `active`: blue background, soft pulsing animation (CSS `@keyframes`), current label
  - [ ] `pending`: gray background, step number, upcoming label
- [ ] Connector lines between steps: solid green for completed, dashed gray for upcoming
- [ ] Add ARIA attributes: `role="progressbar"`, `aria-label="Order progress: [current stage] of 4 stages"`, `aria-valuenow=[step number]`, `aria-valuemax=4`
- [ ] Respect `prefers-reduced-motion` media query -- disable pulsing animation
- [ ] Write unit test: correct ARIA attributes for each step state
- [ ] Write unit test: step transitions render correct visual states
- [ ] Write accessibility test: screen reader announces progress correctly

### AC3: Real-Time Stage Updates via WebSocket

- [ ] Establish WebSocket connection on page mount using order token (not JWT)
- [ ] Subscribe to WebSocket room `customer:{orderId}` -- single order scope only
- [ ] Listen for `order.stage.changed` event
  - [ ] Update CustomerProgressSteps `currentStep` prop
  - [ ] Update stage label text
  - [ ] Trigger smooth CSS transition animation on step change
- [ ] Listen for `order.eta.updated` event
  - [ ] Update displayed ETA value
- [ ] Ensure no cross-order data is accessible (token scopes to single order)
- [ ] Write unit test: WebSocket event updates component state correctly
- [ ] Write unit test: stage transition triggers animation class

### AC4: Ready State Celebration

- [ ] When `currentStep` reaches 4 (Ready):
  - [ ] Play celebration micro-animation (confetti burst or checkmark scale-up, CSS-only)
  - [ ] Update status text to "Ready! Pick up at counter"
  - [ ] Replace ETA display with "NOW" in green
  - [ ] Respect `prefers-reduced-motion` -- skip animation, still show "NOW" text
- [ ] Write unit test: Ready state shows correct text and hides ETA
- [ ] Write visual regression test: celebration animation renders correctly

### AC5: Mobile Optimization and Privacy

- [ ] Set `max-width: 480px` on tracker container, centered horizontally
- [ ] Use `font-family: system-ui, -apple-system, sans-serif` (system fonts, no web font downloads)
- [ ] Verify no tracking cookies are set -- token is URL-only, no `document.cookie` writes
- [ ] No localStorage or sessionStorage usage for tracking data
- [ ] Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to tracker HTML
- [ ] Test on Chrome (Android), Safari (iOS), Firefox (Android) -- minimum modern browser support
- [ ] Write unit test: no cookies set during render lifecycle
- [ ] Write E2E test: page renders correctly on 375px viewport

## Dev Notes

### Architecture References

- Frontend view: `frontend/src/views/customer/CustomerTracker.tsx`
- Component: `frontend/src/components/CustomerProgressSteps/CustomerProgressSteps.tsx`
- Backend endpoint: `GET /api/v1/track/:token` (from Story 4.1)
- WebSocket room: `customer:{orderId}` -- token-scoped, single order only
- WebSocket gateway: `backend/src/modules/customer-tracker/customer-tracker.gateway.ts`
- API boundary: Customer Tracker uses token-based auth, NOT JWT -- entirely separate from restaurant API auth

### Technical Stack

- **Frontend:** React with Vite, TypeScript
- **Styling:** Tailwind CSS v4.2 with mobile-tokens.css design tokens
- **Components:** Radix UI v1.4.3 (for accessible primitives where applicable)
- **WebSocket:** Socket.io client
- **Animation:** CSS `@keyframes` with `prefers-reduced-motion` support
- **Bundling:** Vite code-splitting -- lazy-load the customer tracker route for minimal bundle

### File Structure

```
frontend/src/
├── views/
│   └── customer/
│       ├── CustomerTracker.tsx        # Main tracker page view
│       ├── CustomerTracker.test.tsx   # Unit tests
│       └── index.ts
├── components/
│   └── CustomerProgressSteps/
│       ├── CustomerProgressSteps.tsx       # 4-step progress bar
│       ├── CustomerProgressSteps.test.tsx  # Unit + accessibility tests
│       └── index.ts
├── router.tsx                         # Add /track/:token route (no auth)
└── api/
    └── tracking.api.ts                # GET /api/v1/track/:token client
```

### Testing Requirements

- **Unit tests:** CustomerProgressSteps renders all step states, ARIA attributes correct, stage transitions, Ready celebration state
- **Accessibility tests:** Screen reader announces progress, ARIA progressbar semantics, reduced-motion compliance
- **E2E tests:** Full QR scan -> tracker load -> real-time update flow (`frontend/e2e/customer-tracker.e2e.ts`)
- **Performance tests:** Page loads under 2 seconds on simulated 3G, bundle size check
- **Privacy tests:** No cookies set, no localStorage writes, no tracking scripts

### Dependencies

- **Upstream:** Story 4.1 (token generation and `/api/v1/track/:token` endpoint must exist)
- **Downstream:** Story 4.3 (ETA push notifications build on this page's WebSocket connection)
- **Epics 1+2+3:** Order lifecycle, kitchen status, and service tempo must be complete for meaningful stage data

### References

- Architecture: CustomerProgressSteps component spec (lines 938-941 of architecture.md)
- UX: Component spec #6 CustomerProgressSteps (lines 1057-1066 of ux-design-specification.md)
- UX: Journey 3 -- Priya QR-to-Status (lines 800-841 of ux-design-specification.md)
- Epics: Story 4.2 acceptance criteria (lines 928-955 of epics.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
