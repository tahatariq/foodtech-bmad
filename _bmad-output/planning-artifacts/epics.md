---
stepsCompleted: [1, 2, 3, 4]
lastStep: 4
status: 'complete'
completedAt: '2026-03-23'
inputDocuments: ['prd.md', 'architecture.md', 'ux-design-specification.md']
workflowType: 'epics-and-stories'
project_name: 'FoodTech'
user_name: 'TT'
date: '2026-03-22'
---

# FoodTech - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for FoodTech, decomposing the requirements from the PRD, UX Design Specification, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: System can receive orders via REST API from external POS systems
FR2: Kitchen staff can create orders manually via quick-entry interface
FR3: System can route order items to appropriate kitchen stations based on configuration
FR4: Line cooks can view only orders assigned to their station
FR5: Line cooks can advance an order to the next stage with a single tap (bump-to-advance)
FR6: System can track and display order progress through configurable stages (received → preparing → plating → served)
FR7: System can display mini-timeline progress bars showing time elapsed per order
FR8: System can visually prioritize orders by urgency (time in current stage)
FR9: Expeditors can reassign orders between stations
FR10: System can calculate estimated completion time per order based on current kitchen state, accurate within ±3 minutes of actual completion
FR11: System can display station readiness as green/yellow/red status indicators
FR12: Kitchen staff can complete station-specific prep checklists before service
FR13: System can track inventory levels for configurable menu items
FR14: System can flag items as 86'd (unavailable) when inventory reaches zero
FR15: System can display 86'd items across all views in real-time
FR16: System can trigger auto-reorder notifications when inventory drops below configurable thresholds
FR17: Managers can configure inventory items and their reorder thresholds
FR18: System can decrement inventory automatically based on orders processed
FR19: System can calculate and display a real-time Service Tempo health metric for each kitchen
FR20: System can detect bottlenecks by identifying stations with above-average ticket times
FR21: System can apply attention-driven visual treatment (highlight problems, dim healthy operations)
FR22: Expeditors can view all stations' load and status on a single dashboard
FR23: System can alert when Service Tempo enters yellow or red zones
FR24: System can generate unique tracking links/QR codes per order
FR25: Customers can view real-time order status without installing an app or creating an account
FR26: System can push status updates to customers as orders progress through stages
FR27: System can display estimated time to ready based on live kitchen state, accurate within ±3 minutes of actual ready time
FR28: Delivery partners can view a queue of ready and upcoming orders with estimated ready times
FR29: System can calculate pickup ETAs based on real-time kitchen state, accurate within ±2 minutes of actual ready time
FR30: Delivery partners can confirm order pickup
FR31: System can prioritize delivery queue based on order readiness and wait time
FR32: Independent suppliers can log into a Supplier Portal to view demand signals from linked restaurants
FR33: Suppliers can view aggregated inventory levels and consumption trends across their restaurant clients
FR34: Suppliers can receive, review, and confirm auto-triggered reorders
FR35: Suppliers can batch 2 or more orders for route-optimized delivery
FR36: System can push purchase orders to external supplier systems via outbound API
FR37: Restaurants can view supplier order confirmation status in Kitchen Status
FR38: System can isolate all operational data per restaurant location (tenant)
FR39: Organization owners can group 2 or more locations under a parent organization (up to subscription tier limit)
FR40: Organization owners can view consolidated dashboards across all locations
FR41: Organization owners can drill down from organization view to individual location detail
FR42: System can enforce role-based access control across 9 defined roles
FR43: System can enforce subscription tier feature gates (Indie/Growth/Enterprise)
FR44: Admins can create and configure new restaurant tenants with station layouts, order stages, and staff roles
FR45: Admins can import menu items and inventory from CSV
FR46: Admins can generate API credentials for POS integrations
FR47: Admins can monitor adoption metrics (bump usage, checklist completion, active users)
FR48: System can run a demo simulator generating realistic order patterns at configurable pace
FR49: External systems can submit orders via authenticated REST API
FR50: External systems can subscribe to order status webhooks (bump events, completion, 86 changes)
FR51: System can provide a sandbox environment for integration testing
FR52: System can provide API documentation portal for developers
FR53: System can manage API keys and webhook signing for secure integrations
FR54: System can propagate any kitchen event to all subscribed views within 500ms
FR55: System can maintain persistent WebSocket connections with automatic reconnection
FR56: Station View can cache current state locally and operate during connection drops
FR57: System can sync full state to reconnected clients after connection recovery
FR58: All views can adapt responsively from 7" tablet to 65" TV display
FR59: Expeditor Dashboard and Delivery Board can operate in display-only mode for wall-mounted screens
FR60: System can provide high-contrast visual modes for kitchen environments
FR61: System can indicate status using icons and patterns in addition to color (color-blind safe)
FR62: All interactive elements can support touch targets of minimum 48x48dp
FR63: All views can meet WCAG 2.1 AA compliance standards

### NonFunctional Requirements

NFR1: First Meaningful Paint < 2 seconds on budget Android tablet over restaurant WiFi
NFR2: Kitchen Event Propagation < 500ms end-to-end (from bump to all subscribed views)
NFR3: API Response Time (P95) < 300ms under normal load
NFR4: API Response Time (P99) < 800ms under peak load
NFR5: WebSocket Message Delivery < 200ms from server to connected client
NFR6: Bundle Size (Initial Load) < 500KB gzipped for Station View
NFR7: Bundle Size (Full Dashboard) < 1.5MB gzipped for Expeditor Dashboard
NFR8: Time to Interactive < 3 seconds for any view on target hardware
NFR9: Concurrent WebSocket Connections support 500+ per instance
NFR10: Database Query Time (P95) < 100ms for tenant-scoped queries
NFR11: JWT authentication with 15-min access tokens and 7-day refresh token rotation
NFR12: RBAC with tenant isolation — 9 roles enforced at API layer, every query tenant-scoped
NFR13: TLS 1.3 for all API and WebSocket connections
NFR14: AES-256 encryption at rest for database and backups
NFR15: OWASP API Top 10 compliance (rate limiting, input validation, injection prevention)
NFR16: Secure session management (HttpOnly, SameSite=Strict, CSRF protection)
NFR17: Database-level tenant isolation (tenant_id on every row, enforced in query layer)
NFR18: Token-based customer auth with 24-hour expiry (no login required)
NFR19: API key + HMAC signature for machine-to-machine supplier auth
NFR20: Audit logging of all state-changing actions (who, what, when, tenant)
NFR21: No secrets in code or config files — environment variables or secret manager
NFR22: Automated dependency vulnerability scanning in CI/CD pipeline
NFR23: Horizontal scaling with stateless app servers behind load balancer
NFR24: 100+ tenants on shared database infrastructure with connection pooling
NFR25: Multi-node Socket.io with Redis adapter for cross-node events
NFR26: Row-level tenant scoping with tenant_id indexed on every table
NFR27: Event throughput 1,000+ events/second per tenant during peak service
NFR28: Per-tenant, per-role rate limits to prevent noisy-neighbor issues
NFR29: 99.9% uptime SLA (< 8.77 hours downtime/year)
NFR30: Zero-downtime deployments via rolling or blue-green strategy
NFR31: Data durability 99.999% with automated daily backups and point-in-time recovery
NFR32: Disaster Recovery RPO < 1 hour, RTO < 4 hours
NFR33: Auto-reconnect WebSocket with full state sync and exponential backoff
NFR34: Offline Station View with local cache, optimistic UI bumps, sync on reconnect
NFR35: Graceful degradation — Supplier Portal down doesn't affect kitchen ops
NFR36: Automatic retry with dead-letter queue (3x exponential backoff for failed events)
NFR37: Real-time system health monitoring dashboard
NFR38: WCAG 2.1 AA compliance across all views
NFR39: Screen reader support with ARIA labels on all interactive elements, logical focus order
NFR40: Color independence — status via icon + pattern + color (never color alone)
NFR41: Touch targets minimum 48x48dp for all interactive elements
NFR42: Font scaling up to 200% without layout breakage
NFR43: Reduced motion support — respect prefers-reduced-motion
NFR44: Contrast ratios 4.5:1 minimum (7:1 for kitchen small text)
NFR45: Internationalization-ready (UTF-8, RTL-ready layout)
NFR46: GDPR-aligned data handling (data minimization, right-to-deletion, retention policies)
NFR47: Automated accessibility testing (axe-core in CI) + manual screen reader testing per release
NFR48: RESTful API with OpenAPI 3.0 specification, versioned endpoints
NFR49: Socket.io with namespace-per-tenant and room-per-view architecture
NFR50: JSON data format, ISO 8601 timestamps, UTC internally
NFR51: Outbound webhooks with retry logic for key events
NFR52: OAuth 2.0 for user auth, API keys + HMAC for machine-to-machine
NFR53: Per-tenant, per-endpoint rate limits with 429 responses and Retry-After headers
NFR54: API versioning with minimum 6-month deprecation notice for breaking changes
NFR55: TypeScript SDK for POS integrators (post-MVP)

### Additional Requirements

**Starter Template / Project Initialization:**
- Architecture specifies Vite + React + NestJS Monorepo (Option C) with specific initialization commands
- Monorepo using npm workspaces: backend/ + frontend/ + supplier-portal/ + packages/shared-types/
- Turborepo for build orchestration
- Epic 1 Story 1 must scaffold this monorepo structure

**Infrastructure & Deployment:**
- Docker Compose for local development (PostgreSQL + Redis + backend + frontends)
- Docker multi-stage builds for production images
- GitHub Actions CI/CD pipeline (lint + test + build, parallel per package)
- Blue-green deployment via AWS (ECS or App Runner)
- 3 environments: dev (Docker Compose), staging (AWS mirrors prod), prod (AWS)
- S3 + CloudFront CDN for frontend static assets

**Database & ORM:**
- PostgreSQL 16 with Drizzle ORM (TypeScript-native, no generate step)
- Drizzle Kit for schema-as-code migrations
- Tenant schema: Organization (optional parent) → Location (primary tenant) → all operational entities
- TenantScope interceptor auto-injects tenant_id WHERE clause on every query
- Redis 7.x for Socket.io adapter, cache, and pub/sub event fanout

**Authentication & Security:**
- NestJS guard chain: AuthGuard (JWT valid?) → TenantGuard (tenant_id matches?) → RolesGuard (role authorized?)
- @nestjs/passport + @nestjs/jwt for auth framework
- bcrypt (cost factor 12) for password hashing
- Delivery partner auth via location-scoped API key
- Secrets via environment variables (dev) / cloud secret manager (prod)

**API & Communication:**
- URL-prefixed versioning (/api/v1/)
- RFC 7807 Problem Details for all error responses
- @nestjs/throttler for rate limiting
- @nestjs/swagger for auto-generated OpenAPI 3.0 docs at /api/docs
- WebSocket namespace-per-tenant (/tenant-{id}), room-per-view topology
- FoodTechEvent<T> typed wrapper for all WebSocket events
- Webhook delivery with 3x exponential backoff retry + dead-letter queue

**Frontend Architecture:**
- Zustand 5.x for client state (auth, UI, offline queue)
- TanStack Query 5.x for server state (WebSocket events update query cache)
- React Router 7.x in SPA mode with role-based route guards
- React.lazy + Suspense for per-view code splitting
- CSS custom properties via React context for design tokens (KitchenTokenProvider vs OfficeTokenProvider)
- React Hook Form + Zod resolver for admin/supplier forms
- socket.io-client + custom useSocket() hook

**Monitoring & Observability:**
- Structured JSON logging via NestJS interceptors
- Sentry for frontend and backend error tracking with source maps
- Custom WebSocket metrics → CloudWatch (connection count, event throughput, reconnection rate)

**Demo Simulator:**
- Runs through real backend as NestJS SimulatorModule (not client-side mock)
- Configurable pace patterns: rush, steady, slow
- Admin triggers via API: POST /api/v1/simulator/start { pace }

**Implementation Patterns (from Architecture):**
- NestJS module template: module.ts + controller.ts + service.ts + gateway.ts + repository.ts + dto/ + entities/ + events/ + co-located tests
- Frontend component folder: Component.tsx + test + stories (optional) + index.ts re-export
- Event naming: {domain}.{entity}.{action} (lowercase, dot-separated)
- Database naming: snake_case tables/columns, UUID PKs, idx_ indexes
- API naming: plural kebab-case endpoints, camelCase JSON
- 8 mandatory enforcement rules for AI agents (documented in Architecture)
- 7 anti-patterns with corrections

### UX Design Requirements

UX-DR1: Implement design token system with CSS custom properties — color tokens (traffic-light status: green #10B981, amber #F59E0B, red #EF4444, brand blue #3B82F6), spacing tokens (4px grid, context-adaptive: kitchen 24px card padding vs office 16px), typography tokens (Inter font, kitchen scale 12-48px, office scale ~20% smaller), animation tokens (glow, pulse, fade, slide), and context-adaptive breakpoint tokens
UX-DR2: Build TicketCard component — displays order number (monospace), item list, elapsed time, 86'd badges, station label; states: healthy (0.7 opacity), watching (0.85), warning (amber glow, 2s pulse), critical (red glow, 1s pulse), bumped (slide-out); variants: station (large, full bump button), expeditor (compact, expandable), rail (mini); ARIA role="article" with descriptive label
UX-DR3: Build BumpButton component — full-width button at bottom of ticket card, 56dp height, "BUMP →" label; states: default (brand blue), pressed (darkened 50ms), bumping (scale-down 0.98), disabled (grayed); no confirmation dialog; keyboard Enter/Space activation; haptic feedback where supported
UX-DR4: Build ServiceTempoGauge component — large monospace tempo number, "avg minutes per ticket" label, progress bar (green→amber→red), target/critical range labels; states: green (< target), amber (1-2x target, 2s pulse), red (> 2x target, 1s pulse + glow); variants: large (64px for TV), compact (32px for sidebar); ARIA role="meter"
UX-DR5: Build StationStatusIndicator component — status dot (traffic light color), station name + emoji, ticket count, status text; tap to expand individual tickets; states: healthy (green, 0.7 opacity), warning (amber, 1.0, slow pulse), critical (red, 1.0, fast pulse); ARIA role="button" with aria-expanded
UX-DR6: Build Badge86 component — "86'd" red badge; variants: inline (small, on ticket card) and board (larger, on 86 Board panel); ARIA role="status" with live region announcements on status change
UX-DR7: Build CustomerProgressSteps component — 4 step dots (Received → Preparing → Plating → Ready), labels, connector lines; per-step states: done (green, checkmark), active (blue, soft pulse), pending (gray, number); ARIA role="progressbar" with valueNow/valueMax
UX-DR8: Build CountdownETA component — large number (minutes), "min" unit label, stage label; states: ready (green, "NOW"), soon (amber, < 3 min), waiting (gray, > 3 min); variants: large (28px for Delivery Board), compact (16px inline); ARIA role="timer" with live region
UX-DR9: Build ConnectionIndicator component — small colored dot + optional text; states: connected (green, 8px), reconnecting (amber, pulsing, "Reconnecting..."), offline (red, "Offline — bumps will sync"); ARIA role="status" with aria-live="polite"
UX-DR10: Build AttentionWrapper HOC — wraps any component, applies attention-driven visual treatment based on attentionLevel prop; states: healthy (opacity 0.7, scale 1.0), watching (0.85), warning (1.0, scale 1.02, amber glow, 2s pulse), critical (1.0, scale 1.05, red glow, 1s pulse), resolved (green flash → healthy); respects prefers-reduced-motion
UX-DR11: Implement Station View layout — single column stacked ticket cards, dark theme (charcoal #1A1D23), portrait-optimized for 7"-10" budget Android tablet, 56dp+ bump targets, zero navigation (station selector only UI chrome), offline cache with optimistic bump, < 500KB bundle
UX-DR12: Implement Expeditor Dashboard layout — 3-panel command center (Rail + Kitchen Status + Service Tempo), dark theme, landscape-optimized for iPad/wall-mounted TV, no-scroll design (all visible at once), display-only mode for TV, attention-driven UI (problems glow, healthy fades), station expand/collapse for drill-down
UX-DR13: Implement Customer Tracker layout — centered single column (max-width 480px), light theme (cool white #F8F9FB), mobile-first (375px primary width), progress steps + ETA above fold, no navigation, no login, WebSocket for real-time updates, < 2s load time, token-based auth in URL
UX-DR14: Implement Delivery Board layout — sorted list with ETA emphasis, dark theme, mobile-first portrait, large rows (64px min), countdown timers, one-tap pickup confirmation button, tab navigation (Ready/Preparing/History), glanceable high-contrast design
UX-DR15: Implement Supplier Portal layout — data table + sidebar, light theme, desktop-first (1280px+ primary), 12-column grid, sticky header, keyboard navigable, batch selection with floating action bar, filter chips, 25-row pagination with load-more
UX-DR16: Implement Admin Console layout — wizard + form layout, light theme, desktop-first, 8-step onboarding wizard (Basic Info → Station Layout → Order Stages → Menu Import → Inventory Thresholds → Staff Roles → POS Integration → Review & Activate), progressive disclosure, validation feedback
UX-DR17: Implement Management Console layout — card grid (locations) → detail panel, light theme, desktop-first with tablet landscape support, responsive 2-4 column grid, summary-to-detail drill-down transition, location cards with status indicators
UX-DR18: Implement three-tier action hierarchy across all views — Primary (solid fill, brand blue, max 1 per view), Secondary (outlined/ghost, muted), Tertiary (text link/icon-only); destructive actions use red + one confirmation step; batch actions use floating action bar
UX-DR19: Implement environment-specific feedback patterns — Kitchen: green flash success (200ms), inline errors, skeleton loading (never spinners), no modals; Office: toast notifications (3s auto-dismiss, max 3 visible); Mobile: checkmark animations, inline errors with retry, progress bars
UX-DR20: Implement skeleton loading states for every view — Station View (3 skeleton ticket cards), Expeditor Dashboard (3-panel skeleton), Customer Tracker (4 gray circles + connectors), Delivery Board (3 skeleton rows), Supplier Portal (table with 5 shimmer rows), Admin Console (form skeleton)
UX-DR21: Implement empty states with helpful content — Station View ("No tickets right now"), Expeditor ("All clear. Kitchen is idle."), Delivery Board ("No orders ready for pickup"), Supplier Portal ("No pending orders"), Management Console ("Connect your first location" + setup CTA)
UX-DR22: Implement role-based navigation patterns — Kitchen views: zero navigation (Station) or minimal (Expeditor expand/collapse); Customer/Delivery: no global nav (single-purpose); Business views: persistent sidebar (desktop) + bottom tabs (mobile); deep link URL support
UX-DR23: Implement 5-level error handling UX — Level 1: silent recovery (auto-retry, no UI); Level 2: ambient indicator (ConnectionIndicator amber); Level 3: inline warning ("data may be delayed"); Level 4: action-required (red error + retry button); Level 5: blocking (full-screen error state); kitchen views use levels 1-3 only
UX-DR24: Implement high-contrast mode for kitchen environments — toggle via prefers-contrast media query or manual setting; darker backgrounds (#000000), brighter status colors (#00FF7F, #FFD700, #FF4444), 2px solid borders; AAA contrast targets (7:1) for kitchen text
UX-DR25: Implement kitchen-specific accessibility — 56dp touch targets (exceeds 48dp minimum), no swipe gestures required, no multi-touch, no audio reliance in MVP, icon-heavy interface with minimal text, number-based order IDs, triple-encoded status (color + icon + pattern)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Receive orders via REST API |
| FR2 | Epic 2 | Manual quick-entry orders |
| FR3 | Epic 2 | Route items to stations |
| FR4 | Epic 2 | Station-scoped order visibility |
| FR5 | Epic 2 | Bump-to-advance (one tap) |
| FR6 | Epic 2 | Configurable stage tracking |
| FR7 | Epic 2 | Mini-timeline progress bars |
| FR8 | Epic 2 | Urgency-based prioritization |
| FR9 | Epic 3 | Expeditor reassign orders |
| FR10 | Epic 3 | ETA calculation (±3 min) |
| FR11 | Epic 3 | Station readiness indicators |
| FR12 | Epic 3 | Prep checklists |
| FR13 | Epic 3 | Inventory level tracking |
| FR14 | Epic 3 | 86'd item flagging |
| FR15 | Epic 3 | 86'd visibility across views |
| FR16 | Epic 3 | Auto-reorder threshold triggers |
| FR17 | Epic 3 | Configure inventory thresholds |
| FR18 | Epic 3 | Auto-decrement inventory on bump |
| FR19 | Epic 3 | Service Tempo metric |
| FR20 | Epic 3 | Bottleneck detection |
| FR21 | Epic 3 | Attention-driven visual treatment |
| FR22 | Epic 3 | Expeditor single-screen dashboard |
| FR23 | Epic 3 | Tempo alerts (yellow/red) |
| FR24 | Epic 4 | QR code / tracking links |
| FR25 | Epic 4 | No-install customer status page |
| FR26 | Epic 4 | Push status updates to customers |
| FR27 | Epic 4 | Customer ETA (±3 min) |
| FR28 | Epic 4 | Delivery ready/upcoming queue |
| FR29 | Epic 4 | Delivery pickup ETAs (±2 min) |
| FR30 | Epic 4 | Pickup confirmation |
| FR31 | Epic 4 | Delivery queue prioritization |
| FR32 | Epic 5 | Supplier Portal login + demand |
| FR33 | Epic 5 | Aggregated inventory + trends |
| FR34 | Epic 5 | Review/confirm auto-reorders |
| FR35 | Epic 5 | Batch orders (2+) |
| FR36 | Epic 5 | Outbound supplier API push |
| FR37 | Epic 5 | Supplier confirmation in Kitchen Status |
| FR38 | Epic 1 | Tenant data isolation |
| FR39 | Epic 6 | Organization grouping |
| FR40 | Epic 6 | Consolidated org dashboards |
| FR41 | Epic 6 | Org → location drill-down |
| FR42 | Epic 1 | RBAC (9 roles) |
| FR43 | Epic 1 | Subscription tier gates |
| FR44 | Epic 6 | Admin tenant configuration |
| FR45 | Epic 6 | CSV menu/inventory import |
| FR46 | Epic 6 | API credential generation |
| FR47 | Epic 6 | Adoption metrics monitoring |
| FR48 | Epic 6 | Demo simulator |
| FR49 | Epic 2 | Authenticated order ingestion API |
| FR50 | Epic 7 | Webhook subscriptions |
| FR51 | Epic 7 | Sandbox environment |
| FR52 | Epic 7 | API documentation portal |
| FR53 | Epic 7 | API key + webhook signing management |
| FR54 | Epic 2 | Event propagation < 500ms |
| FR55 | Epic 2 | Persistent WebSocket + auto-reconnect |
| FR56 | Epic 2 | Station View offline cache |
| FR57 | Epic 2 | Full state sync on reconnect |
| FR58 | Epic 2 | Responsive 7" to 65" |
| FR59 | Epic 3 | Display-only mode (TV) |
| FR60 | Epic 2 | High-contrast kitchen modes |
| FR61 | Epic 2 | Color-blind safe indicators |
| FR62 | Epic 2 | 48dp+ touch targets |
| FR63 | Epic 2 | WCAG 2.1 AA compliance |

## Epic List

### Epic 1: Platform Foundation & Restaurant Setup
Alex can create a restaurant tenant, configure staff roles, and team members can log in to role-appropriate views. The foundational infrastructure (multi-tenancy, auth, RBAC, real-time event bus, design token system) is established — invisible to users but enabling everything that follows.
**FRs covered:** FR38, FR42, FR43
**Additional:** Monorepo scaffold, PostgreSQL + Drizzle schema with tenant isolation, NestJS auth (JWT + guard chain), Socket.io + Redis infrastructure, shared-types package, Docker Compose, design token foundation, CI pipeline
**UX-DRs:** UX-DR1 (design tokens), UX-DR9 (ConnectionIndicator), UX-DR10 (AttentionWrapper)

### Epic 2: The Rail — Order Flow & Station View
Marco receives orders on his station tablet, sees them prioritized by urgency, and bumps them through stages with one tap — even when WiFi drops. Orders flow into the system from POS via API or manual entry.
**FRs covered:** FR1-FR8, FR49, FR54-FR57, FR58, FR60-FR63
**UX-DRs:** UX-DR2 (TicketCard), UX-DR3 (BumpButton), UX-DR6 (Badge86 inline), UX-DR11 (Station View layout), UX-DR18 (action hierarchy), UX-DR19-DR21 (feedback, loading, empty states), UX-DR23 (error handling levels 1-3), UX-DR24-DR25 (high contrast, kitchen accessibility)

### Epic 3: Kitchen Intelligence — Expeditor Dashboard
Adrienne sees all stations on a single command-center dashboard, spots problems via attention-driven UI (problems glow, healthy fades), reassigns orders, manages inventory and 86'd items, and monitors Service Tempo — on iPad or wall-mounted TV.
**FRs covered:** FR9-FR23, FR59
**UX-DRs:** UX-DR4 (ServiceTempoGauge), UX-DR5 (StationStatusIndicator), UX-DR6 (Badge86 board), UX-DR12 (Expeditor Dashboard layout), UX-DR20-DR21 (loading/empty states)

### Epic 4: Customer & Delivery Ecosystem
Priya scans a QR code and instantly sees her order status updating in real-time — no app, no login. Jason sees accurate ETAs on the Delivery Board and arrives right as food hits the shelf, confirming pickup with one tap.
**FRs covered:** FR24-FR31
**UX-DRs:** UX-DR7 (CustomerProgressSteps), UX-DR8 (CountdownETA), UX-DR13 (Customer Tracker layout), UX-DR14 (Delivery Board layout), UX-DR20-DR21 (loading/empty states)

### Epic 5: Supplier Integration & Auto-Reorder
Linda logs into the Supplier Portal, sees demand signals from 40 restaurant clients, confirms auto-triggered reorders, and batches deliveries by route — eliminating emergency orders. Restaurants see supplier confirmation status in Kitchen Status.
**FRs covered:** FR32-FR37
**UX-DRs:** UX-DR15 (Supplier Portal layout), UX-DR20-DR21 (loading/empty states)

### Epic 6: Administration & Multi-Location Management
Alex onboards new restaurants through a guided wizard (stations, stages, menu import, POS credentials, demo simulator). David views all his locations from a single dashboard and drills down to identify bottlenecks. Admins monitor adoption metrics across the platform.
**FRs covered:** FR39-FR41, FR44-FR48
**UX-DRs:** UX-DR16 (Admin Console layout), UX-DR17 (Management Console layout), UX-DR22 (navigation patterns)

### Epic 7: API Platform & Developer Experience
Dev integrates her POS system in 3 days using FoodTech's documentation portal, sandbox environment, and webhook subscriptions. The integration is secure (API key + HMAC signing) and reliable (webhook retry with dead-letter queue).
**FRs covered:** FR50-FR53
**UX-DRs:** None (developer tooling)

## Epic 1: Platform Foundation & Restaurant Setup

Alex can create a restaurant tenant, configure staff roles, and team members can log in to role-appropriate views. The foundational infrastructure (multi-tenancy, auth, RBAC, real-time event bus, design token system) is established — invisible to users but enabling everything that follows.

### Story 1.1: Monorepo Scaffold & Development Environment

As a **developer**,
I want a fully initialized monorepo with backend, frontend, supplier-portal, and shared-types packages running via Docker Compose,
So that I have a working development environment to build all FoodTech features upon.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `docker compose up`
**Then** PostgreSQL starts on :5432, Redis on :6379, NestJS backend on :3000 (with health endpoint returning 200), Vite frontend on :5173, and supplier-portal on :5174
**And** npm workspaces are configured so `packages/shared-types` is importable from all packages
**And** Turborepo `turbo.json` orchestrates build/test/lint tasks
**And** `tsconfig.base.json` provides shared TypeScript strict-mode configuration
**And** `.env.example` files exist for backend and root with documented variables
**And** `.github/workflows/ci.yml` runs lint + test + build in parallel per package

### Story 1.2: Database Schema & Tenant Isolation

As a **platform operator**,
I want a tenant-isolated database schema with the core entity hierarchy,
So that every restaurant's operational data is securely separated at the query layer.

**Acceptance Criteria:**

**Given** the PostgreSQL database is running
**When** I run Drizzle Kit migrations
**Then** the following tables exist: `organizations`, `locations` (primary tenant), `users`, `staff` (user-to-location-role mapping)
**And** every operational table has a `tenant_id` column (referencing `locations.id`) with an index `idx_{table}_tenant_id`
**And** all tables use UUID v4 primary keys, snake_case naming, and `created_at`/`updated_at` timestamps
**And** a `TenantScopeInterceptor` NestJS interceptor extracts `tenant_id` from JWT and injects it as a WHERE clause on every Drizzle query
**And** a database seed script creates a test organization with 2 locations and sample staff

### Story 1.3: Staff Authentication & JWT Token Management

As a **restaurant staff member**,
I want to log in with my credentials and receive a JWT token pair,
So that I can securely access my role-appropriate view.

**Acceptance Criteria:**

**Given** a staff member exists in the database with email and bcrypt-hashed password (cost factor 12)
**When** they POST to `/api/v1/auth/login` with valid credentials
**Then** they receive a 200 response with `accessToken` (JWT, 15-min expiry) and `refreshToken` (7-day expiry)
**And** the JWT payload contains `userId`, `tenantId`, `role`, and `email`

**Given** an access token has expired
**When** the client POSTs to `/api/v1/auth/refresh` with a valid refresh token
**Then** a new access token and rotated refresh token are returned
**And** the previous refresh token is invalidated

**Given** invalid credentials are provided
**When** they POST to `/api/v1/auth/login`
**Then** a 401 response is returned in RFC 7807 format
**And** no token or user information is leaked in the error response

**Given** a valid JWT
**When** it is used to access any protected endpoint
**Then** the `AuthGuard` validates the token and populates `request.user`

### Story 1.4: Role-Based Access Control & Guard Chain

As a **system administrator**,
I want 9 RBAC roles enforced across all API endpoints via a guard chain,
So that users can only access features and data appropriate to their role and tenant.

**Acceptance Criteria:**

**Given** the 9 roles are defined: `line_cook`, `head_chef`, `location_manager`, `org_owner`, `customer`, `delivery_partner`, `supplier`, `supplier_api`, `system_admin`
**When** a request passes through the guard chain
**Then** `AuthGuard` validates the JWT, `TenantGuard` verifies the user belongs to the requested tenant, and `RolesGuard` checks the user's role against the `@Roles()` decorator on the controller method

**Given** a line_cook attempts to access an admin-only endpoint
**When** the request reaches the `RolesGuard`
**Then** a 403 response is returned in RFC 7807 format with `type: "https://foodtech.app/errors/forbidden"`

**Given** a user with a valid JWT for tenant A attempts to access tenant B's data
**When** the request reaches the `TenantGuard`
**Then** a 403 response is returned and no cross-tenant data is exposed

**And** custom decorators `@Roles()`, `@CurrentUser()`, and `@TenantScoped()` are implemented and documented
**And** a Zod validation pipe (`ZodValidationPipe`) validates all incoming DTOs

### Story 1.5: Real-Time Event Infrastructure

As a **kitchen user**,
I want real-time event delivery via WebSocket with tenant-isolated channels,
So that all views update instantly when kitchen state changes.

**Acceptance Criteria:**

**Given** a WebSocket gateway is configured with Socket.io
**When** an authenticated client connects
**Then** the connection is authenticated via JWT (sent as handshake auth), assigned to the `/tenant-{id}` namespace, and joined to appropriate rooms based on role

**Given** the Redis adapter is configured
**When** multiple backend instances are running
**Then** events emitted on one instance are received by clients connected to other instances via Redis pub/sub

**Given** a `FoodTechEvent<T>` is emitted (with `event`, `payload`, `tenantId`, `timestamp`, `eventId` fields)
**When** it is broadcast to a tenant namespace
**Then** only clients in that tenant's namespace receive it
**And** event delivery completes within 200ms (server to connected client)

**Given** a client disconnects
**When** it reconnects with a valid JWT
**Then** it is automatically re-authenticated, re-joined to its rooms, and receives any missed state via a full state sync mechanism

**And** the `shared-types` package exports the `FoodTechEvent<T>` interface and all event name constants

### Story 1.6: Design Token System & Foundation Components

As a **frontend developer**,
I want a design token system with context-adaptive CSS custom properties and foundation components,
So that all views render with appropriate styling for their target environment (kitchen/office/mobile).

**Acceptance Criteria:**

**Given** the design token CSS files are created (colors, spacing, typography, animation, breakpoints)
**When** `KitchenTokenProvider` wraps a component
**Then** CSS custom properties reflect kitchen values: `--ft-target-size: 48dp`, `--ft-contrast-mode: high`, `--ft-info-density: sparse`, dark theme colors (#1A1D23 background)

**When** `OfficeTokenProvider` wraps a component
**Then** CSS custom properties reflect office values: `--ft-target-size: 36dp`, `--ft-contrast-mode: normal`, `--ft-info-density: dense`, light theme colors (#F8F9FB background)

**And** the `ConnectionIndicator` component is implemented with 3 states: connected (green dot), reconnecting (amber pulsing + text), offline (red + "bumps will sync" text), with `role="status"` and `aria-live="polite"`

**And** the `AttentionWrapper` HOC is implemented with 5 attention levels (healthy, watching, warning, critical, resolved), applying opacity, scale, glow, and pulse per the UX spec, respecting `prefers-reduced-motion`

**And** the traffic-light status system is implemented with triple-encoding (color + icon + pattern) as reusable utility classes/components

**And** Inter and JetBrains Mono fonts are loaded with the kitchen and office type scales

### Story 1.7: Subscription Tier Feature Gates

As a **platform operator**,
I want subscription tier enforcement (Indie/Growth/Enterprise),
So that features are properly restricted by plan level.

**Acceptance Criteria:**

**Given** a location has a subscription tier stored in the `locations` table
**When** a request is made to a tier-gated feature (e.g., supplier API access on Indie tier)
**Then** a 403 response is returned in RFC 7807 format with `type: "https://foodtech.app/errors/tier-restricted"` and `detail` explaining which tier is required

**Given** the tier definitions: Indie (1 location, 10 staff, no supplier API), Growth (10 locations, supplier portal), Enterprise (unlimited, supplier API, SSO)
**When** an org_owner on Growth tier attempts to add an 11th location
**Then** the system returns a 403 with upgrade guidance

**And** a `@TierGated('growth')` decorator and `TierGuard` are implemented for NestJS controllers
**And** tier limits are configurable via environment variables (not hardcoded)

## Epic 2: The Rail — Order Flow & Station View

Marco receives orders on his station tablet, sees them prioritized by urgency, and bumps them through stages with one tap — even when WiFi drops. Orders flow into the system from POS via API or manual entry.

### Story 2.1: Order Data Model & Station Configuration

As a **location manager**,
I want to configure kitchen stations and order stages for my restaurant,
So that incoming orders can be routed to the right stations and tracked through my kitchen's workflow.

**Acceptance Criteria:**

**Given** the database is running
**When** Drizzle migrations are applied
**Then** tables exist: `stations` (name, emoji, display_order, tenant_id), `order_stages` (name, sequence, tenant_id), `orders` (order_number, status, tenant_id, timestamps), `order_items` (order_id, item_name, station_id, stage, quantity)

**Given** an authenticated location_manager
**When** they POST to `/api/v1/stations` with `{ name: "Grill", emoji: "🔥", displayOrder: 1 }`
**Then** a station is created for their tenant and returned with a 201 response

**Given** an authenticated location_manager
**When** they POST to `/api/v1/order-stages` with a sequence of stages
**Then** configurable stages are saved (default: received → preparing → plating → served)

**And** all entities follow Architecture naming: snake_case tables, UUID PKs, `idx_` indexes, `tenant_id` on every table

### Story 2.2: Order Ingestion API (POS & Manual Entry)

As a **POS system** or **kitchen staff member**,
I want to submit orders to FoodTech via REST API or quick-entry interface,
So that orders appear on the correct station's queue automatically.

**Acceptance Criteria:**

**Given** a valid API key (for POS) or authenticated staff member
**When** they POST to `/api/v1/orders` with `{ orderNumber, items: [{ itemName, stationId, quantity }] }`
**Then** the order is created with status "received", items are routed to specified stations, and a 201 response returns the order with ID

**Given** an order is created
**When** items reference a station
**Then** each `order_item` is assigned to the correct station with initial stage matching the first configured stage

**Given** the order is created successfully
**When** the system processes it
**Then** an `order.created` event is emitted via WebSocket to the tenant namespace with full order payload wrapped in `FoodTechEvent<T>`

**Given** a malformed order payload (missing items, invalid stationId)
**When** submitted via API
**Then** a 422 response is returned in RFC 7807 format with field-level Zod validation errors

**And** API authentication supports both JWT (staff) and API key + HMAC (POS) via the guard chain

### Story 2.3: Station View — Ticket Queue & Display

As a **line cook (Marco)**,
I want to see only my station's orders displayed as ticket cards sorted by urgency,
So that I always know what to cook next without searching.

**Acceptance Criteria:**

**Given** Marco logs in with role `line_cook` assigned to the "Grill" station
**When** the Station View loads
**Then** only orders with items assigned to "Grill" are displayed as TicketCard components in a single-column stack

**Given** tickets are displayed
**When** they are sorted
**Then** they are ordered by urgency (time in current stage, oldest first), with the most urgent ticket at the top

**Given** each TicketCard renders
**Then** it shows: order number (monospace, large), item list with quantities, elapsed time in current stage, and station label
**And** cards use the attention-driven system: healthy (0.7 opacity), watching (0.85), warning (amber glow, 2s pulse at 5+ min), critical (red glow, 1s pulse at 8+ min)

**Given** the Station View layout
**Then** it uses dark theme (KitchenTokenProvider), single column, portrait-optimized for 7"-10" tablet, with ConnectionIndicator visible
**And** there is zero navigation UI — only a station selector dropdown as UI chrome
**And** the view meets WCAG 2.1 AA with 56dp+ touch targets, high contrast, and triple-encoded status indicators

**Given** no tickets exist for the station
**When** the view loads
**Then** an empty state displays: "No tickets right now. Orders will appear here automatically."

**And** skeleton loading shows 3 ticket card placeholders while data loads

### Story 2.4: Bump-to-Advance Interaction

As a **line cook (Marco)**,
I want to tap a single bump button to advance my ticket to the next stage,
So that I can move through orders quickly without any friction.

**Acceptance Criteria:**

**Given** a TicketCard is displayed in Station View with a BumpButton
**When** Marco taps the bump button
**Then** the ticket visually slides to the next stage (200ms ease-out animation) immediately via optimistic UI — before server confirmation
**And** the next ticket in the queue rises to fill the gap
**And** the stage counter updates (e.g., "Preparing: 4 → 3")

**Given** the bump button component
**Then** it renders as a full-width button at the bottom of the ticket card, 56dp height, "BUMP →" label, brand blue (#3B82F6), with no confirmation dialog
**And** touch feedback is immediate: press state darkens (50ms), brief scale-down (0.98)
**And** keyboard activation via Enter/Space is supported
**And** `aria-label="Advance order [number] to [next stage]"`

**Given** Marco bumps the last item in an order
**When** the order reaches the final stage ("served")
**Then** the ticket fades out (300ms) and an `order.completed` event is emitted

**Given** the server rejects a bump (e.g., order was cancelled)
**When** the rejection arrives
**Then** the ticket snaps back to its previous stage with an amber flash, and a non-blocking toast notification explains why

**And** a POST to `/api/v1/orders/:orderId/bump` advances the order to the next configured stage and emits `order.stage.changed` event

### Story 2.5: Real-Time Order Updates & Event Propagation

As a **kitchen user**,
I want all views to update in real-time when any order event occurs,
So that everyone sees the same current state within 500ms.

**Acceptance Criteria:**

**Given** a bump event occurs on one Station View
**When** the `order.stage.changed` event propagates
**Then** all clients in the tenant namespace receive the event within 500ms (end-to-end)
**And** the TanStack Query cache is updated via `queryClient.setQueryData()` in the `useSocket()` hook — no manual refetch needed

**Given** a new order is created (via API or manual entry)
**When** the `order.created` event fires
**Then** the appropriate station's ticket queue updates automatically with the new ticket sliding in with a brief highlight animation (0.5s)

**Given** the `useSocket()` React hook is configured
**Then** it manages Socket.io connection lifecycle, auto-reconnection, room joining based on user role, and integrates WebSocket events with TanStack Query cache
**And** connection state is exposed to the ConnectionIndicator component

**And** the frontend uses TanStack Query for initial data fetch (GET `/api/v1/orders?stationId=X`) and WebSocket for subsequent real-time updates
**And** Zustand `authStore` manages user/token/tenant/role state
**And** React Router routes to Station View based on `line_cook` role on login

### Story 2.6: Offline Resilience & State Sync

As a **line cook (Marco)**,
I want to keep bumping orders even when WiFi drops,
So that my cooking flow is never interrupted by network issues.

**Acceptance Criteria:**

**Given** the Station View is loaded and WiFi drops
**When** Marco taps the bump button
**Then** the bump succeeds locally via optimistic UI (ticket moves on screen), the bump action is queued in Zustand `offlineStore` (persisted to localStorage), and the ConnectionIndicator changes to "Offline — bumps will sync"

**Given** WiFi is restored
**When** the WebSocket reconnects
**Then** all queued bumps are replayed to the server in order
**And** the server responds with current state, and any conflicts are resolved (e.g., if another user bumped the same ticket, the local state is corrected)
**And** the ConnectionIndicator returns to green "Connected"

**Given** the Station View loads on a slow connection
**When** the initial data fetch is in progress
**Then** the cached ticket queue from localStorage (via Zustand persist) is displayed immediately while fresh data loads in the background

**And** error handling follows UX levels 1-3 only for kitchen views: level 1 (silent auto-retry for reconnect attempts), level 2 (amber ConnectionIndicator), level 3 (inline "data may be delayed" if stale for 30+ seconds)
**And** kitchen views never show level 4-5 blocking errors — the cook can always bump

### Story 2.7: Order Progress Tracking & Timeline

As a **kitchen user**,
I want to see mini-timeline progress bars and time tracking on each ticket,
So that I can identify which orders are aging and need attention.

**Acceptance Criteria:**

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

### Story 2.8: Responsive Display & Kitchen Accessibility

As a **kitchen user on various devices**,
I want the Station View to work on 7" budget tablets through 65" TV displays,
So that the interface is usable regardless of hardware.

**Acceptance Criteria:**

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

## Epic 3: Kitchen Intelligence — Expeditor Dashboard

Adrienne sees all stations on a single command-center dashboard, spots problems via attention-driven UI (problems glow, healthy fades), reassigns orders, manages inventory and 86'd items, and monitors Service Tempo — on iPad or wall-mounted TV.

### Story 3.1: Inventory Data Model & Tracking

As a **location manager**,
I want to configure inventory items with reorder thresholds,
So that the system can track stock levels and flag 86'd items automatically.

**Acceptance Criteria:**

**Given** the database is running
**When** Drizzle migrations are applied
**Then** tables exist: `inventory_items` (item_name, current_quantity, reorder_threshold, is_86d, tenant_id), `prep_checklists` (station_id, tenant_id), `checklist_items` (checklist_id, description, is_completed)

**Given** an authenticated location_manager
**When** they POST to `/api/v1/inventory-items` with `{ itemName: "Salmon", currentQuantity: 20, reorderThreshold: 5 }`
**Then** the item is created for their tenant and returned with a 201 response

**Given** an inventory item's `current_quantity` reaches zero
**When** the system updates the item
**Then** `is_86d` is set to true and an `inventory.86d` event is emitted to the tenant namespace

**Given** an inventory item's quantity drops below `reorder_threshold`
**When** the decrement occurs
**Then** an `inventory.reorder.triggered` event is emitted with item details and suggested quantity

### Story 3.2: Auto-Decrement Inventory on Bump

As an **expeditor (Adrienne)**,
I want inventory to decrement automatically when orders are bumped through stages,
So that stock levels are always accurate without manual counting.

**Acceptance Criteria:**

**Given** an order item is associated with inventory items (via item name or configured mapping)
**When** a bump advances the order to a consumption stage (configurable, default: "preparing")
**Then** the associated inventory items are decremented by the order item quantity

**Given** an inventory item was at quantity 6 and an order consumes 1
**When** the decrement occurs
**Then** the item quantity becomes 5 and an `inventory.updated` event is emitted
**And** if the new quantity is at or below the reorder threshold, an `inventory.reorder.triggered` event is also emitted

**Given** an inventory item reaches zero
**When** the 86'd status is set
**Then** all active views receive an `inventory.86d` event and Badge86 components appear on affected ticket cards across all views within 500ms

### Story 3.3: Station Status & Prep Checklists

As a **kitchen staff member**,
I want to see station readiness status and complete prep checklists before service,
So that the kitchen is prepared and the expeditor has visibility into readiness.

**Acceptance Criteria:**

**Given** a station has a prep checklist configured
**When** a cook views their station before service
**Then** a checklist panel shows all items with checkboxes (using Radix Checkbox with indeterminate state)

**Given** all checklist items for a station are completed
**When** the last item is checked
**Then** the station status changes to "ready" (green) and a `kitchen.status.changed` event is emitted

**Given** a station's status is calculated from ticket load
**Then** the status indicators use the traffic-light system:
- Green (#10B981 + checkmark): 0-3 active tickets, all flowing
- Yellow (#F59E0B + warning): 4-6 tickets OR any ticket > warning threshold
- Red (#EF4444 + alert): 7+ tickets OR any ticket > critical threshold

**And** station status is exposed via GET `/api/v1/kitchen-status/stations` returning all stations with status, ticket count, and checklist completion

### Story 3.4: Service Tempo Calculation & Display

As an **expeditor (Adrienne)**,
I want a real-time Service Tempo health metric for my kitchen,
So that I can assess overall kitchen flow at a single glance.

**Acceptance Criteria:**

**Given** the kitchen has active orders
**When** the Service Tempo is calculated
**Then** it represents the rolling average minutes per ticket across all stations, updated in real-time as bumps occur

**Given** the tempo value relative to the target (configurable, default 5 minutes)
**Then** the ServiceTempoGauge displays:
- Green (< target): calm, no animation, "Flowing" label
- Amber (1-2x target): slow pulse (2s cycle), "Watch" label
- Red (> 2x target): fast pulse (1s cycle) + glow, "Critical" label

**Given** the ServiceTempoGauge component
**Then** it shows: large monospace tempo number, "avg minutes per ticket" label, progress bar (green to amber to red), target and critical range labels
**And** variants: `large` (64px number for TV/dashboard) and `compact` (32px for sidebar)
**And** ARIA: `role="meter"`, `aria-label="Service Tempo: [value] minutes, status [green/amber/red]"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`

**Given** a tempo change occurs
**When** the `tempo.updated` event is emitted
**Then** all Expeditor Dashboard clients update the gauge within 500ms

**And** the backend `TempoService` recalculates on every bump event and emits `tempo.updated` with value, status, and per-station breakdown

### Story 3.5: Expeditor Dashboard — 3-Panel Layout

As an **expeditor (Adrienne)**,
I want a single-screen command center showing The Rail, Kitchen Status, and Service Tempo,
So that I can monitor all stations without scrolling or switching views.

**Acceptance Criteria:**

**Given** Adrienne logs in with role `head_chef`
**When** the Expeditor Dashboard loads
**Then** a 3-panel layout displays: The Rail (all orders across all stations as compact TicketCards), Kitchen Status (all stations as StationStatusIndicator components), and Service Tempo (ServiceTempoGauge)
**And** all three panels are visible simultaneously with no scrolling required on iPad landscape or TV

**Given** the dashboard layout
**Then** it uses dark theme (KitchenTokenProvider), landscape-optimized, with ConnectionIndicator in the header
**And** there is minimal navigation — stations expand/collapse within the dashboard via tap

**Given** a StationStatusIndicator is tapped
**When** it expands
**Then** individual tickets for that station are shown inline with `aria-expanded="true"`
**And** the station can be collapsed back

**Given** the dashboard is accessed on a wall-mounted TV (1920x1080+)
**When** rendered
**Then** auto-scaling applies: larger type, increased spacing, display-only mode (no interactive elements)
**And** Kitchen TV mode activates via `?mode=tv` URL parameter or fullscreen API detection

**And** skeleton loading shows 3-panel skeleton with gray station dots while data loads
**And** empty state shows "All clear. Kitchen is idle." with Service Tempo gauge at zero

### Story 3.6: Attention-Driven UI & Bottleneck Detection

As an **expeditor (Adrienne)**,
I want problems to visually glow and healthy operations to fade,
So that my eye is drawn to what needs attention without manually scanning the dashboard.

**Acceptance Criteria:**

**Given** all stations are flowing normally
**When** the dashboard renders
**Then** all StationStatusIndicators display at 0.7 opacity with green status — the dashboard feels calm and quiet

**Given** one station's tickets exceed the warning threshold
**When** the station enters warning state
**Then** its StationStatusIndicator transitions to 1.0 opacity, amber background tint, slow pulse (2s) — Adrienne notices in peripheral vision within 5 seconds

**Given** a station enters critical state (tickets > 8 min or 7+ active tickets)
**When** the critical state applies
**Then** the StationStatusIndicator shows 1.0 opacity, red background tint, fast pulse (1s) — demands immediate attention

**Given** Adrienne resolves the issue (manually or via order reassignment)
**When** the station returns to healthy
**Then** a brief green flash plays (200ms), then the station fades back to 0.7 opacity — confirming resolution

**Given** the backend detects a bottleneck
**When** a station's average ticket time exceeds other stations by 2x
**Then** an alert indicator appears on that station and Service Tempo reflects the impact
**And** the `tempo.updated` event includes a `stationBreakdown` array identifying the problematic station

### Story 3.7: Order Reassignment & Expeditor Actions

As an **expeditor (Adrienne)**,
I want to reassign orders between stations and revert accidental bumps,
So that I can rebalance kitchen load and correct mistakes.

**Acceptance Criteria:**

**Given** Adrienne views a ticket on the Expeditor Dashboard
**When** she reassigns it to a different station (via drag or reassign action)
**Then** the ticket moves to the new station's queue, a POST to `/api/v1/orders/:orderId/reassign` updates the backend, and an `order.stage.changed` event propagates to all views

**Given** Marco accidentally bumped a ticket
**When** Adrienne taps the ticket and selects "Revert"
**Then** the ticket returns to its previous stage, a POST to `/api/v1/orders/:orderId/revert` processes the change, and all views update
**And** a confirmation dialog appears for revert actions (destructive action pattern — one confirmation step)

**Given** the 86 Board panel on the Expeditor Dashboard
**When** rendered
**Then** all currently 86'd items are displayed as Badge86 components (board variant — larger) with item name, time since 86'd, and which station is affected

**Given** a manager restocks an item
**When** they update inventory via PATCH `/api/v1/inventory-items/:id`
**Then** the item's `is_86d` flag is cleared, the Badge86 is removed from all views, and an `inventory.updated` event is emitted

## Epic 4: Customer & Delivery Ecosystem

Priya scans a QR code and instantly sees her order status updating in real-time — no app, no login. Jason sees accurate ETAs on the Delivery Board and arrives right as food hits the shelf, confirming pickup with one tap.

### Story 4.1: Customer Order Token & Tracking Link Generation

As a **system (on behalf of Priya)**,
I want to generate a unique tracking token and URL when an order is created,
So that customers can track their order without creating an account or installing an app.

**Acceptance Criteria:**

**Given** a new order is created via POST `/api/v1/orders`
**When** the order is persisted successfully
**Then** the system generates a unique, cryptographically random token (≥32 characters), creates a tracking URL in the format `/track/:token`, stores the token in the `orders` table with a 24-hour expiry timestamp, and returns the tracking URL in the order response body

**Given** the restaurant has QR code generation enabled
**When** the tracking URL is generated
**Then** a QR code image is generated server-side (PNG, 200x200px minimum) and available at `/api/v1/orders/:orderId/qr` for receipt printing

**Given** a tracking token has expired (>24 hours)
**When** a customer visits the tracking URL
**Then** the system returns a friendly error page: "This link has expired" with no order details revealed — no auth bypass possible

### Story 4.2: Customer Tracker — Real-Time Status Page

As **Priya (customer)**,
I want to see my order's current status, progress through stages, and estimated time to ready on a single mobile-optimized page,
So that I know exactly when to pick up my food without asking anyone.

**Acceptance Criteria:**

**Given** Priya scans the QR code and opens the tracking URL
**When** the token is valid and the order exists
**Then** the page loads in under 2 seconds, displays the CustomerProgressSteps component (4 steps: Received → Preparing → Plating → Ready), current stage label, and estimated time to ready — all visible without scrolling on a 375px-wide viewport

**Given** the Customer Tracker page is loaded
**When** rendered
**Then** the CustomerProgressSteps component displays with `role="progressbar"`, `aria-label="Order progress: [current stage] of 4 stages"`, `aria-valuenow=[step number]`, `aria-valuemax=4`, per-step states: `done` (green, checkmark), `active` (blue, pulsing softly), `pending` (gray, number)

**Given** Priya is viewing the Customer Tracker
**When** the order stage changes on the backend (e.g., Preparing → Plating)
**Then** the progress step advances with a smooth animation, the stage label updates, and the ETA recalculates — delivered via WebSocket `order.stage.changed` event, no page refresh required

**Given** the order reaches the "Ready" stage
**When** the Customer Tracker updates
**Then** a celebration micro-animation plays, the status shows "Ready! Pick up at counter", and the ETA is replaced with "NOW"

**Given** the Customer Tracker page
**When** rendered on any mobile device
**Then** max-width is 480px, system fonts are used as fallback, no tracking cookies are set (token is in URL only), and the page works in any modern mobile browser (Chrome, Safari, Firefox)

### Story 4.3: Customer ETA & Status Push Notifications

As **Priya (customer)**,
I want to receive real-time ETA updates and status change notifications while I'm on the tracker page,
So that I can do other things and still know exactly when my food will be ready.

**Acceptance Criteria:**

**Given** Priya has the Customer Tracker open
**When** the WebSocket connection is established using the order token
**Then** the connection subscribes to `order.stage.changed` and `order.eta.updated` events for that specific order only — no cross-order visibility

**Given** the kitchen state changes (e.g., station load shifts)
**When** the ETA is recalculated
**Then** the displayed ETA updates smoothly (no jarring jumps), with accuracy within ±3 minutes of actual ready time as specified in FR27

**Given** the ETA display
**When** rendered at different stages
**Then** confidence levels are reflected: "Received" shows "~15 min" (low confidence), "Preparing" shows "~8 min" (medium confidence), "Plating" shows "~2 min" (high confidence), "Ready" shows "NOW" (certain)

**Given** the WebSocket connection drops (e.g., mobile network flicker)
**When** the connection is re-established
**Then** the page receives the current order state and updates immediately — no stale data displayed

### Story 4.4: Delivery Board — Ready Queue & ETAs

As **Jason (delivery partner)**,
I want to see a real-time queue of ready and upcoming orders with accurate ETAs on the Delivery Board,
So that I can time my arrivals perfectly and never wait at the restaurant.

**Acceptance Criteria:**

**Given** Jason accesses the Delivery Board at `/delivery/:locationId`
**When** authenticated via location API key
**Then** the board displays a sorted list of orders: ready orders at top (green border + "Pick Up" button), then upcoming orders sorted by ETA ascending, each showing CountdownETA component with large minute number, "min" unit label, and current stage label

**Given** the CountdownETA component
**When** rendered on the Delivery Board
**Then** it displays a large number (minutes), "min" unit label, and stage label ("Plating", "Preparing"), with `role="timer"`, `aria-label="Estimated [X] minutes until ready"`, updates every 30 seconds from live kitchen state

**Given** the Delivery Board is displayed
**When** an order's stage changes on the backend
**Then** the order's position in the queue updates in real-time via WebSocket, the CountdownETA recalculates, and newly-ready orders animate to the top of the list — ETA accuracy within ±2 minutes per FR29

**Given** the Delivery Board
**When** displayed on a wall-mounted TV (32"-65") in display-only mode
**Then** the layout auto-scales for readability from 10+ feet away, no touch interaction required, large text and high-contrast colors, auto-refreshing via WebSocket

**Given** the Delivery Board on mobile
**When** Jason views it on his phone
**Then** the layout is glanceable and one-handed operable, with touch targets minimum 48x48dp, optimized for quick looks while driving (large ETAs, clear ready indicators)

### Story 4.5: Delivery Pickup Confirmation & Queue Prioritization

As **Jason (delivery partner)**,
I want to confirm order pickup with one tap and see the queue prioritized by readiness and wait time,
So that I can complete pickups efficiently and ensure no order waits too long.

**Acceptance Criteria:**

**Given** an order is in "Ready" status on the Delivery Board
**When** Jason taps the "Pick Up" button (one tap — no confirmation dialog for non-destructive action)
**Then** a POST to `/api/v1/delivery/orders/:orderId/pickup` marks the order as picked up, the order is removed from the board with a slide-out animation, an `order.picked_up` event is emitted updating the Customer Tracker (Priya sees "Picked up by driver"), and the board re-sorts remaining orders

**Given** the Delivery Board queue
**When** multiple orders are in various stages
**Then** the queue is prioritized: (1) Ready orders sorted by wait time descending (longest-waiting first), (2) Upcoming orders sorted by ETA ascending (soonest-ready first) — per FR31

**Given** an order has been ready for more than 5 minutes without pickup
**When** the Delivery Board renders
**Then** the order's card enters an attention state (AttentionWrapper with `level="warning"`) to flag it as potentially forgotten

**Given** the delivery pickup flow
**When** the `order.picked_up` event is emitted
**Then** the event propagates to all connected views: Customer Tracker updates status, Expeditor Dashboard clears the order from the rail, and the order's lifecycle advances to "completed" stage

## Epic 5: Supplier Integration & Auto-Reorder

Linda logs into the Supplier Portal, sees demand signals from 40 restaurant clients, confirms auto-triggered reorders, and batches deliveries by route — eliminating emergency orders. Restaurants see supplier confirmation status in Kitchen Status.

### Story 5.1: Supplier Data Model & Restaurant Linking

As a **system (on behalf of Linda and restaurant admins)**,
I want a cross-tenant supplier data model with many-to-many restaurant links,
So that suppliers can view inventory and demand signals only from restaurants they are linked to.

**Acceptance Criteria:**

**Given** the database schema
**When** the supplier tables are created via Drizzle migration
**Then** a `Supplier` entity exists (cross-tenant, not scoped to a single location), a `SupplierRestaurantLink` join table establishes many-to-many relationships between suppliers and locations, and a `SupplierOrder` entity tracks reorders with fields: `id`, `supplier_id`, `location_id`, `items`, `status` (pending/confirmed/shipped/delivered), `created_at`, `confirmed_at`

**Given** a supplier (Linda) is linked to 40 restaurants
**When** she queries `/api/v1/supplier/restaurants`
**Then** she receives only the restaurants she is linked to — no access to unlinked restaurant data, enforced at the query layer via `SupplierRestaurantLink` join (not application-level filtering)

**Given** a restaurant admin wants to link a supplier
**When** they create a link via POST `/api/v1/admin/supplier-links`
**Then** the link is created with the restaurant's `location_id` and the supplier's `supplier_id`, and the supplier can immediately see that restaurant's inventory data

### Story 5.2: Supplier Portal Authentication & Dashboard

As **Linda (supplier)**,
I want to log into a dedicated Supplier Portal and see a dashboard of demand signals across all my linked restaurants,
So that I can proactively manage inventory and spot trends.

**Acceptance Criteria:**

**Given** Linda navigates to the Supplier Portal (separate SPA, separate domain from the restaurant app)
**When** she logs in with her supplier credentials
**Then** she receives a JWT with `role: 'supplier'` and `supplierId` claim, and the portal loads the DemandDashboard component showing aggregated inventory levels and consumption trends across all linked restaurants

**Given** the DemandDashboard is loaded
**When** rendered
**Then** it displays: (1) total pending reorders count, (2) restaurants approaching reorder thresholds (sorted by urgency), (3) consumption trend charts per item category, (4) a RestaurantFilter component to filter by specific client — all data fetched via GET `/api/v1/supplier/demand`

**Given** Linda is viewing the dashboard
**When** an `inventory.reorder.triggered` event fires from any linked restaurant
**Then** the dashboard updates in real-time via WebSocket (room: `supplier:{supplierId}`), and a notification badge appears on the orders tab

### Story 5.3: Auto-Reorder Trigger & Supplier Notification

As a **system (on behalf of restaurants and suppliers)**,
I want inventory items that hit their reorder threshold to automatically generate purchase orders sent to the linked supplier,
So that restaurants never run out of critical ingredients and suppliers receive orders without manual intervention.

**Acceptance Criteria:**

**Given** an inventory item's quantity drops below its `reorder_threshold` (set during restaurant onboarding)
**When** the InventoryService detects the threshold breach (triggered by `inventory.updated` event after a bump-to-advance decrement)
**Then** the system creates a `SupplierOrder` with status `pending`, the order includes item name, requested quantity (`reorder_quantity` from the item config), location name, and a "deliver-by" suggestion based on current consumption rate, and an `inventory.reorder.triggered` event is emitted

**Given** the auto-reorder is triggered
**When** the event reaches the Supplier Portal via WebSocket
**Then** the order appears in Linda's pending orders queue with restaurant name, item, quantity, and deliver-by date

**Given** the supplier is configured for API integration (Enterprise tier)
**When** the auto-reorder triggers
**Then** the system also pushes the purchase order to the supplier's external system via POST to their configured webhook URL (outbound API per FR36), with HMAC-signed payload

### Story 5.4: Reorder Review, Confirmation & Batch Operations

As **Linda (supplier)**,
I want to review, confirm, and batch auto-triggered reorders from my restaurant clients,
So that I can efficiently manage fulfillment and optimize delivery routes.

**Acceptance Criteria:**

**Given** Linda views the OrderTable on the Supplier Portal
**When** pending reorders are displayed
**Then** each order shows: restaurant name, item, quantity, deliver-by date, and a "Confirm" button — confirming a single order takes 1 click (2 seconds per the UX spec)

**Given** Linda wants to confirm multiple orders at once
**When** she selects 2 or more orders via checkboxes and clicks "Confirm Selected" on the BatchActionBar
**Then** all selected orders are confirmed simultaneously via POST `/api/v1/supplier/orders/batch-confirm`, each order's status changes to `confirmed`, and confirmation events are emitted per order

**Given** Linda has confirmed multiple orders
**When** she clicks "Batch Route" on the BatchActionBar
**Then** the orders are grouped by delivery route (geographic proximity of restaurant locations), Linda can set delivery times per batch, and the routing is processed via POST `/api/v1/supplier/orders/batch-route` — batching 5 orders takes ~20 seconds vs 30+ minutes via phone

**Given** Linda confirms or routes an order
**When** the confirmation event is emitted
**Then** the linked restaurant sees the confirmation status in Kitchen Status: "Confirmed — arriving [date/time]" — visible to expeditors and managers

### Story 5.5: Supplier Consumption Trends & Demand Intelligence

As **Linda (supplier)**,
I want to view aggregated consumption trends and demand signals across my restaurant clients,
So that I can proactively stock items and identify growth opportunities.

**Acceptance Criteria:**

**Given** Linda navigates to the demand intelligence view on the Supplier Portal
**When** the view loads
**Then** it displays aggregated inventory levels across all linked restaurants, consumption rate trends (daily/weekly), items trending upward (proactive stocking opportunities), and items frequently 86'd (supply gap indicators) — all fetched via GET `/api/v1/supplier/trends`

**Given** Linda filters by a specific restaurant
**When** she selects a restaurant in the RestaurantFilter
**Then** the trends data scopes to that single restaurant, showing item-level consumption history and reorder frequency

**Given** the data displayed
**When** rendered
**Then** all cross-tenant data access is enforced via `SupplierRestaurantLink` — Linda can only see data from restaurants she is linked to, and no data from unlinked restaurants is ever returned by the API

### Story 5.6: Supplier Order Status in Kitchen Views

As **Adrienne (expeditor) or David (owner)**,
I want to see supplier order confirmation status in the Kitchen Status area,
So that I know when resupply is arriving and can plan around inventory gaps.

**Acceptance Criteria:**

**Given** a supplier has confirmed a reorder for the restaurant
**When** the Expeditor Dashboard or Management Console renders Kitchen Status
**Then** the confirmed supplier order appears with: item name, supplier name, expected delivery date/time, and status (confirmed/shipped/delivered) — visible alongside the 86 Board for context

**Given** a supplier updates an order's status (e.g., shipped, delivered)
**When** the status change is received via WebSocket `supplier.order.updated` event
**Then** the Kitchen Status area updates in real-time, and when status reaches "delivered" the item's reorder status is cleared

**Given** an auto-reorder was triggered but the supplier has not confirmed within 4 hours
**When** the Expeditor Dashboard renders
**Then** the pending reorder enters an attention state (AttentionWrapper with `level="warning"`) flagging it as unconfirmed — giving the expeditor a cue to follow up manually

## Epic 6: Administration & Multi-Location Management

Alex onboards new restaurants through a guided wizard (stations, stages, menu import, POS credentials, demo simulator). David views all his locations from a single dashboard and drills down to identify bottlenecks. Admins monitor adoption metrics across the platform.

### Story 6.1: Admin Tenant Configuration Wizard

As **Alex (system admin)**,
I want a step-by-step wizard to create and configure new restaurant tenants,
So that I can onboard restaurants quickly with all required settings in place.

**Acceptance Criteria:**

**Given** Alex opens the Admin Console and clicks "New Restaurant"
**When** the wizard loads
**Then** it presents an 8-step configuration flow: (1) Basic Info — name, location count, subscription tier, (2) Station Layout — add/name stations, (3) Order Stages — configure flow stages (default: received → preparing → plating → ready), (4) Menu Import — CSV upload or manual entry, (5) Inventory Thresholds — set reorder points per item, (6) Staff Roles — assign users to roles from the 9-role RBAC matrix, (7) POS Integration — generate API credentials, (8) Review & Activate

**Given** Alex completes step 1 (Basic Info)
**When** he submits the form
**Then** a new tenant is created via POST `/api/v1/admin/tenants` with a unique `tenant_id`, the subscription tier is set (Indie/Growth/Enterprise), and all subsequent steps operate within this tenant context

**Given** Alex reaches step 8 (Review & Activate)
**When** he reviews the configuration summary
**Then** all configured settings are displayed for verification, and an "Activate" button creates all database records (stations, stages, staff accounts, inventory items) in a single transaction — the restaurant is immediately usable

**Given** the wizard form fields
**When** rendered
**Then** all forms use React Hook Form + Zod resolver with schemas shared with the backend, Radix UI Select for dropdowns, and validation errors are inline and descriptive

### Story 6.2: CSV Menu & Inventory Import

As **Alex (system admin)**,
I want to import menu items and inventory from a CSV file during onboarding,
So that restaurants don't have to manually enter hundreds of items.

**Acceptance Criteria:**

**Given** Alex reaches step 4 (Menu Import) in the onboarding wizard
**When** he uploads a CSV file
**Then** the system parses the CSV via POST `/api/v1/admin/tenants/:tenantId/import/menu`, validates each row against the menu item Zod schema (name, category, stations, inventory_items), and displays a preview table showing valid rows (green) and invalid rows (red with error details)

**Given** the CSV preview is displayed
**When** Alex clicks "Import"
**Then** all valid rows are inserted as menu items linked to their inventory items, invalid rows are skipped with a downloadable error report (CSV), and the import count is displayed ("Imported 142 of 150 items")

**Given** the CSV contains inventory items
**When** imported
**Then** each item is created with default `reorder_threshold` and `reorder_quantity` values that Alex can adjust in step 5 (Inventory Thresholds)

### Story 6.3: API Credential Generation for POS Integration

As **Alex (system admin)**,
I want to generate API credentials for restaurant POS integrations during onboarding,
So that POS vendors can connect to FoodTech's order ingestion API.

**Acceptance Criteria:**

**Given** Alex reaches step 7 (POS Integration) in the wizard
**When** he clicks "Generate API Credentials"
**Then** the system creates a new API key + HMAC secret pair via POST `/api/v1/admin/tenants/:tenantId/api-keys`, displays both values with a "Copy" button, and shows a warning that the secret will not be shown again after leaving this page

**Given** the API credentials are generated
**When** displayed
**Then** the page also shows the webhook URL for the tenant's order ingestion endpoint (`/api/v1/ingest/orders`) and a link to the API documentation portal

**Given** an admin wants to revoke or rotate credentials
**When** they access the tenant settings after onboarding
**Then** they can revoke existing keys via DELETE `/api/v1/admin/tenants/:tenantId/api-keys/:keyId` and generate new ones — revocation is immediate

### Story 6.4: Demo Simulator

As **Alex (system admin) and restaurant owners**,
I want to run a demo simulator that generates realistic order patterns through the real backend,
So that new restaurants can see FoodTech in action before going live and staff can practice bumping.

**Acceptance Criteria:**

**Given** Alex has completed tenant configuration
**When** he clicks "Run Demo Simulator" (offered at step 8 or from Admin Console)
**Then** the simulator starts via POST `/api/v1/simulator/start` with configurable pace (`rush`, `steady`, `slow`), generating realistic orders that flow through the full event pipeline (API → database → event bus → WebSocket → all views)

**Given** the simulator is running
**When** orders are generated
**Then** tickets appear on the Station View Rail, Kitchen Status updates with inventory decrements, Service Tempo responds to the simulated load, and all views update in real-time — proving the architecture works end-to-end

**Given** staff interact with simulated orders
**When** a cook bumps a simulated ticket
**Then** the bump is processed identically to a real order (same API, same events, same inventory decrement) — ensuring staff learn the real workflow

**Given** the simulator is running
**When** Alex clicks "Stop Simulator" or the simulator completes its configured order count
**Then** all simulated orders are flagged as `is_simulated: true` in the database, and an option to "Clear Simulated Data" removes them without affecting real data

### Story 6.5: Organization Dashboard & Multi-Location Views

As **David (organization owner)**,
I want to view all my locations from a single dashboard and drill down to identify bottlenecks,
So that I can manage multiple restaurants without driving between them.

**Acceptance Criteria:**

**Given** David logs in with the `organization_owner` role
**When** the Management Console loads
**Then** it displays a card grid of all locations under his organization (up to subscription tier limit: Indie=1, Growth=10, Enterprise=unlimited), each card showing: location name, current Service Tempo status (green/amber/red), active order count, and staff on duty — fetched via GET `/api/v1/organizations/:orgId/locations`

**Given** the location cards are displayed
**When** David clicks a location card
**Then** the view transitions seamlessly (summary-to-detail pattern) to the individual location detail, showing the same Expeditor Dashboard data: Station Status, Kitchen Status, Service Tempo, and the order rail — drill-down per FR41

**Given** David is viewing the organization dashboard
**When** a location's Service Tempo changes
**Then** the card updates in real-time via WebSocket (David subscribes to events for all locations in his organization), and locations with amber/red Tempo rise to the top of the grid

**Given** David wants to compare locations
**When** he views the consolidated dashboard
**Then** cross-location analytics are available: average ticket times, order volumes, Service Tempo history, and inventory alerts across all locations — accessible via sidebar navigation (per UX-DR22 navigation pattern)

### Story 6.6: Adoption Metrics & Monitoring Dashboard

As **Alex (system admin)**,
I want to monitor adoption metrics across onboarded restaurants,
So that I can identify underperforming locations and proactively support them.

**Acceptance Criteria:**

**Given** Alex opens the Admin Console adoption dashboard
**When** the dashboard loads
**Then** it displays per-tenant metrics: bump usage rate (% of tickets bumped vs manually processed), prep checklist completion rate, active users per day, Service Tempo average, and days since onboarding — fetched via GET `/api/v1/admin/metrics/adoption`

**Given** a tenant has low bump adoption (e.g., <50% after 3 days)
**When** the dashboard renders
**Then** the tenant is flagged with an attention indicator, and Alex can drill down to see which stations or staff are underperforming

**Given** the metrics are displayed
**When** Alex wants to track a specific restaurant
**Then** he can view a timeline of adoption metrics from onboarding date to present, showing the adoption curve and identifying when staff engagement peaked or dropped

### Story 6.7: Subscription Tier Management & Feature Gates

As **David (organization owner) or Alex (admin)**,
I want the system to enforce subscription tier limits and allow tier upgrades,
So that features are gated appropriately and growth-path upsells are clear.

**Acceptance Criteria:**

**Given** a tenant is on the Indie tier
**When** the owner attempts to add a second location
**Then** the system displays a clear upgrade prompt: "Your Indie plan supports 1 location. Upgrade to Growth for up to 10 locations" with a CTA to upgrade — the action is blocked, not silently ignored

**Given** a tenant is on the Growth tier
**When** the owner accesses the Management Console
**Then** the Supplier Portal integration, CSV import/export, cross-location analytics, and priority support features are enabled — features not available on Indie are visible but gated with upgrade prompts

**Given** any tier-gated action
**When** the backend processes the request
**Then** tier enforcement is applied via the subscription gate middleware (established in Epic 1, Story 1.7), returning a 403 with a RFC 7807 error body: `{ type: "tier-limit-exceeded", detail: "Feature requires Growth tier or above" }`

## Epic 7: API Platform & Developer Experience

Dev integrates her POS system in 3 days using FoodTech's documentation portal, sandbox environment, and webhook subscriptions. The integration is secure (API key + HMAC signing) and reliable (webhook retry with dead-letter queue).

### Story 7.1: Webhook Subscription & Event Delivery

As **Dev (POS integration developer)**,
I want to subscribe to order status webhooks so my POS system receives real-time events when orders progress,
So that I can keep my system synchronized with FoodTech without polling.

**Acceptance Criteria:**

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

### Story 7.2: Sandbox Environment for Integration Testing

As **Dev (POS integration developer)**,
I want a sandbox environment where I can test my integration against realistic data without affecting production,
So that I can build and debug my integration safely.

**Acceptance Criteria:**

**Given** Dev generates sandbox credentials via the developer portal or API
**When** she creates a sandbox tenant via POST `/api/v1/integrations/sandbox`
**Then** a fully functional test tenant is provisioned with sample stations, stages, menu items, and inventory — isolated from production data, with a sandbox flag on all API responses

**Given** the sandbox is active
**When** Dev sends orders to the sandbox's ingestion endpoint
**Then** orders flow through the full pipeline (API → database → event bus → WebSocket) identically to production, including webhook delivery to registered sandbox URLs — allowing end-to-end integration testing

**Given** the sandbox environment
**When** Dev runs tests
**Then** sandbox data is automatically cleaned up after 7 days of inactivity, rate limits are relaxed (higher limits than production), and sandbox API responses include an `X-FoodTech-Environment: sandbox` header

**Given** Dev wants to trigger specific scenarios
**When** she uses the demo simulator API (`POST /api/v1/simulator/start`) within the sandbox
**Then** realistic order patterns generate events that exercise her webhook subscriptions — allowing her to test event handling without manually creating orders

### Story 7.3: API Documentation Portal

As **Dev (POS integration developer)**,
I want comprehensive, interactive API documentation,
So that I can understand and use the FoodTech API without contacting support.

**Acceptance Criteria:**

**Given** Dev navigates to the API documentation portal
**When** the page loads at `/api/docs`
**Then** the Swagger UI displays the auto-generated OpenAPI 3.0 specification from NestJS controller decorators, with all endpoints grouped by module (orders, inventory, webhooks, integrations), request/response schemas, authentication requirements, and example payloads

**Given** the documentation portal
**When** Dev browses endpoints
**Then** each endpoint shows: HTTP method, path, description, required headers (auth), request body schema (with Zod validation rules), response schema, error responses (RFC 7807 format), and rate limit information

**Given** Dev wants to try an endpoint
**When** she uses the "Try It" feature in Swagger UI
**Then** she can authenticate with her API key, send requests to the sandbox environment, and see live responses — enabling interactive exploration

**Given** the OpenAPI spec
**When** Dev needs client SDK generation
**Then** the spec is exportable as JSON/YAML at `/api/docs/openapi.json`, compatible with standard code generators (openapi-generator, swagger-codegen) for any language

### Story 7.4: API Key Management & Webhook Security

As **Dev (POS integration developer) or Alex (admin)**,
I want to manage API keys and webhook signing secrets securely,
So that integrations are authenticated and webhook payloads are tamper-proof.

**Acceptance Criteria:**

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
