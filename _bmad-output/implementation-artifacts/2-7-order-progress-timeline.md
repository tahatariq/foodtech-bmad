# Story 2.7: Order Progress Tracking & Timeline

Status: ready-for-dev

## Story

As a **kitchen user**,
I want to see mini-timeline progress bars and time tracking on each ticket,
so that I can identify which orders are aging and need attention.

## Acceptance Criteria (BDD)

**Given** a TicketCard displays an order
**When** the order has been in its current stage for some time
**Then** a mini-timeline progress bar shows elapsed time relative to the expected stage duration
**And** the elapsed time is displayed in human-readable format ("2m", "5m 30s")

**Given** configurable stage time thresholds
**When** a ticket exceeds the warning threshold (default 5 min in stage)
**Then** the AttentionWrapper transitions to "warning" state (1.0 opacity, amber glow, 2s pulse)

**When** a ticket exceeds the critical threshold (default 8 min in stage)
**Then** the AttentionWrapper transitions to "critical" state (1.0 opacity, red glow, 1s pulse)

**Given** an order with items containing 86'd ingredients
**When** displayed on the Station View
**Then** a Badge86 component ("86'd" red badge) appears inline next to the affected item name with `role="status"` and `aria-label="[item] is 86'd — unavailable"`

## Tasks / Subtasks

### Task 1: Create mini-timeline progress bar component (AC 1)
- [ ] Create `frontend/src/components/TicketCard/ProgressTimeline.tsx` (sub-component of TicketCard)
- [ ] Render a horizontal progress bar showing elapsed time relative to expected stage duration
- [ ] Progress bar fills from left to right: 0% at stage start, 100% at expected duration
- [ ] Color transitions: green (0–60% of expected time), amber (60–100%), red (100%+, bar overflows or changes to solid red)
- [ ] Display elapsed time in human-readable format next to bar: "2m", "5m 30s", "12m"
- [ ] Update elapsed time every second using `setInterval` or `requestAnimationFrame`
- [ ] Accept props: `stageEnteredAt: string (ISO 8601)`, `expectedDurationMinutes: number`, `warningThresholdMinutes: number`, `criticalThresholdMinutes: number`

### Task 2: Create elapsed time formatting utility (AC 1)
- [ ] Create `frontend/src/utils/formatTime.ts`
- [ ] Implement `formatElapsedTime(startTime: string): string` — returns "2m", "5m 30s", "1h 2m"
- [ ] Under 1 minute: show seconds ("45s")
- [ ] 1–59 minutes: show minutes and optional seconds ("5m", "5m 30s")
- [ ] 60+ minutes: show hours and minutes ("1h 2m")
- [ ] Write unit tests in `frontend/src/utils/formatTime.test.ts`

### Task 3: Integrate progress timeline into TicketCard (AC 1)
- [ ] Add `ProgressTimeline` sub-component to `TicketCard`
- [ ] Position between item list and BumpButton
- [ ] Read `stage_entered_at` timestamp from order item data (or compute from `updated_at`)
- [ ] Read expected stage duration from tenant configuration (fetched via API or cached)
- [ ] Pass threshold values to ProgressTimeline

### Task 4: Implement configurable stage time thresholds (AC 2, AC 3)
- [ ] Add `warning_threshold_minutes` (default 5) and `critical_threshold_minutes` (default 8) columns to `order_stages` table via Drizzle migration
- [ ] Update station configuration API to accept/return threshold values
- [ ] Create `backend/src/modules/stations/dto/update-stage-thresholds.dto.ts`
- [ ] Add `PATCH /api/v1/order-stages/:stageId` endpoint to update thresholds
- [ ] Frontend: fetch stage configuration with thresholds, cache via TanStack Query

### Task 5: Drive AttentionWrapper from elapsed time thresholds (AC 2, AC 3)
- [ ] Update `useAttention` hook to compute attention level from elapsed time vs configured thresholds
- [ ] Logic:
  - `elapsed < warningThreshold` → `healthy` (0–3 min) or `watching` (3–5 min)
  - `elapsed >= warningThreshold && elapsed < criticalThreshold` → `warning` (5–8 min)
  - `elapsed >= criticalThreshold` → `critical` (8+ min)
- [ ] AttentionWrapper applies:
  - `warning`: 1.0 opacity, amber glow, 2s pulse animation
  - `critical`: 1.0 opacity, red glow, 1s pulse animation
- [ ] Re-evaluate attention level on each elapsed time tick (every second)
- [ ] Threshold values sourced from stage configuration (not hardcoded)

### Task 6: Add stage_entered_at tracking to order items (AC 1)
- [ ] Add `stage_entered_at` (timestamp, UTC) column to `order_items` table via Drizzle migration
- [ ] Set `stage_entered_at` to current time when order is created (initial stage entry)
- [ ] Update `stage_entered_at` on each bump (stage advancement)
- [ ] Update `OrdersService.bumpOrder()` to set new `stage_entered_at` timestamp
- [ ] Include `stage_entered_at` in API responses and WebSocket events

### Task 7: Create Badge86 component (AC 4)
- [ ] Create `frontend/src/components/Badge86/Badge86.tsx`
- [ ] Render "86'd" text in red badge pill
- [ ] Variant `inline`: small badge, displayed next to item name on TicketCard
- [ ] Variant `board`: larger badge for 86 Board panel (future story)
- [ ] Set `role="status"` and `aria-label="[item name] is 86'd — unavailable"`
- [ ] Announced to screen readers via live region when status changes
- [ ] Style: red background (#EF4444), white text, rounded pill, small font
- [ ] Create `frontend/src/components/Badge86/index.ts` re-export
- [ ] Create `frontend/src/components/Badge86/Badge86.test.tsx`

### Task 8: Integrate Badge86 into TicketCard (AC 4)
- [ ] In TicketCard item list, check each item against 86'd inventory data
- [ ] If item is 86'd: render `Badge86` inline next to item name
- [ ] Subscribe to `inventory.86d` WebSocket events to update badge state in real-time
- [ ] When an item becomes 86'd, any ticket containing it immediately shows the badge

### Task 9: Write frontend tests (All ACs)
- [ ] Test ProgressTimeline renders correct fill percentage based on elapsed time
- [ ] Test elapsed time format: "2m", "5m 30s", "12m"
- [ ] Test progress bar color transitions at threshold boundaries
- [ ] Test AttentionWrapper transitions to warning at 5 min (default)
- [ ] Test AttentionWrapper transitions to critical at 8 min (default)
- [ ] Test Badge86 renders with correct ARIA attributes
- [ ] Test Badge86 appears inline next to 86'd item name
- [ ] Test configurable thresholds override defaults

### Task 10: Write backend tests (AC 2, AC 4)
- [ ] Test PATCH `/api/v1/order-stages/:stageId` updates thresholds
- [ ] Test `stage_entered_at` is set on order creation
- [ ] Test `stage_entered_at` updates on bump
- [ ] Test stage configuration includes threshold values in API response

## Dev Notes

### Architecture References
- Attention-driven UI: component visual state (opacity, pulse, glow) driven by data freshness and thresholds
- TicketCard attention states: healthy (0.7 opacity), watching (0.85), warning (amber glow, 2s pulse at 5+ min), critical (red glow, 1s pulse at 8+ min)
- Badge86: inline on ticket cards, not a separate navigation — Marco sees availability without leaving his queue
- `stage_entered_at` timestamp enables precise elapsed time tracking per stage
- Configurable thresholds allow different restaurants to tune attention levels

### Technical Stack
- Frontend: React 19, Tailwind CSS v4.2, CSS animations for pulse/glow
- Time tracking: `setInterval` (1s tick) for elapsed time updates, `Date.now()` diff from `stage_entered_at`
- Backend: NestJS 11.x, Drizzle ORM for migration
- Vitest + Jest for testing

### UX Component Specifications

**Badge86:**
- Purpose: Indicate an item is 86'd (unavailable) inline on ticket cards
- Content: "86'd" text label in red badge
- States: `active` (red badge, visible), `cleared` (removed when restocked)
- Variants: `inline` (small, on ticket card), `board` (larger, on 86 Board panel)
- Accessibility: `role="status"`, `aria-label="[Item name] is 86'd — unavailable"`, announced via live region

### File Structure
```
frontend/src/components/TicketCard/
├── TicketCard.tsx              # MODIFY — add ProgressTimeline, Badge86 integration
└── ProgressTimeline.tsx        # NEW — mini-timeline progress bar sub-component

frontend/src/components/Badge86/
├── Badge86.tsx                # NEW
├── Badge86.test.tsx           # NEW
└── index.ts                   # NEW

frontend/src/components/AttentionWrapper/
└── AttentionWrapper.tsx        # MODIFY — no changes needed if already threshold-driven

frontend/src/hooks/
└── useAttention.ts            # MODIFY — accept configurable thresholds from stage config

frontend/src/utils/
├── formatTime.ts              # NEW
└── formatTime.test.ts         # NEW

backend/src/database/schema/
└── orders.ts                  # MODIFY — add stage_entered_at, threshold columns

backend/src/database/migrations/
└── XXXX_add_stage_timestamps_thresholds.sql  # NEW

backend/src/modules/orders/
├── orders.service.ts          # MODIFY — set stage_entered_at on bump
└── orders.repository.ts       # MODIFY — include stage_entered_at in queries

backend/src/modules/stations/
├── stations.controller.ts     # MODIFY — add PATCH endpoint for thresholds
└── dto/
    └── update-stage-thresholds.dto.ts  # NEW
```

### Testing Requirements
- Frontend: Vitest + React Testing Library for component tests
- Test time formatting utility with edge cases (0s, 59s, 1m, 59m 59s, 1h)
- Test progress bar visual states at threshold boundaries
- Test Badge86 ARIA attributes and live region
- Backend: Jest for migration, service, and API tests
- Test co-location

### Dependencies
- Story 2.3 must be complete (TicketCard, AttentionWrapper, useAttention hook)
- Story 2.4 must be complete (bump updates stage, order lifecycle)
- Story 2.5 must be complete (real-time event propagation for inventory.86d events)
- Story 2.6 must be complete (offline resilience — Badge86 should work with cached data)

### References
- [Source: epics.md#Epic 2, Story 2.7]
- [Source: ux-design-specification.md#Custom Components — Badge86]
- [Source: ux-design-specification.md#Custom Components — AttentionWrapper]
- [Source: architecture.md#Frontend Architecture — Design tokens]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
