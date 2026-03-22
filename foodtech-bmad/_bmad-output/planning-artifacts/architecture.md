---
stepsCompleted: [1, 2]
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
