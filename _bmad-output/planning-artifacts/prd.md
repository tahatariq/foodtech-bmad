---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['product-brief-bmad-demo-2026-03-22.md', 'brainstorming-session-2026-03-22-01.md']
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: 'SaaS B2B Platform + Real-time Web App'
  domain: 'Food Service / Restaurant Operations'
  complexity: 'medium'
  projectContext: 'greenfield'
---

# Product Requirements Document - FoodTech

**Author:** TT
**Date:** 2026-03-22

## Executive Summary

FoodTech is a real-time kitchen operations super app that connects every stakeholder in the restaurant ecosystem — line cooks, expeditors, owners, customers, delivery partners, and suppliers — through a single event-driven platform. One tap from a cook ripples value simultaneously: the expeditor sees tempo shift, the customer sees "plating now," the delivery driver sees "ready in 3 min," and the supplier sees inventory approaching reorder threshold.

The platform eliminates the operational overhead that keeps restaurants from doing what they do best — making great food. By automating coordination, inventory management, customer communication, and supplier replenishment, FoodTech gives restaurants of any size (single-location independents to enterprise chains) a competitive edge that transforms wasted energy into innovation: new menus, test kitchen concepts, expansion.

FoodTech serves seven distinct user types through role-optimized views on a single platform: Station View (line cooks), Expeditor Dashboard (head chefs), Management Console (owners/operators), Customer Tracker (diners), Delivery Board (delivery partners), Supplier Portal (independent suppliers), and Supplier API (enterprise distributors). Revenue is subscription-based with three tiers: Indie, Growth, and Enterprise.

### What Makes This Special

The restaurant industry's problem isn't lack of technology — it's fragmented technology. Existing solutions (Toast KDS, Square KDS, inventory tools, delivery platforms) each solve one piece in isolation, locked to specific ecosystems, and treat the kitchen as an island. FoodTech's core architectural insight is that every kitchen event is a signal that creates value for multiple stakeholders simultaneously. A single bump-to-advance action updates the order rail, adjusts Service Tempo, notifies the customer, recalculates delivery ETAs, and decrements inventory — all in real-time, all from one platform.

This isn't possible today because no one has built the connective tissue. FoodTech is that connective tissue: an event-driven super app where the entire restaurant value chain operates on shared, real-time truth. The result is next-generation restaurant operations accessible to everyone, not just well-funded chains.

## Project Classification

- **Project Type:** SaaS B2B Platform + Real-time Web App
- **Domain:** Food Service / Restaurant Operations
- **Complexity:** Medium — architecturally complex (real-time event-driven, multi-stakeholder, multi-tenant) but not heavily regulated
- **Project Context:** Greenfield — new product built from scratch

## Success Criteria

### User Success

| Persona | Success Metric | MVP Target | 12-Month Target |
|---------|---------------|------------|-----------------|
| **Marco (Line Cook)** | Ticket completion time reduction | 15%+ in pilot | 25%+ across fleet |
| **Marco** | Missed/lost ticket rate | Near zero | Zero |
| **Adrienne (Expeditor)** | Problem detection to intervention time | < 90 seconds | < 60 seconds |
| **Adrienne** | Service Tempo red-zone spikes per service | 30% fewer than baseline | 50% fewer |
| **David (Owner)** | Hours saved on operational oversight/week | 3+ hours | 5+ hours |
| **Priya (Customer)** | Order status accuracy | 90%+ | 95%+ |
| **Jason (Delivery)** | Average wait time at restaurant | < 5 minutes | < 2 minutes |
| **Suppliers** | Reactive emergency orders eliminated | 50%+ auto-triggered | 80%+ auto-triggered |

### Business Success

- **Pilot phase (months 1-3):** 3-5 pilot restaurants live and actively using FoodTech through full dinner services. At least 1 pilot with supplier integration active.
- **Growth phase (months 4-6):** 15-25 restaurants onboarded. First paying subscribers on Indie tier. Pilot restaurants retained and expanding usage.
- **Scale phase (months 7-12):** 100 restaurants on the platform. Revenue from all three tiers. Ecosystem density increasing — average restaurant has 2+ stakeholder types connected.
- **Validation signal:** A pilot restaurant says "we can't go back to the old way."

### Technical Success

| Metric | Target |
|--------|--------|
| **Data consistency** | All views reflect the same state within 500ms of any event — zero contradictions between what Marco, Adrienne, Priya, and Jason see |
| **Uptime** | 99.9% during service hours (10am-midnight local time). Zero unplanned downtime during active dinner service. |
| **Event propagation speed** | Bump-to-all-views update < 500ms (P95) |
| **UX responsiveness** | All UI interactions respond < 200ms. Zero perceived lag on bump actions. |
| **Seamless usage** | Station View usable with zero training. Expeditor Dashboard learnable in one service. |
| **Concurrent capacity** | Support 50+ simultaneous orders per kitchen without degradation |

### Measurable Outcomes

- **Primary KPI:** Monthly Active Kitchens (locations running at least 1 service/week on FoodTech)
- **Ecosystem KPI:** Ecosystem Activation Rate (% of restaurants with 2+ connected stakeholder types)
- **Efficiency KPI:** Average ticket time reduction vs. pre-FoodTech baseline
- **Revenue KPI:** MRR growth and net revenue retention
- **Quality KPI:** Zero data inconsistency incidents per 1000 services

## Product Scope

FoodTech's MVP follows a platform-first build strategy across Phases 0–4, delivering independently valuable increments from infrastructure through full ecosystem connectivity. Post-MVP phases extend into operational intelligence and platform dominance.

See **Project Scoping & Phased Development** for the complete phase-by-phase build sequence, journey mappings, and risk mitigation strategy.

## User Journeys

### Journey 1: Marco — Line Cook, Friday Night Rush

**Opening Scene:** It's 7:15 PM on a Friday. Marco is working the grill station at Bella's Trattoria, a busy independent Italian restaurant. Before FoodTech, this is the moment where tickets start piling up, verbal callouts get lost in the noise, and Marco has to physically walk to the 86 board to check if they're out of salmon. He's already stressed and service hasn't peaked yet.

**Rising Action:** Marco glances at his Station View screen — a tablet mounted at eye level on his station. Three orders are queued, color-coded by urgency. The oldest ticket glows amber — it's been in "preparing" for 6 minutes. He sees a small red badge on the salmon — it was 86'd 10 minutes ago, so he already knows not to start the salmon risotto on ticket #47. He plates the ribeye, taps the bump button. One tap. The ticket slides to "plating" and the next order moves up.

**Climax:** At 8:30 PM, the rush peaks. Marco has 7 tickets on screen. But he's calm — he can see exactly what's his, exactly what's urgent, and exactly what's available. He bumps three tickets in 90 seconds. Each bump ripples outward — but Marco doesn't think about that. He just cooks.

**Resolution:** Service ends at 10:15 PM. Marco processed 47 tickets with zero misses, zero "where's my order?" callbacks from the pass. He didn't shout once. Tomorrow he'll do it again, and it'll feel just as smooth. Marco tells the new line cook: "Just watch the screen and hit the button. That's it."

**Requirements revealed:** Station View UI, bump-to-advance, 86 visibility, ticket prioritization, minimal learning curve, tablet-optimized layout.

---

### Journey 2: Chef Adrienne — Expeditor, Managing a Double-Booking Crisis

**Opening Scene:** Adrienne is the head chef at a 120-seat restaurant that just got double-booked — a private party of 30 overlapping with a fully booked dining room. Before FoodTech, she'd be running the line physically, shouting times, mentally tracking 15 tickets across 4 stations, and praying nothing falls through.

**Rising Action:** Adrienne opens her Expeditor Dashboard on the pass screen. Service Tempo shows green — they're flowing. She can see every station's load: grill has 6 tickets (amber), sauté has 3 (green), pastry has 8 (red — backed up). She taps pastry station on the dashboard — the bottleneck is two soufflés that take 20 minutes each. She reassigns one dessert prep to the cold station to rebalance.

**Climax:** At 8:45 PM, Service Tempo flashes yellow. Three tickets on grill have been in "preparing" for over 8 minutes — the attention-driven UI makes them glow, while the 12 tickets flowing normally fade to background. Adrienne spots the problem in 15 seconds, walks to grill, discovers Marco's burner malfunctioned. She reroutes two tickets to sauté and calls for a burner swap. Total intervention time: 45 seconds from alert to action.

**Resolution:** The private party and dining room both close out within 10 minutes of each other. Kitchen Status shows all green. Adrienne reviews Service Tempo — one yellow spike at 8:45, resolved in under a minute. Before FoodTech, that burner issue would have cascaded into 20 minutes of chaos. She thinks: "I see problems before they become fires."

**Requirements revealed:** Expeditor Dashboard, Service Tempo calculation, attention-driven UI, station load visualization, ticket reassignment, real-time alerting, historical tempo view.

---

### Journey 3: David — Restaurant Owner, Opening His Third Location

**Opening Scene:** David owns two fast-casual taco shops and is opening a third. Before FoodTech, managing two locations meant driving between them, calling managers for updates, and reviewing paper reports at midnight. He has no idea how location #2 performed last Tuesday until the weekly P&L lands.

**Rising Action:** David opens FoodTech on his laptop at home. The multi-location dashboard shows all three locations at a glance. Location 1: green, steady Service Tempo, 34 orders served. Location 2: amber — ticket times are running 15% above average. Location 3 (new): green but low volume, 12 orders — expected for opening week. He drills into Location 2 and sees the grill station is backed up — they're short-staffed tonight.

**Climax:** David checks Kitchen Status for Location 2. Chicken is yellow — 30% of stock remaining, and it's only 7 PM on a Saturday. He sees the auto-reorder was triggered 20 minutes ago to their supplier. Before FoodTech, he'd have gotten a panicked call at 9 PM: "We're out of chicken." Now, the supplier is already preparing a delivery for tomorrow morning.

**Resolution:** David closes his laptop at 9:30 PM. All three locations are green. He spent 15 minutes on operational oversight instead of 3 hours driving between sites. He opens a spreadsheet — not for operations, but to plan the test kitchen menu he's been wanting to try. His energy goes into growth, not firefighting.

**Requirements revealed:** Multi-location dashboard, cross-location comparison, drill-down from overview to station level, inventory threshold alerts, auto-reorder confirmation visibility, historical performance data.

---

### Journey 4: Priya — Customer, Tracking Her Lunch Order

**Opening Scene:** Priya ordered a poke bowl from the counter at a busy lunch spot. There are 15 people waiting. Before FoodTech, she'd stand at the counter checking her phone, wondering if her order was forgotten, debating whether to ask "how much longer?"

**Rising Action:** After ordering, the cashier hands her a receipt with a QR code. Priya scans it and sees a simple status page — no app download needed. Her order shows "Received" with a small progress bar. She sits down, opens her laptop, and starts working. Two minutes later, her phone buzzes — status changed to "Preparing."

**Climax:** Priya's status updates to "Plating" and then "Ready — pickup at counter." She walks up at the exact moment her bowl appears on the shelf. The food is fresh, hot, and perfect. She didn't wait, didn't ask, didn't worry.

**Resolution:** Priya screenshots the tracker and texts it to her friend: "This place tells you exactly when your food is ready." She comes back twice that week. The transparency created trust, and trust created a repeat customer — without the restaurant spending a dollar on marketing.

**Requirements revealed:** QR code generation per order, web-based tracker (no app install), real-time status updates, push/notification on status change, clean mobile-responsive UI, order-to-tracker linking.

---

### Journey 5: Jason — Delivery Partner, Optimizing His Evening Run

**Opening Scene:** Jason drives for multiple delivery platforms. His biggest frustration: arriving at restaurants and waiting 10-15 minutes for food that's "almost ready." He loses $15-20/night in wasted time. Before FoodTech, he'd walk in blind and hope.

**Rising Action:** Jason gets a delivery assignment for Bella's Trattoria. His Delivery Board shows the order status: "Preparing — estimated ready in 8 minutes." He takes another pickup two blocks away first. Six minutes later, the board updates: "Plating — ready in 2 minutes." He starts driving to Bella's.

**Climax:** Jason walks into Bella's at the exact moment the order hits the ready shelf. He grabs the bag, confirms pickup on his app, and he's back in his car in under 90 seconds. The food is hot. The customer will be happy. He didn't wait a single minute.

**Resolution:** Over a week, Jason's average wait time at FoodTech-connected restaurants drops from 12 minutes to under 2. He starts prioritizing FoodTech restaurants when he has a choice. He's earning more per hour because he's delivering more, waiting less. He tells other drivers: "Always take the FoodTech restaurants — you never wait."

**Requirements revealed:** Delivery Board with accurate ETAs, real-time status updates, ready-order queue, estimated ready time calculation based on live kitchen state, pickup confirmation.

---

### Journey 6: Linda — Independent Supplier, Managing Her Restaurant Clients

**Opening Scene:** Linda runs a specialty produce company supplying 40 restaurants. Before FoodTech, her morning started with a stack of voicemails: "We need more arugula — we ran out last night." Emergency orders mean premium delivery fees, disrupted routes, and unhappy drivers.

**Rising Action:** Linda logs into her FoodTech Supplier Portal. Her dashboard shows demand signals from all 40 clients. Bella's Trattoria consumed 80% of their mozzarella yesterday — she sees the auto-reorder triggered overnight for 20 lbs, delivery needed by tomorrow. Three other restaurants are trending toward reorder thresholds on basil and tomatoes.

**Climax:** Linda batches the four orders into one delivery route — Bella's mozzarella, plus proactive basil and tomato drops for the other three. She confirms all orders in FoodTech with one click. The restaurants see "order confirmed, arriving tomorrow 6 AM" in their Kitchen Status. No phone calls. No emergencies. No premium fees.

**Resolution:** Linda's emergency order rate dropped 75% since her clients adopted FoodTech. Her delivery routes are more efficient because she can predict demand instead of reacting to it. She's added 8 new restaurant clients specifically because they use FoodTech — the platform makes her job easier, so she prefers FoodTech restaurants.

**Requirements revealed:** Supplier Portal dashboard, multi-restaurant demand view, auto-reorder notification/confirmation, batch order management, delivery scheduling, consumption trend visibility, supplier-restaurant relationship management.

---

### Journey 7: Alex — System Admin, Onboarding a New Restaurant

**Opening Scene:** Alex works for FoodTech as a customer success engineer. A new 3-location pizza chain just signed up on the Growth tier. Alex needs to get all three locations configured and live within a week.

**Rising Action:** Alex creates the tenant in FoodTech's admin console — "Tony's Pizza" with three locations. For each location, he configures: station layout (pizza oven, prep, salad, drinks), order stages (received → making → oven → boxing → ready), menu items with inventory thresholds, and staff roles. He imports their menu from a CSV. He sets up the POS integration by generating API credentials and sharing the webhook URL with their POS vendor.

**Climax:** Alex runs the demo simulator for Location 1. Realistic pizza orders flow through the system — the owner watches tickets move across the Rail, Kitchen Status light up as items deplete, and Service Tempo respond to the simulated rush. The owner's eyes light up: "This is exactly how my kitchen works." Alex hands tablets to the line cooks, who start bumping simulated orders within 30 seconds — no training needed.

**Resolution:** All three locations go live on Monday. Alex monitors the admin dashboard for the first week — adoption metrics show all staff using bump-to-advance by day 2, Kitchen Status checklists completed before every service by day 3. He flags one location where Service Tempo is consistently yellow — recommends they add a prep station. Onboarding complete, customer retained.

**Requirements revealed:** Admin console, tenant/location management, station configuration, order stage configuration, menu/inventory import, API credential generation, demo simulator controls, adoption monitoring dashboard, staff role assignment, multi-location setup workflow.

---

### Journey 8: Dev — POS Integration Developer, Connecting a POS System

**Opening Scene:** A POS company wants to integrate with FoodTech so their restaurant clients can automatically send orders to FoodTech's Rail. Dev, a backend engineer at the POS company, needs to build the integration.

**Rising Action:** Dev visits FoodTech's API documentation portal. She finds the Order Ingestion API — RESTful, well-documented, with a sandbox environment. She generates API keys from the developer console, creates a test restaurant, and sends her first order via curl. It appears on the Rail in the sandbox dashboard instantly. She builds the webhook integration in her POS codebase — when an order is placed, it fires to FoodTech's API with items, station routing, and customer details.

**Climax:** Dev runs the integration against a pilot restaurant. Orders from the POS flow into FoodTech in real-time. She subscribes to FoodTech's status webhook — when a ticket is bumped, her POS receives the event and can update the customer receipt screen. The two-way integration takes her 3 days to build, not the 3 weeks she expected.

**Resolution:** The POS company rolls out FoodTech integration as a feature for all their restaurant clients. Dev writes an internal doc: "Clean API, good docs, sandbox environment, fast integration. Recommend as preferred KDS partner." Every restaurant on their POS now has a one-click option to connect FoodTech.

**Requirements revealed:** RESTful Order Ingestion API, API documentation portal, sandbox/test environment, API key management, webhook subscriptions (inbound and outbound), order schema with station routing, status event callbacks, developer console, rate limiting, authentication (API key + webhook signing).

### Journey Requirements Summary

| Journey | Primary Capabilities Required |
|---------|-------------------------------|
| **Marco (Line Cook)** | Station View, bump-to-advance, 86 visibility, ticket prioritization |
| **Adrienne (Expeditor)** | Expeditor Dashboard, Service Tempo, attention-driven UI, station load balancing |
| **David (Owner)** | Multi-location dashboard, drill-down views, inventory alerts, auto-reorder visibility |
| **Priya (Customer)** | QR code tracker, web-based status page, real-time updates, no-install experience |
| **Jason (Delivery)** | Delivery Board, accurate ETAs, ready-order queue, real-time status |
| **Linda (Supplier)** | Supplier Portal, demand dashboard, auto-reorder management, batch operations |
| **Alex (Admin)** | Admin console, tenant management, station/stage configuration, demo simulator, adoption monitoring |
| **Dev (POS Developer)** | Order Ingestion API, docs portal, sandbox, webhooks, API key management |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Single-Signal Multi-Stakeholder Architecture**
No existing kitchen platform treats every event as a signal that radiates to multiple consumers simultaneously. KDS systems update one screen. FoodTech's bump-to-advance updates the expeditor view, customer tracker, delivery board, inventory count, and supplier threshold — all from one tap. This is an event-driven fanout pattern applied to restaurant operations for the first time.

**2. Super App Ecosystem Unification**
The restaurant tech market is fragmented by design — POS vendors, KDS providers, inventory tools, delivery platforms, and customer engagement tools all operate as islands. FoodTech's innovation is refusing to accept that fragmentation. By putting every stakeholder (kitchen, customer, delivery, supplier) on one platform, network effects compound: more restaurants attract more suppliers, better supplier data improves kitchen operations, better operations improve customer experience.

**3. Attention-Driven Kitchen UI**
Traditional KDS systems show all tickets equally. FoodTech's attention-driven UI inverts this: problems glow, healthy operations fade. This borrows from modern observability dashboards (Datadog, Grafana) and applies it to physical kitchen operations — a cross-domain innovation that reduces cognitive load during high-stress service periods.

### Market Context & Competitive Landscape

- **Toast KDS / Square KDS / FreshKDS** — digitize the ticket rail but stop at the kitchen wall. POS-locked. No ecosystem connectivity.
- **MarketMan / BlueCart** — inventory management without order flow integration. Can't see that tonight's rush is depleting stock in real-time.
- **Domino's Tracker** — customer transparency, but vertically integrated and unavailable to independents.
- **DoorDash / Uber Eats** — delivery timing based on historical averages, not live kitchen state.

**No competitor connects all four domains (kitchen ops, customer transparency, delivery optimization, supplier automation) into a single real-time platform.** This is FoodTech's structural moat.

### Validation Approach

- **Pilot validation:** 3-5 restaurants testing the full ecosystem (not just kitchen features) to prove the multi-stakeholder value loop
- **Signal propagation test:** Measure time from bump to all-views-updated — must be < 500ms to feel "instant"
- **Ecosystem activation tracking:** Monitor how quickly pilot restaurants connect secondary stakeholders (customers, suppliers, delivery)
- **Before/after measurement:** Ticket time, wait time, emergency orders, customer inquiries — concrete proof of value

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Super app scope creep** | Phased MVP build sequence — prove The Rail first, then layer ecosystem views |
| **Ecosystem cold start** | Demo simulator provides value even with zero real integrations. Kitchen ops work standalone. |
| **Attention-driven UI unproven in kitchens** | A/B test against traditional ticket list in pilot. Kitchen environments are noisy — UI must work without reading. |
| **Supplier adoption dependency** | Dual-path integration (portal + API) lowers barrier. Kitchen value exists without suppliers connected. |

## SaaS B2B + Real-time Web App Requirements

### Project-Type Overview

FoodTech operates as a multi-tenant SaaS platform where each restaurant is the primary tenant with strict data isolation, while supporting hierarchical views for multi-location operators and cross-tenant visibility for suppliers. The platform is a real-time SPA built for diverse display environments — from cheap Android tablets on a greasy kitchen line to TV screens on the wall to laptops at home.

### Multi-Tenancy Model

**Tenant Structure:**
- **Primary tenant:** Individual restaurant location — all operational data (orders, inventory, staff, kitchen status) isolated per location
- **Organization layer:** Optional parent grouping for multi-location operators (e.g., David's 3 taco shops). Provides consolidated dashboards, cross-location comparison, and shared configuration templates
- **Supplier cross-tenant access:** Suppliers see aggregated demand signals across all their restaurant clients — read-only view into inventory/reorder data, never into operational details (tickets, staff, tempo)

**Data Isolation Rules:**
- Kitchen operational data (orders, tickets, bump history) strictly isolated per location
- Inventory and reorder data shared with linked suppliers only
- Customer tracker data scoped to individual order — no cross-order visibility
- Organization-level users can view all child locations but each location operates independently

### Permission Model (RBAC)

| Role | Scope | Access Level |
|------|-------|-------------|
| **Line Cook** | Single station at single location | Station View only — own orders, bump, 86 visibility |
| **Head Chef / Expeditor** | Single location | Expeditor Dashboard — all stations, all orders, Kitchen Status, Service Tempo |
| **Location Manager** | Single location | Full location access + analytics + configuration |
| **Organization Owner** | All locations in org | Multi-location dashboard + consolidated analytics + org-level config |
| **Customer** | Single order | Customer Tracker — own order status only, no auth required (token-based) |
| **Delivery Partner** | Single location | Delivery Board — ready orders and ETAs only |
| **Supplier (Portal)** | Cross-tenant (linked restaurants) | Supplier Portal — inventory levels, reorder queue, demand signals |
| **Supplier (API)** | Cross-tenant (linked restaurants) | API access — same data as portal, machine-to-machine |
| **System Admin** | Platform-wide | Admin console — tenant management, configuration, monitoring |

### Subscription Tiers

| Tier | Target | Includes |
|------|--------|----------|
| **Indie** | Single-location restaurants | The Rail, Kitchen Status, Service Tempo, Station View, Expeditor Dashboard, Customer Tracker, Delivery Board, Demo Simulator. Up to 1 location, up to 10 staff accounts. |
| **Growth** | Multi-location operators (2-10) | Everything in Indie + Organization dashboard, cross-location analytics, supplier integration (portal), CSV import/export, priority support. Up to 10 locations. |
| **Enterprise** | Chains (10+) | Everything in Growth + Supplier API access, custom integrations, dedicated onboarding, SLA guarantees, SSO/SAML, unlimited locations. |

### Technical Architecture Considerations

**Real-Time Infrastructure:**
- **WebSocket layer:** Socket.io for broad compatibility with automatic fallback to long-polling. Reliability and security are top priorities over raw performance.
- **Event fanout pattern:** Single kitchen event (bump, 86, status change) broadcasts to all subscribed views via channel-based pub/sub
- **Connection resilience:** Auto-reconnect with state sync on reconnection. Kitchen environments have unreliable WiFi — the system must handle drops gracefully.
- **Security:** WSS (encrypted WebSocket), per-connection authentication, tenant-scoped channels — a cook at Restaurant A must never receive events from Restaurant B

**Application Architecture:**
- **Primary SPA:** Single-page application serving all restaurant-facing views (Station View, Expeditor Dashboard, Customer Tracker, Delivery Board, Management Console). Role-based routing — same app, different views based on auth.
- **Supplier Portal:** Separate SPA — different domain, different auth flow, cross-tenant data model. Keeps supplier concerns decoupled from restaurant operations.
- **API layer:** RESTful API for CRUD operations + WebSocket for real-time events. All views consume the same API — no special backends per view.

**Platform & Display Support:**
- **Android tablets** (7"–10") — primary Station View device. Must work on budget hardware (2GB RAM, Android 10+)
- **iPads** (all sizes) — Station View and Expeditor Dashboard
- **Web browsers** (Chrome 90+, Safari 15+, Firefox 90+, Edge 90+) — all views, desktop and mobile
- **TV/large displays** — Expeditor Dashboard and Delivery Board designed for wall-mounted screens. Auto-scaling layout, no interaction required (display-only mode)
- **Responsive design** — fluid layouts that adapt from 7" tablet to 65" TV. Touch-optimized for tablets, display-optimized for TVs.

### Accessibility & Compliance

WCAG 2.1 AA compliance is non-negotiable across all views. Accessibility is a first-class design constraint — not an afterthought. See **Non-Functional Requirements > Accessibility & Compliance** for full measurable standards.

**Key design drivers for kitchen environments:**
- High-contrast modes for bright/harsh lighting
- Large touch targets (48x48dp minimum) for wet/gloved hands
- Color-blind safe status indicators (icon + pattern + color, never color alone)
- GDPR/CCPA compliance for customer data; data residency for enterprise tier

### Integration Priorities

| Integration | Type | Priority |
|-------------|------|----------|
| **POS Systems** (Toast, Square, Clover, Lightspeed) | Inbound API — order ingestion | MVP |
| **Supplier Portal** | Platform view — cross-tenant | MVP |
| **Supplier API** | Outbound API — purchase order push | MVP |
| **Delivery Platforms** (DoorDash, Uber Eats) | Future bidirectional API | Post-MVP |
| **Payment Processors** | Not in scope — FoodTech doesn't handle payments | N/A |
| **SSO/SAML Providers** | Enterprise auth integration | Enterprise tier |

See **Non-Functional Requirements > Integration & Interoperability** for technical standards (API versioning, data formats, authentication protocols).

### Implementation Considerations

- **Demo simulator:** Ships with every installation. Generates realistic order patterns (breakfast rush, lunch steady, dinner peak). Used for onboarding, training, and sales demos.
- **Deployment model:** Cloud-hosted SaaS (no on-premise). Single codebase, multi-tenant infrastructure.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform-first MVP — build the infrastructure foundation (Phase 0), then layer features in order of value delivery. Each phase must be independently useful while building toward the full super app vision.

**Resource Model:** Solo developer with multi-agent AI support (BMAD framework). Agents handle parallel workstreams — architecture, implementation, testing, code review — enabling one person to operate at team-level velocity.

**Key Principle:** Build for scale from day one. Multi-tenancy, RBAC, event infrastructure, and WebSocket layer are foundational — not afterthoughts. Phase 0 ensures every subsequent phase builds on solid ground.

### MVP Feature Set — Phased Build Sequence

**Phase 0 — Platform Foundation (Infrastructure)**
- Multi-tenant data architecture (restaurant = tenant, organization = parent)
- Authentication & RBAC engine (all 9 roles defined, enforced from day one)
- Event bus infrastructure (Socket.io with pub/sub channels, tenant-scoped)
- RESTful API layer with WebSocket event layer
- Database schema with tenant isolation
- API credential management and webhook system
- Subscription tier enforcement (Indie/Growth/Enterprise)
- Deployment pipeline and cloud infrastructure
- Demo simulator engine (order generation core)
- WCAG 2.1 AA compliant component library foundation

**Phase 1 — The Rail + Station View (Core Kitchen Engine)**
- Order ingestion API (POS webhook + manual quick-entry)
- Kanban-style order flow through configurable stages
- Bump-to-advance (one-tap stage progression)
- Mini-timeline progress bars per ticket
- Station View: my orders, bump button, 86'd items visible
- Demo simulator generating realistic order patterns
- Offline resilience for Station View (local cache, sync on reconnect)

**Phase 2 — Kitchen Status + Expeditor Dashboard**
- Green/yellow/red station status system
- Station-specific prep checklists
- Inventory tracking with configurable thresholds
- 86 Board — real-time item availability across all views
- Expeditor Dashboard: Rail + Kitchen Status + Service Tempo in one screen
- Attention-driven UI (problems glow, healthy fades)
- TV/large display mode (display-only, auto-scaling)

**Phase 3 — Ecosystem Views**
- Customer Tracker: real-time order status via QR code/link (no app install)
- Delivery Board: ready-order queue with accurate ETAs
- Service Tempo heartbeat metric fully integrated
- Multi-location dashboard for organization-level users

**Phase 4 — Supplier Integration + Admin Console**
- Supplier Portal (separate SPA): demand dashboard, auto-reorder management, batch operations
- Supplier API: outbound purchase order push (machine-to-machine)
- Threshold-based auto-reorder triggers from Kitchen Status
- Admin console: tenant management, station/stage configuration, menu import
- Onboarding workflow with demo simulator
- Adoption monitoring dashboard

### Core User Journeys Supported Per Phase

| Phase | Journeys Enabled |
|-------|-----------------|
| **Phase 0** | None directly — infrastructure enables all subsequent phases |
| **Phase 1** | Marco (Line Cook) — full journey. Dev (POS Integration) — partial (order ingestion). |
| **Phase 2** | Adrienne (Expeditor) — full journey. Marco enhanced with 86 Board. |
| **Phase 3** | Priya (Customer), Jason (Delivery), David (Owner/multi-location) — full journeys. |
| **Phase 4** | Linda (Supplier), Alex (Admin) — full journeys. Dev (POS) — complete with webhooks. |

### Post-MVP Features

**Phase 5 — Growth (Post-MVP):**
- Floor plan spatial visualization
- Historical analytics and post-service replay
- Service Tempo with historical trend analysis
- Forecast mode ("chicken runs out by 8pm")
- Sound/audio cues for kitchen events
- Auto-generate next-day prep from consumption data
- Reverse traceability on served orders
- Dashboard as training tool with simulator replay

**Phase 6 — Expansion (Vision):**
- ATC-style priority routing
- Gamification layer for kitchen staff
- Multi-location transparency screens
- Mobile-native apps (iOS/Android)
- AI-powered demand prediction and staffing recommendations
- Marketplace dynamics — supplier discovery and competitive bidding
- Front-of-house integration (table management, waitstaff)
- Delivery platform API integrations (DoorDash, Uber Eats)

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Real-time fanout at scale on budget hardware | High | Socket.io with graceful degradation. Load test on cheapest Android tablet early in Phase 0. Performance budget enforced from first component. |
| Offline resilience complexity | Medium | Phase 1 implements local cache for Station View only. Expand offline support incrementally. |
| Multi-tenant data leakage | Critical | Tenant isolation enforced at database query layer (not application layer). Security audit in Phase 0. Every query scoped by tenant ID. |
| WebSocket connection instability in kitchens | High | Auto-reconnect with full state sync. Optimistic UI — bump works locally, syncs when connected. |

**Market Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Ecosystem cold start | High | Kitchen ops (Phases 1-2) deliver standalone value without ecosystem. Demo simulator provides full experience for evaluation. Suppliers and delivery partners join after restaurants prove value. |
| Pilot restaurant churn | Medium | Time-to-value must be < 1 day (Station View works immediately). Free pilot period. Measure and share ticket time improvements weekly. |
| POS integration fragmentation | Medium | Start with 1-2 POS partners (Toast, Square). Manual quick-entry as universal fallback. API-first design makes adding new POS integrations straightforward. |

**Resource Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Solo developer bottleneck | High | BMAD multi-agent framework enables parallel development. Agents handle architecture, implementation, testing, and code review. Focus human effort on product decisions and pilot relationships. |
| Scope creep across 5 phases | Medium | Each phase has clear completion criteria. No phase starts until previous phase is pilot-validated. Phases are independently valuable — the product works after Phase 1. |
| Burnout / velocity drop | Medium | Phase 0 investment pays compound returns. Multi-agent support reduces cognitive load. Each phase delivers visible progress and user feedback — maintaining motivation. |

## Functional Requirements

### Order Lifecycle Management (The Rail)

- FR1: System can receive orders via REST API from external POS systems
- FR2: Kitchen staff can create orders manually via quick-entry interface
- FR3: System can route order items to appropriate kitchen stations based on configuration
- FR4: Line cooks can view only orders assigned to their station
- FR5: Line cooks can advance an order to the next stage with a single tap (bump-to-advance)
- FR6: System can track and display order progress through configurable stages (received → preparing → plating → served)
- FR7: System can display mini-timeline progress bars showing time elapsed per order
- FR8: System can visually prioritize orders by urgency (time in current stage)
- FR9: Expeditors can reassign orders between stations
- FR10: System can calculate estimated completion time per order based on current kitchen state, accurate within ±3 minutes of actual completion

### Kitchen Status & Inventory

- FR11: System can display station readiness as green/yellow/red status indicators
- FR12: Kitchen staff can complete station-specific prep checklists before service
- FR13: System can track inventory levels for configurable menu items
- FR14: System can flag items as 86'd (unavailable) when inventory reaches zero
- FR15: System can display 86'd items across all views in real-time
- FR16: System can trigger auto-reorder notifications when inventory drops below configurable thresholds
- FR17: Managers can configure inventory items and their reorder thresholds
- FR18: System can decrement inventory automatically based on orders processed

### Service Tempo & Operational Intelligence

- FR19: System can calculate and display a real-time Service Tempo health metric for each kitchen
- FR20: System can detect bottlenecks by identifying stations with above-average ticket times
- FR21: System can apply attention-driven visual treatment (highlight problems, dim healthy operations)
- FR22: Expeditors can view all stations' load and status on a single dashboard
- FR23: System can alert when Service Tempo enters yellow or red zones

### Customer Transparency

- FR24: System can generate unique tracking links/QR codes per order
- FR25: Customers can view real-time order status without installing an app or creating an account
- FR26: System can push status updates to customers as orders progress through stages
- FR27: System can display estimated time to ready based on live kitchen state, accurate within ±3 minutes of actual ready time

### Delivery Partner Optimization

- FR28: Delivery partners can view a queue of ready and upcoming orders with estimated ready times
- FR29: System can calculate pickup ETAs based on real-time kitchen state, accurate within ±2 minutes of actual ready time
- FR30: Delivery partners can confirm order pickup
- FR31: System can prioritize delivery queue based on order readiness and wait time

### Supplier Integration

- FR32: Independent suppliers can log into a Supplier Portal to view demand signals from linked restaurants
- FR33: Suppliers can view aggregated inventory levels and consumption trends across their restaurant clients
- FR34: Suppliers can receive, review, and confirm auto-triggered reorders
- FR35: Suppliers can batch 2 or more orders for route-optimized delivery
- FR36: System can push purchase orders to external supplier systems via outbound API
- FR37: Restaurants can view supplier order confirmation status in Kitchen Status

### Multi-Tenancy & Organization Management

- FR38: System can isolate all operational data per restaurant location (tenant)
- FR39: Organization owners can group 2 or more locations under a parent organization (up to subscription tier limit)
- FR40: Organization owners can view consolidated dashboards across all locations
- FR41: Organization owners can drill down from organization view to individual location detail
- FR42: System can enforce role-based access control across 9 defined roles
- FR43: System can enforce subscription tier feature gates (Indie/Growth/Enterprise)

### Platform Administration

- FR44: Admins can create and configure new restaurant tenants with station layouts, order stages, and staff roles
- FR45: Admins can import menu items and inventory from CSV
- FR46: Admins can generate API credentials for POS integrations
- FR47: Admins can monitor adoption metrics (bump usage, checklist completion, active users)
- FR48: System can run a demo simulator generating realistic order patterns at configurable pace

### API & Integration Platform

- FR49: External systems can submit orders via authenticated REST API
- FR50: External systems can subscribe to order status webhooks (bump events, completion, 86 changes)
- FR51: System can provide a sandbox environment for integration testing
- FR52: System can provide API documentation portal for developers
- FR53: System can manage API keys and webhook signing for secure integrations

### Real-Time Event Infrastructure

- FR54: System can propagate any kitchen event to all subscribed views within 500ms
- FR55: System can maintain persistent WebSocket connections with automatic reconnection
- FR56: Station View can cache current state locally and operate during connection drops
- FR57: System can sync full state to reconnected clients after connection recovery

### Display & Accessibility

- FR58: All views can adapt responsively from 7" tablet to 65" TV display
- FR59: Expeditor Dashboard and Delivery Board can operate in display-only mode for wall-mounted screens
- FR60: System can provide high-contrast visual modes for kitchen environments
- FR61: System can indicate status using icons and patterns in addition to color (color-blind safe)
- FR62: All interactive elements can support touch targets of minimum 48x48dp
- FR63: All views can meet WCAG 2.1 AA compliance standards

## Non-Functional Requirements

### Performance

| Metric | Target | Context |
|--------|--------|---------|
| **First Meaningful Paint** | < 2 seconds | Budget Android tablet over restaurant WiFi |
| **Kitchen Event Propagation** | < 500ms end-to-end | From bump action to all subscribed views |
| **API Response Time (P95)** | < 300ms | RESTful endpoints under normal load |
| **API Response Time (P99)** | < 800ms | RESTful endpoints under peak load |
| **WebSocket Message Delivery** | < 200ms | Socket.io event from server to connected client |
| **Bundle Size (Initial Load)** | < 500KB gzipped | Station View — optimized for slow connections |
| **Bundle Size (Full Dashboard)** | < 1.5MB gzipped | Expeditor Dashboard with all modules |
| **Time to Interactive** | < 3 seconds | Any view on target hardware |
| **Concurrent WebSocket Connections** | 500+ per instance | Per application server node |
| **Database Query Time (P95)** | < 100ms | Tenant-scoped queries with proper indexing |

### Security

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| **Authentication** | JWT with refresh tokens | Short-lived access tokens (15 min), secure refresh rotation |
| **Authorization** | RBAC with tenant isolation | 9 roles enforced at API layer; every query tenant-scoped |
| **Data Encryption — Transit** | TLS 1.3 | All API and WebSocket connections |
| **Data Encryption — Rest** | AES-256 | Database encryption, backup encryption |
| **API Security** | OWASP API Top 10 compliance | Rate limiting, input validation, injection prevention |
| **Session Management** | Secure cookie + token hybrid | HttpOnly, SameSite=Strict, CSRF protection |
| **Tenant Isolation** | Database-level enforcement | Tenant ID on every row, enforced in query layer — no application-level filtering only |
| **Customer Tracker Auth** | Token-based, time-limited | No login required — unique order token with 24-hour expiry |
| **Supplier API Auth** | API key + HMAC signature | Machine-to-machine with IP allowlisting option |
| **Audit Logging** | All state-changing actions logged | Who, what, when, tenant — immutable audit trail |
| **Secret Management** | No secrets in code or config files | Environment variables or secret manager (e.g., AWS Secrets Manager) |
| **Dependency Security** | Automated vulnerability scanning | CI/CD pipeline scans on every build |

### Scalability

| Dimension | Target | Strategy |
|-----------|--------|----------|
| **Horizontal Scaling** | Stateless app servers behind load balancer | No server-side session state; Socket.io with Redis adapter for multi-node |
| **Database Scaling** | 100+ tenants on shared infrastructure | Connection pooling, query optimization, tenant-scoped indexing |
| **WebSocket Scaling** | Multi-node Socket.io with Redis pub/sub | Sticky sessions for connection stability, Redis adapter for cross-node events |
| **Tenant Isolation at Scale** | Row-level tenant scoping | Shared database, tenant_id indexed column on every table |
| **Read Scaling** | Read replicas for analytics/reporting | Write to primary, read from replicas for non-real-time queries |
| **Event Throughput** | 1,000+ events/second per tenant | Event bus designed for burst during peak service hours |
| **Storage Scaling** | Object storage for media/attachments | Database for transactional data only; S3-compatible for images, exports |
| **API Rate Limiting** | Per-tenant, per-role rate limits | Prevent noisy-neighbor issues; Enterprise tier gets higher limits |

### Reliability & Availability

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| **Uptime SLA** | 99.9% (< 8.77 hours downtime/year) | Multi-AZ deployment, health checks, auto-restart |
| **Planned Maintenance** | Zero-downtime deployments | Rolling deployments, blue-green or canary strategy |
| **Data Durability** | 99.999% | Automated daily backups, point-in-time recovery, geo-redundant backup storage |
| **Disaster Recovery** | RPO < 1 hour, RTO < 4 hours | Automated backup restoration, infrastructure-as-code for rapid rebuild |
| **WebSocket Reconnection** | Auto-reconnect with full state sync | Client-side reconnect logic with exponential backoff; server pushes full state on reconnect |
| **Offline Resilience** | Station View operates during disconnection | Local cache of current ticket queue; optimistic UI for bump actions; sync on reconnect |
| **Graceful Degradation** | Core functions survive partial outages | Supplier Portal down doesn't affect kitchen ops; Customer Tracker down doesn't affect Station View |
| **Error Recovery** | Automatic retry with dead-letter queue | Failed event deliveries retry 3x with exponential backoff, then dead-letter for manual review |
| **Health Monitoring** | Real-time system health dashboard | Application metrics, database health, WebSocket connection counts, event throughput |

### Accessibility & Compliance

| Requirement | Standard | Scope |
|-------------|----------|-------|
| **WCAG Compliance** | WCAG 2.1 AA | All views — Station View, Expeditor Dashboard, Customer Tracker, Delivery Board, Supplier Portal, Admin Console |
| **Screen Reader Support** | ARIA labels on all interactive elements | Full keyboard navigation, logical focus order, live region announcements for real-time updates |
| **Color Independence** | Status conveyed via icon + pattern + color | Green/yellow/red system always paired with icons (checkmark, warning, alert) and text labels |
| **Touch Targets** | Minimum 48x48dp | All interactive elements — critical for kitchen environments with wet/gloved hands |
| **Font Scaling** | Up to 200% without layout breakage | Responsive typography, no fixed pixel sizes for text |
| **Motion Sensitivity** | Reduced motion support | Respect `prefers-reduced-motion`; attention-driven UI animations optional |
| **Contrast Ratios** | 4.5:1 minimum (7:1 for small text) | High-contrast mode available for bright kitchen environments |
| **Internationalization** | UTF-8 throughout, RTL-ready layout | English first, architecture supports i18n expansion |
| **Data Privacy** | GDPR-aligned data handling | Customer data minimization, right-to-deletion support, data retention policies |
| **Accessibility Testing** | Automated + manual audit per phase | axe-core in CI pipeline, manual screen reader testing per release |

### Integration & Interoperability

| Requirement | Details |
|-------------|---------|
| **API Standard** | RESTful with OpenAPI 3.0 specification; versioned endpoints (v1, v2) |
| **WebSocket Protocol** | Socket.io with namespace-per-tenant and room-per-view architecture |
| **Data Format** | JSON for all API communication; ISO 8601 for timestamps; UTC internally |
| **Webhook Support** | Outbound webhooks for key events (order status change, 86 updates, reorder triggers) with retry logic |
| **POS Integration Pattern** | Inbound webhook/API — POS pushes orders to FoodTech endpoint |
| **Supplier API Pattern** | Outbound API — FoodTech pushes purchase orders to supplier systems via configurable endpoint |
| **Authentication Protocols** | OAuth 2.0 for user auth; API keys + HMAC for machine-to-machine |
| **Rate Limiting** | Per-tenant, per-endpoint rate limits with clear 429 responses and retry-after headers |
| **Backward Compatibility** | API versioning with minimum 6-month deprecation notice for breaking changes |
| **SDK/Client Libraries** | TypeScript SDK for POS integrators (post-MVP); OpenAPI spec for code generation |
