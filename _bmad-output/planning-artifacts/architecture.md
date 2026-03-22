---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: ['prd.md', 'ux-design-specification.md', 'product-brief-bmad-demo-2026-03-22.md', 'prd-validation-report.md', 'brainstorming-session-2026-03-22-01.md']
workflowType: 'architecture'
project_name: 'FoodTech'
user_name: 'TT'
date: '2026-03-22'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
63 FRs across 10 capability areas — Order Lifecycle (FR1-10), Kitchen Status & Inventory (FR11-18), Service Tempo (FR19-23), Customer Transparency (FR24-27), Delivery Optimization (FR28-31), Supplier Integration (FR32-37), Multi-Tenancy (FR38-43), Platform Admin (FR44-48), API Platform (FR49-53), Real-Time Infrastructure (FR54-57), Display & Accessibility (FR58-63).

Architecturally, these decompose into 4 distinct system boundaries:
1. **Kitchen Operations Core** — order lifecycle, station management, inventory, Service Tempo (FR1-23). This is the hot path — real-time, high-frequency writes.
2. **Ecosystem Views** — customer tracker, delivery board (FR24-31). Read-heavy, externally-facing, must handle untrusted traffic.
3. **Supplier Platform** — separate auth domain, cross-tenant data access (FR32-37). Different SPA, different data model.
4. **Platform Infrastructure** — multi-tenancy, RBAC, event bus, API platform, admin (FR38-63). Foundation everything else builds on.

**Non-Functional Requirements:**
60+ NFRs across 6 categories that drive critical architectural decisions:

| NFR Category | Key Architectural Driver |
|-------------|------------------------|
| **Performance** | < 500ms event propagation end-to-end; < 2s FMP on budget Android; < 500KB gzipped initial bundle |
| **Security** | JWT + refresh tokens; tenant isolation at database query layer; OWASP API Top 10; token-based customer auth (no login) |
| **Scalability** | Stateless app servers; WebSocket multi-node with pub/sub adapter; 1,000+ events/sec per tenant; row-level tenant scoping |
| **Reliability** | 99.9% uptime; offline Station View with local cache; auto-reconnect with full state sync; graceful degradation between subsystems |
| **Accessibility** | WCAG 2.1 AA all views; 48dp+ touch targets; triple-encoded status (color + icon + pattern); prefers-reduced-motion |
| **Integration** | RESTful + OpenAPI 3.0; WebSocket with namespace-per-tenant; inbound POS webhooks; outbound supplier API |

**UX Design Specification — Architectural Implications:**
The UX spec (14 steps, 1300+ lines) reveals significant architectural requirements:
- **7 purpose-built views** with different device targets, themes, and interaction models — suggests a design token / context-aware rendering system
- **9 custom components** with attention-driven state management (opacity, pulse, glow animations driven by data freshness)
- **Optimistic UI** for bump actions — requires local state management with server reconciliation
- **Offline resilience** for Station View — local cache, queued bumps, state sync on reconnect
- **Zero-friction customer tracking** — QR code → token-based web page, no auth, no cookies, 24-hour expiry
- **Device-first responsive strategy** — not "one layout, many screens" but "each view targets its device"
- **Context-adaptive design tokens** — CSS custom properties that change based on rendering context (kitchen/office/mobile)

### Scale & Complexity

- **Primary domain:** Full-stack real-time SaaS platform
- **Complexity level:** High — multi-tenant, real-time event-driven, multi-stakeholder, 7 distinct view types, offline resilience, cross-tenant supplier access
- **Estimated architectural components:** ~15-20 major components (API gateway, auth service, event bus, order engine, inventory service, tenant manager, WebSocket layer, 2 SPAs, notification system, demo simulator, admin tools, supplier API gateway, monitoring/observability)

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|-----------|--------|--------|
| Node.js backend | Brainstorming session / PRD | Event-driven architecture natural fit; single language stack possible |
| Socket.io for WebSockets | PRD (user decision during creation) | Multi-node requires Redis adapter; broad browser compatibility; auto-fallback to long-polling |
| Budget Android tablets (2GB RAM, Android 10+) | PRD / UX spec | Performance budgets critical; < 500KB bundle; < 2s FMP; efficient DOM |
| Solo developer + AI agents | PRD resource model | Favor convention over configuration; monorepo; automated testing; minimize operational complexity |
| Greenfield project | PRD classification | No legacy constraints; can choose optimal stack; must build everything from foundation |
| Cloud-hosted SaaS only | PRD | No on-premise; single codebase multi-tenant; can leverage managed services |
| Two separate SPAs | PRD architecture section | Restaurant app (all kitchen/customer/delivery views) + Supplier Portal (different auth, cross-tenant) |

### Cross-Cutting Concerns Identified

1. **Real-time event propagation** — touches every view, every component. The event bus is the nervous system. Architecture must ensure single-source-of-truth with fanout to all subscribers within 500ms.

2. **Multi-tenant data isolation** — every database query, every API call, every WebSocket channel must be tenant-scoped. Row-level security with tenant_id on every table. This is a Critical security requirement.

3. **Offline resilience & state sync** — Station View must work during WiFi drops. Requires local state management, queued actions, and full state reconciliation on reconnect. This is the hardest real-time problem in the system.

4. **RBAC across 9 roles with different data access patterns** — from "single station read-only" (line cook) to "cross-tenant read" (supplier) to "platform-wide admin." Authorization logic must be centralized and consistent.

5. **Performance on constrained devices** — budget Android tablets in harsh kitchen environments. Bundle size, rendering performance, touch target sizes, and memory usage are first-class architectural constraints.

6. **Attention-driven UI state management** — component visual state (opacity, pulse, glow) driven by data freshness and thresholds. Requires a reactive state layer that computes attention levels from raw data.

7. **Demo simulator** — ships with the product. Must generate realistic order patterns that exercise the full event pipeline. Architectural decision: is this a client-side mock or does it go through the real backend?

## Starter Template Evaluation

### Primary Technology Domain

Full-stack real-time SaaS platform with decoupled frontend/backend architecture. Two SPAs (restaurant app + supplier portal) consuming a shared Node.js API with WebSocket event layer.

### Technical Preferences (Established)

| Decision | Source | Status |
|----------|--------|--------|
| Node.js runtime | Brainstorming session | Confirmed |
| TypeScript | PRD (TypeScript SDK mentioned), industry standard | Recommended |
| Socket.io | PRD (user decision) | Confirmed |
| Tailwind CSS v4.2 | UX Design Spec | Confirmed |
| Radix UI (unified package v1.4.3) | UX Design Spec | Confirmed |
| PostgreSQL | PRD (row-level tenant isolation, relational data) | Recommended |
| React | UX Design Spec (React context provider for design tokens) | Confirmed |

### Starter Options Considered

**Option A: T3 Stack (create-t3-app)**

| Aspect | Assessment |
|--------|-----------|
| Stack | Next.js + tRPC + Tailwind + Prisma + NextAuth |
| Pros | Full-stack typesafety, excellent DX, active community |
| Cons | Next.js is a monolith — FoodTech needs decoupled backend for WebSocket server, multi-tenant event bus, and separate SPAs. tRPC couples frontend/backend — but FoodTech needs a public REST API for POS integrations. Prisma adds generate step overhead. |
| Verdict | **Not recommended** — architectural mismatch. T3 assumes frontend and backend co-deploy. FoodTech's backend is a standalone real-time event server that multiple SPAs and external API consumers connect to. |

**Option B: Next.js 16.2 + Separate NestJS Backend**

| Aspect | Assessment |
|--------|-----------|
| Stack | Next.js 16.2 (frontend) + NestJS 11.x (backend) |
| Pros | NestJS has first-class Socket.io support (@nestjs/platform-socket.io), decorators for WebSocket gateways, built-in guards for RBAC, module system for organizing multi-tenant logic. Next.js provides SSR, routing, and optimized builds. |
| Cons | Next.js is heavy for what FoodTech needs — Station View is a single-page tablet app, not a content site. SSR adds complexity without benefit for real-time kitchen views. NestJS has significant learning curve and boilerplate. Two frameworks to maintain. |
| Verdict | **Partial fit** — NestJS backend is strong, but Next.js frontend is overkill for purpose-built SPAs that are essentially real-time dashboards. |

**Option C: Vite + React (Frontend) + NestJS (Backend) — Monorepo**

| Aspect | Assessment |
|--------|-----------|
| Frontend | Vite 6.x + React 19 + TypeScript 5.x + Tailwind CSS 4.2 + Radix UI 1.4.3 |
| Backend | NestJS 11.x + Socket.io + PostgreSQL + Drizzle ORM |
| Structure | Monorepo (npm/pnpm workspaces) with shared types package |
| Pros | Vite is lightweight and fast — perfect for SPAs that need small bundles (< 500KB for Station View). NestJS provides structured backend with WebSocket gateways, guards, and module system ideal for multi-tenant architecture. Drizzle ORM for SQL-close control, smaller bundles, and no generate step. Monorepo enables shared TypeScript types between frontend and backend without tRPC coupling. |
| Cons | No single "create" command — requires manual monorepo setup. More initial configuration than a batteries-included starter. |
| Verdict | **Recommended** — best architectural fit for FoodTech's requirements. |

**Option D: Vite + React (Frontend) + Express/Fastify (Backend)**

| Aspect | Assessment |
|--------|-----------|
| Stack | Vite + React (frontend) + Express or Fastify (backend) |
| Pros | Maximum simplicity, minimal abstraction, full control |
| Cons | No structure for organizing 63 FRs, 9 RBAC roles, multi-tenant isolation, WebSocket gateways. Would need to build all the organizational patterns NestJS provides for free. Solo developer would spend significant effort on boilerplate. |
| Verdict | **Not recommended** — too low-level for the scope of FoodTech. The backend complexity (multi-tenant, RBAC, event bus, WebSocket gateways) benefits from NestJS's module/guard/gateway patterns. |

### Selected Starter: Vite + React + NestJS Monorepo (Option C)

**Rationale for Selection:**

FoodTech's architecture requires a decoupled backend (event server + API) and thin, performant frontends (purpose-built SPAs). This combination provides:

1. **Vite + React** — fastest possible builds, smallest bundles, ideal for performance-constrained kitchen tablets
2. **NestJS** — structured backend with first-class WebSocket/Socket.io support, guards for RBAC, modules for multi-tenant isolation
3. **Drizzle ORM** — SQL-close, TypeScript-native, no generate step, smaller bundle for serverless-friendly deployment
4. **Monorepo** — shared types between frontend and backend without runtime coupling, single repo for solo developer

**Initialization Commands:**

```bash
# Create monorepo structure
mkdir foodtech && cd foodtech
npm init -y

# Backend (NestJS)
npx @nestjs/cli@latest new backend --strict --skip-git --package-manager npm

# Frontend - Restaurant App (Vite + React)
npm create vite@latest frontend -- --template react-ts

# Frontend - Supplier Portal (Vite + React)
npm create vite@latest supplier-portal -- --template react-ts

# Shared types package
mkdir -p packages/shared-types && cd packages/shared-types && npm init -y
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.x across all packages (NestJS `--strict` flag enables strict TS)
- Node.js 20 LTS runtime for backend
- ES modules throughout

**Styling Solution:**
- Tailwind CSS v4.2 (added post-init via `@tailwindcss/vite` plugin)
- Radix UI v1.4.3 (unified package — `npm install radix-ui`)
- CSS custom properties for design token system (per UX spec)

**Build Tooling:**
- Vite 6.x for frontend builds (fast HMR, optimized production bundles)
- NestJS CLI for backend builds (webpack under the hood)
- npm workspaces for monorepo dependency management

**Testing Framework:**
- Vitest for frontend (Vite-native, Jest-compatible API)
- Jest for NestJS backend (NestJS default, excellent integration)
- Playwright for E2E testing (cross-browser, mobile emulation)

**Code Organization:**

```
foodtech/
├── backend/                  # NestJS API + WebSocket server
│   ├── src/
│   │   ├── modules/          # Feature modules (orders, inventory, tenants, etc.)
│   │   ├── gateways/         # Socket.io WebSocket gateways
│   │   ├── guards/           # RBAC + tenant isolation guards
│   │   ├── common/           # Shared decorators, pipes, interceptors
│   │   └── database/         # Drizzle schema, migrations
│   └── test/
├── frontend/                 # Restaurant SPA (all kitchen/customer/delivery views)
│   ├── src/
│   │   ├── views/            # Station, Expeditor, Customer, Delivery, Management
│   │   ├── components/       # 9 custom components from UX spec
│   │   ├── hooks/            # WebSocket, auth, tenant context
│   │   ├── tokens/           # Design token system
│   │   └── stores/           # Client-side state (Zustand or similar)
│   └── public/
├── supplier-portal/          # Supplier SPA (separate auth, cross-tenant)
│   ├── src/
│   │   ├── views/
│   │   ├── components/
│   │   └── hooks/
│   └── public/
├── packages/
│   └── shared-types/         # Shared TypeScript types and interfaces
│       └── src/
│           ├── events.ts     # WebSocket event types
│           ├── models.ts     # Domain model types
│           └── api.ts        # API request/response types
├── package.json              # Workspace root
└── turbo.json                # Turborepo (optional — build orchestration)
```

**Database:**
- PostgreSQL (relational, row-level tenant isolation, robust indexing)
- Drizzle ORM (TypeScript-native schema, SQL-close queries, ~7.4KB bundle)
- Drizzle Kit for migrations

**Development Experience:**
- Vite HMR for instant frontend updates
- NestJS watch mode for backend hot-reload
- Shared types auto-update across packages
- Monorepo means single `git clone`, single CI pipeline

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Data architecture — multi-tenant schema design, tenant isolation strategy
2. Authentication & authorization — JWT strategy, RBAC enforcement, customer token auth
3. Real-time event architecture — event bus design, Socket.io namespace/room topology
4. State management — client-side state for offline resilience and optimistic UI

**Important Decisions (Shape Architecture):**
5. API design — REST conventions, error handling, versioning
6. Frontend routing — role-based view routing, code splitting
7. Infrastructure — hosting, CI/CD, environment management
8. Monitoring & observability

**Deferred Decisions (Post-MVP):**
- CDN and edge caching strategy (optimize after traffic patterns emerge)
- Read replica configuration (not needed until 100+ tenants)
- SSO/SAML integration (Enterprise tier — Phase 4+)
- Mobile-native app architecture (Phase 6)

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | PostgreSQL 16 | Relational integrity for multi-tenant data; row-level security; robust indexing for tenant-scoped queries; JSONB for flexible menu/config data |
| **ORM** | Drizzle ORM (latest) | TypeScript-native schema; SQL-close queries; no generate step; ~7.4KB bundle; excellent PostgreSQL support |
| **Tenant isolation** | Shared database, row-level tenant scoping | `tenant_id` column on every operational table; enforced via Drizzle query wrapper (not application-level filtering); NestJS interceptor auto-injects tenant_id |
| **Migration strategy** | Drizzle Kit | Schema-as-code; generate SQL migrations from TypeScript schema diffs; version-controlled migrations |
| **Caching** | Redis 7.x | Socket.io adapter for multi-node WebSocket (required); session store; hot data cache (active orders, kitchen status); pub/sub for event fanout |
| **Data validation** | Zod | Runtime validation at API boundaries; shared schemas between frontend/backend via shared-types package; Drizzle schema ↔ Zod schema integration |

**Tenant Schema Design:**

```
┌─────────────────────────────────────────────────┐
│ Organization (optional parent)                   │
│  └─ Location (primary tenant)                    │
│      ├─ Station                                  │
│      ├─ Order → OrderItem                        │
│      ├─ InventoryItem                            │
│      ├─ PrepChecklist → ChecklistItem            │
│      ├─ Staff (role-scoped)                      │
│      └─ SupplierLink → SupplierOrder             │
│                                                  │
│ Supplier (cross-tenant entity)                   │
│  └─ SupplierRestaurantLink (many-to-many)        │
│                                                  │
│ User (global, linked to Staff per location)       │
└─────────────────────────────────────────────────┘
```

Every query in the system passes through a `TenantScope` interceptor that:
1. Extracts `tenant_id` from the authenticated user's JWT
2. Injects it as a WHERE clause on every database query
3. Prevents cross-tenant data access at the query layer (not application layer)

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Auth framework** | @nestjs/passport + @nestjs/jwt | NestJS-native; Passport strategies for different auth flows; JWT guards for route protection |
| **Token strategy** | JWT access (15 min) + refresh token (7 days) | Short-lived access tokens for security; refresh rotation prevents token theft; stateless API verification |
| **Password hashing** | bcrypt (cost factor 12) | Industry standard; sufficient for auth volume |
| **Customer auth** | Token-based, no login | Unique order token in URL (UUID v4); 24-hour expiry; no cookies, no session, no account required |
| **Delivery partner auth** | Location-scoped API key | Simple, per-location key for delivery board access; rate-limited |
| **Supplier auth** | Standard JWT (separate auth domain) | Supplier Portal is a separate SPA with its own login flow; cross-tenant read access to linked restaurants only |
| **API auth (POS/machine)** | API key + HMAC signature | Per-tenant API keys; request body signed with HMAC-SHA256; IP allowlisting (optional) |
| **RBAC enforcement** | NestJS Guards + custom decorators | `@Roles('cook', 'expeditor')` decorator on controllers; `RolesGuard` validates JWT role claim against route requirement; tenant-scoped |
| **Secrets management** | Environment variables (dev); cloud secret manager (prod) | No secrets in code; `.env` files for local dev; cloud-native secret injection in production |

**RBAC Guard Flow:**

```
Request → AuthGuard (JWT valid?) → TenantGuard (tenant_id matches?) → RolesGuard (role authorized?) → Controller
```

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API style** | RESTful with OpenAPI 3.0 | POS integrators expect REST; NestJS has excellent Swagger/OpenAPI integration via @nestjs/swagger |
| **API versioning** | URL prefix (`/api/v1/`) | Simple, explicit; NestJS versioning module; 6-month deprecation window per PRD |
| **Request/response format** | JSON; ISO 8601 timestamps; UTC internally | Industry standard; Zod validation on all inputs |
| **Error handling** | RFC 7807 Problem Details | Structured error responses: `{ type, title, status, detail, instance }`; consistent across all endpoints |
| **Rate limiting** | @nestjs/throttler | Per-tenant, per-endpoint limits; Enterprise tier gets higher limits; 429 responses with Retry-After header |
| **API documentation** | @nestjs/swagger (auto-generated from decorators) | OpenAPI 3.0 spec generated from NestJS controller decorators; Swagger UI at `/api/docs`; exportable for SDK generation |
| **WebSocket topology** | Namespace-per-tenant, room-per-view | `/tenant-{id}` namespace isolates events; rooms: `station:{stationId}`, `expeditor`, `customer:{orderId}`, `delivery`, `supplier:{supplierId}` |
| **Event format** | Typed events via shared-types | `{ event: string, payload: T, timestamp: ISO8601, tenantId: string }` — type-safe across frontend/backend |
| **Webhook delivery** | Outbound with retry (3x exponential backoff) | Dead-letter queue for failed deliveries; webhook signing with HMAC |

**WebSocket Event Flow:**

```
Cook bumps order
  → Backend: OrderService.advanceStage()
  → Backend: EventBus.emit('order.stage.changed', payload)
  → Socket.io gateway fans out to rooms:
      ├─ room 'station:{stationId}' → Station View updates
      ├─ room 'expeditor' → Dashboard updates
      ├─ room 'customer:{orderId}' → Customer Tracker updates
      ├─ room 'delivery' → Delivery Board updates
      └─ Redis pub/sub → other server nodes
  → Webhook: POST to POS callback URL (if subscribed)
  → InventoryService: decrement items
      → If threshold hit: SupplierService.triggerReorder()
```

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State management** | Zustand 5.x | Lightweight (~1KB); no boilerplate; perfect for UI state, auth state, and offline queue; most popular React state lib in 2026 |
| **Server state** | TanStack Query 5.x | Cache management for REST API calls; WebSocket events update query cache via `queryClient.setQueryData()`; optimistic updates built-in |
| **Routing** | React Router 7.x (SPA mode) | Declarative routing; `ssr: false` for pure SPA; nested routes for view hierarchy; role-based route guards |
| **Code splitting** | React.lazy + Suspense per view | Station View bundle stays < 500KB; Expeditor Dashboard loads separately; Supplier Portal is entirely separate SPA |
| **Design tokens** | CSS custom properties via React context | `KitchenTokenProvider` vs `OfficeTokenProvider` — same components, different visual treatment per UX spec |
| **Offline support** | Zustand persist + service worker | Station View: Zustand persists current ticket queue to localStorage; bump actions queue locally; service worker caches static assets |
| **WebSocket client** | socket.io-client + custom React hook | `useSocket()` hook manages connection, reconnection, room joining; integrates with TanStack Query cache for real-time updates |
| **Forms** | React Hook Form + Zod resolver | Admin Console and Supplier Portal forms; Zod schemas shared with backend for consistent validation |
| **Accessibility** | Radix UI primitives + axe-core in CI | Radix handles ARIA, focus management, keyboard nav; axe-core blocks PRs with violations |

**Frontend State Architecture:**

```
┌─────────────────────────────────────────┐
│ TanStack Query Cache (server state)      │
│  └─ orders, stations, inventory, tempo   │
│     ↑ WebSocket events update cache      │
├─────────────────────────────────────────┤
│ Zustand Stores (client state)            │
│  ├─ authStore (user, role, tenant)       │
│  ├─ uiStore (theme, layout, attention)   │
│  └─ offlineStore (queued bumps, cache)   │
├─────────────────────────────────────────┤
│ React Context (non-state)                │
│  ├─ DesignTokenContext (kitchen/office)   │
│  └─ SocketContext (connection instance)   │
└─────────────────────────────────────────┘
```

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Cloud provider** | AWS (primary) | Mature managed services; RDS for PostgreSQL; ElastiCache for Redis; ECS or App Runner for containers; S3 for assets |
| **Containerization** | Docker | NestJS backend + Vite build artifacts served via nginx; multi-stage builds for small images |
| **CI/CD** | GitHub Actions | Monorepo-aware; parallel jobs for frontend/backend; automated testing, linting, axe-core accessibility checks |
| **Deployment strategy** | Blue-green (via AWS) | Zero-downtime deployments per PRD requirement; instant rollback capability |
| **Environment management** | 3 environments: dev, staging, prod | Dev: local Docker Compose (PostgreSQL + Redis + backend + frontends); Staging: AWS (mirrors prod); Prod: AWS |
| **Static assets** | S3 + CloudFront CDN | Vite builds to S3; CloudFront serves frontend SPAs; cache-busted filenames |
| **Monitoring** | Application: structured JSON logging + CloudWatch | NestJS interceptors log all requests; structured JSON for searchability; CloudWatch dashboards for metrics |
| **Error tracking** | Sentry | Frontend and backend error capture; source maps uploaded in CI; release tracking |
| **WebSocket monitoring** | Custom metrics → CloudWatch | Connection count, event throughput, reconnection rate, message delivery latency — all critical for kitchen reliability |
| **Local development** | Docker Compose | Single `docker compose up` starts PostgreSQL, Redis, backend, and both frontends; hot-reload for all |

**Demo Simulator Decision:**

The demo simulator runs through the **real backend** — not a client-side mock. Rationale:
- Exercises the full event pipeline (API → database → event bus → WebSocket → all views)
- Proves the architecture works end-to-end during onboarding
- Implemented as a NestJS module (`SimulatorModule`) with configurable order patterns
- Admin triggers via API: `POST /api/v1/simulator/start { pace: 'rush' | 'steady' | 'slow' }`

### Decision Impact Analysis

**Implementation Sequence:**

1. PostgreSQL + Drizzle schema + tenant isolation (foundation for everything)
2. NestJS auth module (JWT + guards + RBAC — gates all API access)
3. Socket.io gateway + Redis adapter (real-time infrastructure)
4. Shared-types package (TypeScript types for events, models, API)
5. Frontend scaffold (Vite + React Router + Zustand + TanStack Query + design tokens)
6. Order lifecycle module (The Rail — first feature on top of infrastructure)

**Cross-Component Dependencies:**

| Decision | Depends On | Required By |
|----------|-----------|-------------|
| Tenant isolation | Drizzle schema | All modules — every query is tenant-scoped |
| JWT auth | PostgreSQL (user table) | All API endpoints, WebSocket connections |
| RBAC guards | JWT auth | Route-level access control |
| Socket.io rooms | Tenant isolation, auth | All real-time views |
| TanStack Query cache | Socket.io client, REST API | All frontend views |
| Zustand offline store | TanStack Query | Station View offline resilience |
| Design tokens | React Context | All frontend components |

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 28 areas where AI agents could make different choices, grouped into 5 categories.

### Naming Patterns

**Database Naming Conventions:**

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case, plural | `orders`, `order_items`, `inventory_items` |
| Columns | snake_case | `tenant_id`, `created_at`, `order_number` |
| Primary keys | `id` (UUID v4, text type) | `id: text('id').primaryKey()` |
| Foreign keys | `{referenced_table_singular}_id` | `order_id`, `station_id`, `tenant_id` |
| Indexes | `idx_{table}_{columns}` | `idx_orders_tenant_id`, `idx_orders_tenant_id_status` |
| Enums | PascalCase TypeScript enum, snake_case DB values | `OrderStatus` → `'received'`, `'preparing'`, `'plating'`, `'served'` |
| Timestamps | `created_at`, `updated_at` (UTC, ISO 8601) | Always present on every table |
| Boolean columns | `is_` prefix | `is_active`, `is_86d` |

**API Naming Conventions:**

| Element | Convention | Example |
|---------|-----------|---------|
| Endpoints | `/api/v1/{resource}` plural, kebab-case | `/api/v1/orders`, `/api/v1/inventory-items` |
| Route params | `:paramName` camelCase | `/api/v1/orders/:orderId` |
| Query params | camelCase | `?stationId=abc&status=preparing` |
| Request body | camelCase JSON | `{ "orderNumber": "47", "stationId": "grill" }` |
| Response body | camelCase JSON | `{ "id": "...", "orderNumber": "47", "createdAt": "..." }` |
| HTTP verbs | Standard REST | GET (list/read), POST (create), PATCH (partial update), DELETE (remove) |
| List responses | Wrapped with pagination | `{ "data": [...], "meta": { "total": 100, "page": 1, "limit": 25 } }` |
| Single responses | Direct object | `{ "id": "...", "orderNumber": "47" }` |
| Custom headers | `X-FoodTech-{Name}` | `X-FoodTech-Tenant-Id`, `X-FoodTech-Request-Id` |

**Code Naming Conventions:**

| Element | Convention | Example |
|---------|-----------|---------|
| **Backend (NestJS)** | | |
| Files | kebab-case | `order.service.ts`, `tenant.guard.ts`, `create-order.dto.ts` |
| Classes | PascalCase | `OrderService`, `TenantGuard`, `CreateOrderDto` |
| Methods | camelCase, verb-first | `createOrder()`, `findByTenantId()`, `advanceStage()` |
| Interfaces | PascalCase, no `I` prefix | `Order`, `CreateOrderPayload` (not `IOrder`) |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS`, `DEFAULT_PAGE_SIZE` |
| NestJS modules | `{Feature}Module` | `OrderModule`, `AuthModule`, `TenantModule` |
| NestJS services | `{Feature}Service` | `OrderService`, `InventoryService` |
| NestJS controllers | `{Feature}Controller` | `OrderController` |
| NestJS gateways | `{Feature}Gateway` | `OrderGateway`, `KitchenGateway` |
| NestJS guards | `{Feature}Guard` | `RolesGuard`, `TenantGuard` |
| DTOs | `{Action}{Feature}Dto` | `CreateOrderDto`, `UpdateStationDto` |
| **Frontend (React)** | | |
| Component files | PascalCase | `TicketCard.tsx`, `BumpButton.tsx` |
| Component names | PascalCase | `TicketCard`, `ServiceTempoGauge` |
| Hook files | camelCase with `use` prefix | `useSocket.ts`, `useAuth.ts` |
| Hook names | camelCase with `use` prefix | `useSocket()`, `useOrders()` |
| Store files | camelCase with `Store` suffix | `authStore.ts`, `offlineStore.ts` |
| Utility files | camelCase | `formatTime.ts`, `calculateTempo.ts` |
| Test files | Co-located, `.test.ts(x)` suffix | `TicketCard.test.tsx`, `order.service.test.ts` |
| CSS/token files | kebab-case | `kitchen-tokens.css`, `office-tokens.css` |

### Structure Patterns

**Backend Module Organization (NestJS):**

```
backend/src/modules/orders/
├── orders.module.ts          # Module definition
├── orders.controller.ts      # REST endpoints
├── orders.service.ts         # Business logic
├── orders.gateway.ts         # WebSocket gateway (if applicable)
├── orders.repository.ts      # Database queries (Drizzle)
├── dto/
│   ├── create-order.dto.ts
│   └── update-order.dto.ts
├── entities/                 # Drizzle schema for this module
│   └── order.schema.ts
├── events/
│   └── order.events.ts       # Event type definitions
└── orders.service.test.ts    # Co-located tests
```

**Every module follows this pattern.** No exceptions. AI agents must create all files in this structure when building a new feature module.

**Frontend Component Organization:**

```
frontend/src/components/TicketCard/
├── TicketCard.tsx             # Component implementation
├── TicketCard.test.tsx        # Co-located test
├── TicketCard.stories.tsx     # Storybook story (optional)
└── index.ts                   # Re-export
```

**Frontend View Organization:**

```
frontend/src/views/station/
├── StationView.tsx            # Main view component
├── StationView.test.tsx       # View tests
├── hooks/
│   └── useStationOrders.ts    # View-specific hooks
└── index.ts
```

**Test Co-location Rule:** Tests always live next to the code they test. No separate `__tests__/` directory. File naming: `{source}.test.ts(x)`.

### Format Patterns

**API Response Formats:**

Success (single resource):
```json
{
  "id": "uuid-here",
  "orderNumber": "47",
  "status": "preparing",
  "createdAt": "2026-03-22T19:30:00.000Z"
}
```

Success (list):
```json
{
  "data": [{ "id": "...", "orderNumber": "47" }],
  "meta": { "total": 150, "page": 1, "limit": 25, "totalPages": 6 }
}
```

Error (RFC 7807):
```json
{
  "type": "https://foodtech.app/errors/order-not-found",
  "title": "Order Not Found",
  "status": 404,
  "detail": "Order with ID abc-123 does not exist in this tenant",
  "instance": "/api/v1/orders/abc-123"
}
```

Validation error:
```json
{
  "type": "https://foodtech.app/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Request body contains invalid fields",
  "errors": [
    { "field": "stationId", "message": "Station ID is required" },
    { "field": "items", "message": "Order must contain at least one item" }
  ]
}
```

**HTTP Status Code Usage:**

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE |
| 400 | Malformed request |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but not authorized (wrong role/tenant) |
| 404 | Resource not found within tenant scope |
| 409 | Conflict (e.g., order already bumped by another user) |
| 422 | Validation error (well-formed but invalid data) |
| 429 | Rate limited |
| 500 | Unexpected server error |

### Communication Patterns

**WebSocket Event Naming:**

Convention: `{domain}.{entity}.{action}` — all lowercase, dot-separated.

| Event | Payload Key Fields | Emitted By |
|-------|-------------------|------------|
| `order.created` | `orderId, items, stationId` | OrderService |
| `order.stage.changed` | `orderId, fromStage, toStage, stationId` | OrderService (bump) |
| `order.completed` | `orderId, completedAt, totalTime` | OrderService |
| `kitchen.status.changed` | `stationId, status, ticketCount` | KitchenStatusService |
| `inventory.updated` | `itemId, newQuantity, is86d` | InventoryService |
| `inventory.86d` | `itemId, itemName` | InventoryService |
| `inventory.reorder.triggered` | `itemId, supplierId, quantity` | InventoryService |
| `tempo.updated` | `tempoValue, status, stationBreakdown` | TempoService |
| `connection.state` | `status: 'connected' \| 'reconnecting' \| 'offline'` | Client-side |

**Event Payload Standard:**

```typescript
interface FoodTechEvent<T> {
  event: string;           // e.g., 'order.stage.changed'
  payload: T;              // Typed payload
  tenantId: string;        // Always present
  timestamp: string;       // ISO 8601 UTC
  eventId: string;         // UUID for deduplication
}
```

**State Management Patterns:**

Zustand stores follow this pattern:

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  role: UserRole | null;
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

Rules:
- State is always immutable (use Zustand's `set` with spread)
- Actions are defined inside the store (not separate action creators)
- Selectors use Zustand's shallow equality: `useAuthStore(state => state.user)`
- No derived state in stores — compute in components or custom hooks

### Process Patterns

**Error Handling Patterns:**

Backend (NestJS):
- All errors thrown as NestJS `HttpException` subclasses
- Global exception filter converts to RFC 7807 format
- Business logic errors use custom exception classes: `OrderNotFoundException`, `TenantAccessDeniedException`
- Never catch and swallow errors silently — always log at appropriate level

Frontend (React):
- TanStack Query `onError` handles API errors globally via `QueryClient` default options
- Error boundaries at view level (Station View error doesn't crash Expeditor Dashboard)
- WebSocket errors: `useSocket()` hook handles reconnection automatically; ConnectionIndicator shows state
- User-facing errors follow UX spec severity levels (silent → ambient → inline → action required → blocking)

**Logging Pattern:**

```typescript
// Backend: structured JSON logging
logger.info('Order stage advanced', {
  orderId: order.id,
  tenantId: tenant.id,
  fromStage: 'preparing',
  toStage: 'plating',
  userId: user.id,
  duration: elapsed,
});
```

Levels: `error` (broken), `warn` (degraded), `info` (state changes), `debug` (development only).

Never log: passwords, tokens, full request bodies with sensitive data, PII beyond what's needed for debugging.

### Enforcement Guidelines

**All AI Agents MUST:**

1. Follow the naming conventions table exactly — no exceptions, no "creative" alternatives
2. Create module files in the documented structure — all files present, correctly named
3. Use the event naming convention `{domain}.{entity}.{action}` for all WebSocket events
4. Include `tenant_id` in every database query via the TenantScope interceptor — never query without tenant scoping
5. Return errors in RFC 7807 format — no custom error shapes
6. Co-locate tests with source files — never create separate test directories
7. Use Zod for all API input validation — no manual validation logic
8. Type all WebSocket events using the `FoodTechEvent<T>` wrapper from shared-types

**Pattern Enforcement:**

- ESLint rules enforce naming conventions (file naming, import patterns)
- NestJS custom decorator `@TenantScoped()` on every controller ensures tenant isolation
- CI pipeline runs `npm run lint` + `npm run test` — both must pass before merge
- Shared-types package provides canonical type definitions — frontend and backend import from the same source

### Anti-Patterns (What NOT to Do)

| Anti-Pattern | Why It's Wrong | Do This Instead |
|-------------|---------------|-----------------|
| `SELECT * FROM orders` (no tenant WHERE) | Cross-tenant data leakage | Always use TenantScope or explicit `WHERE tenant_id = ?` |
| `throw new Error('something broke')` | Unstructured error, no HTTP status | `throw new NotFoundException('Order', orderId)` |
| `event.emit('ORDER_BUMPED', data)` | Wrong event naming convention | `event.emit('order.stage.changed', payload)` |
| `const [loading, setLoading] = useState(false)` | Manual loading state | TanStack Query handles loading states |
| `if (user.role === 'cook') { ... }` in component | Role logic in UI code | `@Roles('cook')` guard on API + role-based routing |
| `fetch('/api/orders')` | Direct fetch bypasses cache and auth | `useQuery({ queryKey: ['orders'], queryFn: ... })` |
| `orders.module.spec.ts` in `__tests__/` dir | Tests separated from source | `orders.service.test.ts` next to `orders.service.ts` |
