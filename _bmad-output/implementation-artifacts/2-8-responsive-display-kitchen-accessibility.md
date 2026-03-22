# Story 2.8: Responsive Display & Kitchen Accessibility

Status: ready-for-dev

## Story

As a **kitchen user on various devices**,
I want the Station View to work on 7" budget tablets through 65" TV displays,
so that the interface is usable regardless of hardware.

## Acceptance Criteria (BDD)

**Given** Station View is loaded on a 7" Android tablet (768x1024 portrait)
**When** rendered
**Then** ticket cards stack in a single column with 56dp+ bump buttons, 24px card padding, high-contrast dark theme, and no horizontal scrolling

**Given** Station View is accessed on a larger tablet or desktop
**When** rendered
**Then** the layout scales gracefully (wider cards, same single-column stack) without redesigning for desktop

**Given** a user with `prefers-reduced-motion` enabled
**When** attention-driven animations would normally play (pulse, glow)
**Then** animations are disabled and attention is communicated via border/background color changes only

**Given** a user activates `prefers-contrast: more` or enables high-contrast mode
**When** the view renders
**Then** background becomes #000000, status colors shift to high-contrast values (#00FF7F, #FFD700, #FF4444), borders become 2px solid

**And** all text meets 7:1 contrast ratio (AAA target for kitchen)
**And** all interactive elements are keyboard navigable (Tab through tickets, Enter/Space to bump, Escape to dismiss)
**And** screen readers announce ticket content and bump actions via ARIA labels and live regions
**And** font scaling to 200% does not break the layout

## Tasks / Subtasks

### Task 1: Implement responsive ticket card layout for 7" tablets (AC 1)
- [ ] Update `StationView.tsx` layout: single-column stack, full viewport width, portrait-optimized
- [ ] Set TicketCard padding to 24px
- [ ] Set BumpButton height to 56dp minimum
- [ ] Ensure no horizontal scrolling at 768px viewport width
- [ ] Use Tailwind CSS responsive utilities: `max-w-full`, `overflow-x-hidden`
- [ ] Test on 768x1024 viewport (7" tablet emulation)
- [ ] Apply dark theme background via KitchenTokenProvider CSS custom properties
- [ ] Set minimum font size for readability: order number 24px+, item text 16px+, elapsed time 14px+

### Task 2: Implement graceful scaling for larger displays (AC 2)
- [ ] Use CSS `max-width` on ticket card container (e.g., `max-w-2xl` or `max-w-3xl`) to prevent cards from stretching too wide on large screens
- [ ] Center the card column on wide viewports
- [ ] Cards get wider but maintain single-column stack — no multi-column layout
- [ ] On 65" TV displays: larger text, more padding, same layout structure
- [ ] Use Tailwind breakpoints for scaling: `sm:`, `md:`, `lg:`, `xl:` for font sizes and padding
- [ ] Test at 1920x1080 (TV) and 2560x1440 (large desktop)

### Task 3: Implement `prefers-reduced-motion` support (AC 3)
- [ ] In `AttentionWrapper`: detect `prefers-reduced-motion: reduce` via CSS media query
- [ ] When reduced motion is active: disable all CSS animations (pulse, glow, slide transitions)
- [ ] Replace animation-based attention indicators with static visual changes:
  - `warning`: solid amber border (2px), amber background tint — no pulse
  - `critical`: solid red border (2px), red background tint — no pulse
- [ ] In BumpButton: disable scale-down animation, use only color change for press feedback
- [ ] In TicketCard: disable slide-in/slide-out animations, use instant appear/disappear
- [ ] Use Tailwind `motion-reduce:` variant for conditional animation classes
- [ ] Create `frontend/src/utils/useReducedMotion.ts` hook (or use CSS-only approach)

### Task 4: Implement high-contrast mode support (AC 4)
- [ ] Detect `prefers-contrast: more` via CSS media query
- [ ] Override design tokens when high-contrast is active:
  - Background: `#000000` (pure black)
  - Healthy status: `#00FF7F` (high-contrast green)
  - Warning status: `#FFD700` (high-contrast amber/gold)
  - Critical status: `#FF4444` (high-contrast red)
  - Borders: 2px solid (up from default 1px or none)
  - Text: `#FFFFFF` (pure white)
- [ ] Update `frontend/src/tokens/kitchen-tokens.css` with `@media (prefers-contrast: more)` overrides
- [ ] Test that all status indicators remain distinguishable in high-contrast mode

### Task 5: Achieve 7:1 contrast ratio (AAA) for all text (AC 5)
- [ ] Audit all text colors against background colors in kitchen dark theme
- [ ] Target: 7:1 contrast ratio (WCAG AAA) for all text
- [ ] Order number text: white on dark card background — verify ratio
- [ ] Item text: white/light gray on dark card — verify ratio
- [ ] Elapsed time text: ensure sufficient contrast in all attention states
- [ ] BumpButton label: white on blue (#3B82F6) — verify ratio, adjust if needed
- [ ] Badge86 text: white on red (#EF4444) — verify ratio
- [ ] Use axe-core or manual calculation to verify all ratios
- [ ] Document verified contrast ratios in component test assertions

### Task 6: Implement full keyboard navigation (AC 6)
- [ ] Tab order: sequential through tickets (top to bottom), each ticket focuses its BumpButton
- [ ] Tab from one ticket's BumpButton to the next ticket's BumpButton
- [ ] Enter/Space on BumpButton: triggers bump action (already implemented in Story 2.4)
- [ ] Escape: dismiss toast notifications
- [ ] Station selector dropdown: keyboard navigable (Radix UI Select primitive handles this)
- [ ] Focus indicators: visible focus ring (2px solid, high contrast) on all interactive elements
- [ ] Use `tabIndex` appropriately — only interactive elements in tab order
- [ ] Ensure focus management after bump: focus moves to next ticket's BumpButton when current ticket bumped away

### Task 7: Implement screen reader support (AC 7)
- [ ] TicketCard: `role="article"`, `aria-label="Order [number], [status], [time] elapsed"`
- [ ] BumpButton: `aria-label="Advance order [number] to [next stage]"`
- [ ] Badge86: `role="status"`, `aria-label="[item name] is 86'd — unavailable"`
- [ ] ConnectionIndicator: `role="status"`, `aria-live="polite"` (announces state changes)
- [ ] AttentionWrapper: passes `aria-live="assertive"` when transitioning to warning/critical
- [ ] Stage counter: `aria-live="polite"` region that announces ticket count changes
- [ ] Empty state: announced on view load
- [ ] Toast notifications: `role="alert"`, `aria-live="assertive"`
- [ ] Use `aria-describedby` for additional ticket details (item list)

### Task 8: Implement font scaling resilience (AC 8)
- [ ] Test layout at 200% font scaling (browser zoom or OS font size)
- [ ] Use relative units (rem, em) for font sizes, not px (except for minimum sizes)
- [ ] Use `min-height` instead of fixed `height` on ticket cards to allow expansion
- [ ] BumpButton: use `min-height: 56dp` (not fixed height) to grow with larger text
- [ ] Ensure card padding uses relative units
- [ ] No text truncation — all content wraps or expands
- [ ] Verify no layout overflow or overlap at 200% scale

### Task 9: Write accessibility tests (All ACs)
- [ ] Vitest + axe-core integration: run automated accessibility audit on StationView
- [ ] Test ARIA roles and labels present on all components
- [ ] Test keyboard navigation: Tab through all tickets, Enter to bump
- [ ] Test focus management after bump
- [ ] Test screen reader output with @testing-library's `getByRole`, `getByLabelText`
- [ ] Test `prefers-reduced-motion` path: verify no animations
- [ ] Test `prefers-contrast: more` path: verify high-contrast colors applied
- [ ] Test at 200% font scale: no layout breakage
- [ ] Test at 768x1024 viewport: no horizontal scroll, 56dp buttons
- [ ] Test at 1920x1080 viewport: centered cards, readable text

### Task 10: Write visual regression tests (AC 1, AC 2, AC 4)
- [ ] Playwright screenshot tests for Station View at key viewports:
  - 768x1024 (7" tablet portrait)
  - 1024x768 (10" tablet landscape)
  - 1920x1080 (TV display)
- [ ] Playwright screenshot tests for high-contrast mode
- [ ] Playwright screenshot tests for reduced-motion mode
- [ ] Playwright screenshot tests for 200% font scale

## Dev Notes

### Architecture References
- Design token system: CSS custom properties via React context (`KitchenTokenProvider`)
- Same components render differently based on token context — kitchen tokens provide dark theme, large sizes
- WCAG 2.1 AA minimum, AAA target (7:1 contrast) for kitchen environment
- Attention-driven UI: triple-encoded status — color + animation + text (for accessibility)
- Radix UI primitives handle built-in ARIA, focus management, and keyboard navigation
- Touch targets: 56dp+ minimum (exceeds WCAG 48dp minimum) for kitchen use

### Technical Stack
- Tailwind CSS v4.2 with responsive variants (`sm:`, `md:`, `lg:`, `motion-reduce:`)
- Radix UI v1.4.3 for accessible primitives (Select, Dialog, etc.)
- CSS custom properties for design token overrides in media queries
- axe-core for automated accessibility testing in CI
- Playwright for visual regression and viewport testing
- Vitest + React Testing Library for component accessibility tests

### File Structure
```
frontend/src/tokens/
├── kitchen-tokens.css         # MODIFY — add @media high-contrast overrides, font scaling
└── TokenProvider.tsx          # MODIFY — ensure contrast/motion preferences exposed

frontend/src/components/AttentionWrapper/
└── AttentionWrapper.tsx        # MODIFY — add prefers-reduced-motion CSS, high-contrast overrides

frontend/src/components/TicketCard/
├── TicketCard.tsx              # MODIFY — responsive padding, font sizes, ARIA attributes
└── TicketCard.test.tsx         # MODIFY — add accessibility tests

frontend/src/components/BumpButton/
├── BumpButton.tsx             # MODIFY — min-height, keyboard focus ring, reduced-motion
└── BumpButton.test.tsx        # MODIFY — add keyboard and accessibility tests

frontend/src/components/Badge86/
└── Badge86.tsx                # MODIFY — verify ARIA, contrast in high-contrast mode

frontend/src/components/ConnectionIndicator/
└── ConnectionIndicator.tsx    # MODIFY — verify ARIA, live region

frontend/src/views/station/
├── StationView.tsx            # MODIFY — responsive layout, max-width container, no overflow
└── StationView.test.tsx       # MODIFY — add viewport and accessibility tests

frontend/src/utils/
└── useReducedMotion.ts        # NEW — optional hook for motion preference detection

frontend/src/styles/
└── globals.css                # MODIFY — add global high-contrast and motion overrides
```

### Testing Requirements
- axe-core: automated accessibility audit, run in CI, block PRs with violations
- Vitest + React Testing Library: ARIA roles, labels, keyboard navigation
- Playwright: visual regression at multiple viewports, media query overrides
- Manual testing: screen reader (VoiceOver/NVDA), real 7" tablet if available
- Verify all contrast ratios meet 7:1 AAA target
- Test co-location: `.test.tsx` files next to components

### Dependencies
- Story 2.3 must be complete (StationView, TicketCard, AttentionWrapper, ConnectionIndicator)
- Story 2.4 must be complete (BumpButton)
- Story 2.7 must be complete (Badge86, ProgressTimeline)
- All Station View components must exist before responsive/accessibility layer is applied

### References
- [Source: epics.md#Epic 2, Story 2.8]
- [Source: ux-design-specification.md#Custom Components — TicketCard, BumpButton, Badge86, AttentionWrapper, ConnectionIndicator]
- [Source: architecture.md#Frontend Architecture — Accessibility]
- [Source: architecture.md#Frontend Architecture — Design tokens]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
