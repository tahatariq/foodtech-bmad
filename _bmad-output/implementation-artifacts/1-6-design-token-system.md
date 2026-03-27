# Story 1.6: Design Token System & Foundation Components

Status: review

## Story

As a **frontend developer**,
I want a design token system with context-adaptive CSS custom properties and foundation components,
So that all views render with appropriate styling for their target environment (kitchen/office/mobile).

## Acceptance Criteria (BDD)

**Given** the design token CSS files are created (colors, spacing, typography, animation, breakpoints)
**When** `KitchenTokenProvider` wraps a component
**Then** CSS custom properties reflect kitchen values: `--ft-target-size: 48dp`, `--ft-contrast-mode: high`, `--ft-info-density: sparse`, dark theme colors (#1A1D23 background)

**When** `OfficeTokenProvider` wraps a component
**Then** CSS custom properties reflect office values: `--ft-target-size: 36dp`, `--ft-contrast-mode: normal`, `--ft-info-density: dense`, light theme colors (#F8F9FB background)

**And** the `ConnectionIndicator` component is implemented with 3 states: connected (green dot), reconnecting (amber pulsing + text), offline (red + "bumps will sync" text), with `role="status"` and `aria-live="polite"`

**And** the `AttentionWrapper` HOC is implemented with 5 attention levels (healthy, watching, warning, critical, resolved), applying opacity, scale, glow, and pulse per the UX spec, respecting `prefers-reduced-motion`

**And** the traffic-light status system is implemented with triple-encoding (color + icon + pattern) as reusable utility classes/components

**And** Inter and JetBrains Mono fonts are loaded with the kitchen and office type scales

## Tasks / Subtasks

### Task 1: Create Design Token CSS Files (AC: colors, spacing, typography, animation, breakpoints)

- [x] Create `frontend/src/tokens/colors.css`:
  - Kitchen dark theme: `--ft-bg-primary: #1A1D23`, `--ft-bg-secondary: #23272F`, `--ft-text-primary: #F1F3F5`, etc.
  - Office light theme: `--ft-bg-primary: #F8F9FB`, `--ft-bg-secondary: #FFFFFF`, `--ft-text-primary: #1A1D23`, etc.
  - Status colors: `--ft-status-healthy: #22C55E`, `--ft-status-warning: #F59E0B`, `--ft-status-critical: #EF4444`, `--ft-status-resolved: #6366F1`
- [x] Create `frontend/src/tokens/spacing.css`:
  - Kitchen spacing scale (sparse): `--ft-space-1: 8px` through `--ft-space-8: 64px`
  - Office spacing scale (dense): tighter increments
  - Target sizes: `--ft-target-size` (kitchen: 48dp, office: 36dp)
- [x] Create `frontend/src/tokens/typography.css`:
  - Kitchen type scale: larger sizes for readability at arm's length
  - Office type scale: standard sizes for desktop viewing
  - `--ft-font-primary: 'Inter', sans-serif`
  - `--ft-font-mono: 'JetBrains Mono', monospace`
- [x] Create `frontend/src/tokens/animation.css`:
  - `--ft-transition-fast: 150ms`
  - `--ft-transition-normal: 250ms`
  - `--ft-transition-slow: 400ms`
  - Pulse keyframes for attention states
  - Glow keyframes for critical states
  - `prefers-reduced-motion` overrides that disable animations
- [x] Create `frontend/src/tokens/breakpoints.css`:
  - Kitchen breakpoints (tablet-first): 768px, 1024px, 1280px
  - Office breakpoints (desktop-first): 1024px, 1280px, 1440px
- [x] Create `frontend/src/tokens/index.css` that imports all token files

### Task 2: Implement KitchenTokenProvider (AC: kitchen CSS custom properties)

- [x] Create `frontend/src/tokens/KitchenTokenProvider.tsx`:
  - React context provider that wraps children
  - Applies `data-theme="kitchen"` attribute to its root element
  - Sets CSS custom properties via inline styles or CSS class:
    - `--ft-target-size: 48px`
    - `--ft-contrast-mode: high`
    - `--ft-info-density: sparse`
    - Dark theme colors (#1A1D23 background)
  - Provides context value with `{ theme: 'kitchen', targetSize: 48, contrastMode: 'high', infoDensity: 'sparse' }`
- [x] Create `frontend/src/tokens/DesignTokenContext.tsx`:
  - `DesignTokenContext` React context
  - `useDesignTokens()` hook for consuming the current token set
  - Type: `DesignTokenContextValue = { theme: 'kitchen' | 'office', targetSize: number, contrastMode: 'high' | 'normal', infoDensity: 'sparse' | 'dense' }`
- [x] Write unit test: component wrapped in KitchenTokenProvider has kitchen CSS properties applied

### Task 3: Implement OfficeTokenProvider (AC: office CSS custom properties)

- [x] Create `frontend/src/tokens/OfficeTokenProvider.tsx`:
  - React context provider that wraps children
  - Applies `data-theme="office"` attribute to its root element
  - Sets CSS custom properties:
    - `--ft-target-size: 36px`
    - `--ft-contrast-mode: normal`
    - `--ft-info-density: dense`
    - Light theme colors (#F8F9FB background)
  - Provides context value with `{ theme: 'office', targetSize: 36, contrastMode: 'normal', infoDensity: 'dense' }`
- [x] Write unit test: component wrapped in OfficeTokenProvider has office CSS properties applied

### Task 4: Implement ConnectionIndicator Component (AC: 3 connection states, ARIA attributes)

- [x] Create `frontend/src/components/ConnectionIndicator.tsx`:
  - Props: `status: 'connected' | 'reconnecting' | 'offline'`
  - **Connected state**: green dot indicator (`#22C55E`), no text (minimal footprint)
  - **Reconnecting state**: amber pulsing dot (`#F59E0B`), text "Reconnecting...", CSS pulse animation
  - **Offline state**: red dot (`#EF4444`), text "Offline — bumps will sync", solid (no animation)
  - Accessibility: `role="status"`, `aria-live="polite"` for screen reader updates
  - Responsive: works at both kitchen (48dp touch) and office (36dp) scales via design tokens
- [x] Create `frontend/src/components/ConnectionIndicator.test.tsx`:
  - Renders green dot for connected state
  - Renders amber pulsing dot with "Reconnecting..." text
  - Renders red dot with "bumps will sync" text
  - Has `role="status"` and `aria-live="polite"`
- [x] Integrate with `useSocket` hook's `connectionStatus` from Story 1.5

### Task 5: Implement AttentionWrapper HOC (AC: 5 attention levels, prefers-reduced-motion)

- [x] Create `frontend/src/components/AttentionWrapper.tsx`:
  - Props: `level: 'healthy' | 'watching' | 'warning' | 'critical' | 'resolved'`, `children: ReactNode`
  - Visual treatments per level:
    - `healthy`: full opacity, normal scale, no effects
    - `watching`: full opacity, subtle border highlight
    - `warning`: full opacity, amber glow, gentle pulse (1s cycle)
    - `critical`: full opacity, red glow, aggressive pulse (0.5s cycle), scale bump (1.02)
    - `resolved`: reduced opacity (0.7), shrink scale (0.98), fade-out transition
  - Respects `prefers-reduced-motion`:
    - When enabled: no pulse, no glow, use border color changes only
    - Use `window.matchMedia('(prefers-reduced-motion: reduce)')` or CSS media query
  - Uses CSS custom properties from design tokens for animation values
- [x] Create `frontend/src/components/AttentionWrapper.test.tsx`:
  - Each attention level applies correct CSS classes/styles
  - Reduced motion mode disables animations
  - Children render correctly at all levels

### Task 6: Implement Traffic-Light Status System (AC: triple-encoding color + icon + pattern)

- [x] Create `frontend/src/components/StatusIndicator.tsx`:
  - Props: `status: 'healthy' | 'warning' | 'critical'`, `size?: 'sm' | 'md' | 'lg'`
  - Triple encoding:
    - **Color**: green (#22C55E) / amber (#F59E0B) / red (#EF4444)
    - **Icon**: checkmark / triangle-alert / circle-x (use Radix UI icons or inline SVG)
    - **Pattern**: solid fill / diagonal stripes / crosshatch (for colorblind accessibility)
  - Each encoding is independent — works even if one channel is not perceived
- [x] Create `frontend/src/tokens/status-utilities.css`:
  - Utility classes: `.status-healthy`, `.status-warning`, `.status-critical`
  - Pattern backgrounds using CSS `repeating-linear-gradient`
- [x] Create `frontend/src/components/StatusIndicator.test.tsx`:
  - Each status renders correct color, icon, and pattern
  - Sizes render correctly

### Task 7: Load Inter and JetBrains Mono Fonts (AC: fonts loaded with kitchen and office type scales)

- [x] Install fonts: `@fontsource/inter`, `@fontsource/jetbrains-mono`
- [x] Import fonts in `frontend/src/main.tsx`:
  - Inter: weights 400, 500, 600, 700
  - JetBrains Mono: weights 400, 500
- [x] Define kitchen type scale in `typography.css`:
  - Body: 18px/1.5 Inter
  - Heading: 24px/1.3 Inter 600
  - Timer: 48px/1.1 JetBrains Mono 500
  - Label: 14px/1.4 Inter 500 uppercase
- [x] Define office type scale in `typography.css`:
  - Body: 14px/1.5 Inter
  - Heading: 20px/1.3 Inter 600
  - Timer: 32px/1.1 JetBrains Mono 500
  - Label: 12px/1.4 Inter 500 uppercase
- [x] Verify fonts render correctly in both theme contexts

### Task 8: Copy Token System to Supplier Portal (AC: tokens available in both SPAs)

- [x] Copy or symlink token CSS files to `supplier-portal/src/tokens/`
- [x] Create `supplier-portal/src/tokens/OfficeTokenProvider.tsx` (supplier portal always uses office theme)
- [x] Import fonts in `supplier-portal/src/main.tsx`
- [x] Verify token system works independently in supplier-portal

## Dev Notes

### Architecture References
- Design tokens use **CSS custom properties via React context** — `KitchenTokenProvider` vs `OfficeTokenProvider` (architecture.md, "Frontend Architecture")
- Frontend styling: **Tailwind CSS v4.2** + CSS custom properties for design tokens (architecture.md, "Styling Solution")
- Radix UI v1.4.3 for accessible primitives (architecture.md)
- CSS file naming: **kebab-case** (architecture.md, "Code Naming Conventions")

### Technical Stack
- Tailwind CSS v4.2 (`@tailwindcss/vite` plugin)
- Radix UI v1.4.3 (`radix-ui`) — for icons and accessible primitives
- `@fontsource/inter` — Inter font
- `@fontsource/jetbrains-mono` — JetBrains Mono font
- React 19 Context API
- Vitest + React Testing Library for component tests

### File Structure
```
frontend/src/
├── tokens/
│   ├── index.css
│   ├── colors.css
│   ├── spacing.css
│   ├── typography.css
│   ├── animation.css
│   ├── breakpoints.css
│   ├── status-utilities.css
│   ├── DesignTokenContext.tsx
│   ├── KitchenTokenProvider.tsx
│   └── OfficeTokenProvider.tsx
├── components/
│   ├── ConnectionIndicator.tsx
│   ├── ConnectionIndicator.test.tsx
│   ├── AttentionWrapper.tsx
│   ├── AttentionWrapper.test.tsx
│   ├── StatusIndicator.tsx
│   └── StatusIndicator.test.tsx
├── main.tsx                        # Font imports
supplier-portal/src/
├── tokens/
│   ├── (copied/symlinked token CSS files)
│   └── OfficeTokenProvider.tsx
└── main.tsx                        # Font imports
```

### Testing Requirements
- Unit tests for `KitchenTokenProvider`: correct CSS custom properties applied
- Unit tests for `OfficeTokenProvider`: correct CSS custom properties applied
- Unit tests for `ConnectionIndicator`: all 3 states render correctly with ARIA attributes
- Unit tests for `AttentionWrapper`: all 5 levels apply correct styles, reduced motion disables animations
- Unit tests for `StatusIndicator`: triple encoding renders correctly for all statuses
- Visual regression tests (optional, if Playwright visual comparison is set up)
- Accessibility: axe-core check on all components for ARIA compliance

### Dependencies
- **Story 1.1** (Monorepo Scaffold) — frontend project with Vite, React, Tailwind CSS, Radix UI
- **Story 1.5** (Real-Time Events) — `useSocket` hook providing `connectionStatus` for `ConnectionIndicator`

### References
- [Source: epics.md#Epic 1, Story 1.6]
- [Source: architecture.md#Frontend Architecture (Design tokens, State management)]
- [Source: architecture.md#Styling Solution]
- [Source: architecture.md#Code Naming Conventions (CSS files)]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A

### Completion Notes List
- All 8 tasks implemented with 64 tests passing (44 backend, 19 frontend, 1 supplier-portal)
- Design token CSS files: colors, spacing, typography, animation, breakpoints, status-utilities
- KitchenTokenProvider: dark theme, 48dp targets, high contrast, sparse density
- OfficeTokenProvider: light theme, 36dp targets, normal contrast, dense density
- DesignTokenContext with useDesignTokens() hook (throws outside provider)
- ConnectionIndicator: 3 states (connected/reconnecting/offline) with role="status" aria-live="polite"
- AttentionWrapper: 5 levels with prefers-reduced-motion support (border-only fallback)
- StatusIndicator: triple-encoding (color + SVG icon + CSS pattern) at 3 sizes
- Inter (400-700) and JetBrains Mono (400-500) fonts loaded via @fontsource
- Token system copied to supplier-portal with OfficeTokenProvider
- Linter improved AttentionWrapper to initialize reduced motion state eagerly

### File List
- frontend/src/tokens/colors.css
- frontend/src/tokens/spacing.css
- frontend/src/tokens/typography.css
- frontend/src/tokens/animation.css
- frontend/src/tokens/breakpoints.css
- frontend/src/tokens/status-utilities.css
- frontend/src/tokens/index.css
- frontend/src/tokens/DesignTokenContext.tsx
- frontend/src/tokens/KitchenTokenProvider.tsx
- frontend/src/tokens/OfficeTokenProvider.tsx
- frontend/src/tokens/TokenProviders.test.tsx
- frontend/src/components/ConnectionIndicator.tsx
- frontend/src/components/ConnectionIndicator.test.tsx
- frontend/src/components/AttentionWrapper.tsx
- frontend/src/components/AttentionWrapper.test.tsx
- frontend/src/components/StatusIndicator.tsx
- frontend/src/components/StatusIndicator.test.tsx
- frontend/src/main.tsx (modified — font and token imports)
- frontend/package.json (modified — added @fontsource/inter, @fontsource/jetbrains-mono)
- supplier-portal/src/tokens/ (copied CSS files, DesignTokenContext, OfficeTokenProvider)
- supplier-portal/src/main.tsx (modified — font and token imports)
- supplier-portal/package.json (modified — added @fontsource/inter, @fontsource/jetbrains-mono)
