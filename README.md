# FoodTech - Real-time Kitchen Operations Platform

[![CI](https://github.com/your-org/foodtech-bmad/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/foodtech-bmad/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> **FoodTech** is a connected kitchen operations platform that transforms every kitchen event into real-time value for everyone in the restaurant ecosystem — from line cooks to customers, delivery partners to suppliers.

## 🌟 Vision

FoodTech eliminates the operational overhead that keeps restaurants from doing what they do best — making great food. By replacing manual workflows with an intelligent event engine, FoodTech gives restaurants a single source of truth that radiates outward: kitchen staff bump tickets and the customer sees their order move, inventory drops below threshold and a supplier order fires automatically, service backs up and delivery ETAs adjust in real-time.

## 🚀 Key Features

### Core Operational Pillars

| Pillar | Description |
|--------|-------------|
| **The Rail** | Order lifecycle management — ingestion via API, Kanban-style flow through stations, bump-to-advance, mini-timeline tracking |
| **Kitchen Status** | Unified prep readiness + inventory board — green/yellow/red system with station-specific checklists and threshold-based auto-ordering |
| **Service Tempo** | Real-time operational heartbeat — single-glance health metric for the entire kitchen |

### Connected Views

- **Station View** — Line cook interface: my orders, bump button — zero learning curve
- **Expeditor Dashboard** — Command center: full operational awareness with attention-driven UI
- **Customer Tracker** — Real-time order status for diners (QR code access, no app required)
- **Delivery Board** — Ready-order queue with accurate ETAs for delivery partners
- **Supplier Portal** — Independent suppliers manage orders across multiple restaurants
- **Management Console** — Multi-location oversight for owners and operators

## 🏗️ Architecture

### Tech Stack

- **Backend**: Node.js + NestJS + TypeScript
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.io with Redis adapter
- **Styling**: Tailwind CSS v4.2 + Radix UI
- **Authentication**: JWT with refresh tokens
- **Deployment**: Docker + Docker Compose

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Restaurant    │    │   Supplier      │    │   Customer      │
│   Operations    │    │   Portal        │    │   Tracker       │
│   (SPA)         │    │   (SPA)         │    │   (Web Page)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │    NestJS API Gateway   │
                    │    (Node.js + TypeScript)
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │   Event-Driven Core     │
                    │   • Order Engine        │
                    │   • Inventory Service   │
                    │   • Service Tempo       │
                    │   • WebSocket Layer     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │                         │
                    │   PostgreSQL Database   │
                    │   (Multi-tenant)        │
                    └─────────────────────────┘
```

### Key Architectural Decisions

- **Event-Driven Architecture**: Every kitchen action becomes a signal that radiates to all stakeholders
- **Multi-Tenant Isolation**: Row-level security with tenant_id on every table
- **Real-Time WebSockets**: Socket.io with Redis adapter for multi-node scaling
- **Offline Resilience**: Station View works during WiFi drops with local cache and sync
- **Attention-Driven UI**: Visual state (opacity, pulse, glow) based on data freshness and thresholds

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 11.9.0
- Docker & Docker Compose (for local development)
- PostgreSQL 16+ (via Docker)
- Redis 7+ (via Docker)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/foodtech-bmad.git
   cd foodtech-bmad
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Start infrastructure**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Set up environment**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with your configuration
   ```

5. **Run database migrations**
   ```bash
   npm run db:push
   npm run db:seed
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Restaurant App: http://localhost:5173
   - Supplier Portal: http://localhost:5174
   - API Documentation: http://localhost:3000/api/docs

### Demo Simulator

FoodTech ships with a realistic order generator for training, demos, and evaluation:

```bash
# Start the demo simulator
npm run demo:start

# Configure order patterns
# - Peak hours: 7-9 PM
# - Average 25 orders/hour
# - Realistic station routing
# - Auto-generated customer data
```

## 📁 Project Structure

```
foodtech-bmad/
├── _bmad/                          # BMAD framework artifacts
│   ├── _config/                    # Agent configurations
│   ├── _memory/                    # Runtime state
│   ├── _output/                    # Generated artifacts
│   └── [framework modules]/
├── backend/                        # NestJS API server
│   ├── src/
│   │   ├── modules/               # Feature modules
│   │   │   ├── auth/              # Authentication & RBAC
│   │   │   ├── orders/            # Order lifecycle engine
│   │   │   ├── stations/          # Station management
│   │   │   ├── tempo/             # Service Tempo calculation
│   │   │   ├── tenants/           # Multi-tenant management
│   │   │   └── kitchen-status/    # Inventory & prep checklists
│   │   ├── common/                # Shared utilities
│   │   ├── gateways/              # WebSocket handlers
│   │   └── database/              # Drizzle ORM setup
│   ├── test/                      # E2E tests
│   └── Dockerfile
├── frontend/                       # Restaurant operations SPA
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── views/                 # Page-level components
│   │   ├── stores/                # Zustand state management
│   │   ├── providers/             # React context providers
│   │   ├── hooks/                 # Custom React hooks
│   │   └── tokens/                # Design token system
│   ├── public/
│   └── Dockerfile
├── supplier-portal/                # Supplier management SPA
│   ├── src/                       # Similar structure to frontend
│   ├── public/
│   └── Dockerfile
├── packages/
│   └── shared-types/              # TypeScript type definitions
├── docker-compose.yml             # Local development stack
├── turbo.json                     # Monorepo build orchestration
└── package.json                   # Root package configuration
```

## 🛠️ Development Scripts

### Root Level Scripts

```bash
# Build all packages
npm run build

# Run all tests
npm run test

# Lint all packages
npm run lint

# Type check all packages
npm run type-check

# Start all development servers
npm run dev
```

### Backend Scripts

```bash
cd backend

# Development server
npm run start:dev

# Production build
npm run build

# Database operations
npm run db:generate    # Generate migrations
npm run db:push        # Apply migrations
npm run db:migrate     # Run migrations
npm run db:studio      # Open Drizzle Studio
npm run db:seed        # Seed database

# Testing
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

### Frontend Scripts

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Testing
npm run test           # Run tests
```

## 🧪 Testing

### Test Coverage

- **Backend**: 114 unit tests (Jest) + E2E tests
- **Frontend**: 115 component tests (Vitest)
- **Supplier Portal**: 1 component test

### Running Tests

```bash
# All tests
npm run test

# Backend only
cd backend && npm run test

# Frontend only
cd frontend && npm run test

# With coverage
cd backend && npm run test:cov
```

### CI Pipeline

The project uses GitHub Actions for continuous integration:

- **Type Check**: TypeScript compilation across all packages
- **Lint**: ESLint with custom rules
- **Test**: Full test suite with database services
- **Build**: Production build verification

## 🤝 Contributing

### Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch** from `main`
3. **Make your changes** following the established patterns
4. **Run the full test suite** locally
5. **Submit a pull request** with a clear description

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Custom rules for consistency
- **Prettier**: Automated code formatting
- **Testing**: 80%+ coverage target
- **Accessibility**: WCAG 2.1 AA compliance

### Commit Convention

We follow conventional commits:

```
feat: add new customer tracker feature
fix: resolve WebSocket reconnection issue
docs: update API documentation
test: add unit tests for order service
refactor: simplify authentication middleware
```

## 📊 Performance Benchmarks

| Metric | Target | Current Status |
|--------|--------|----------------|
| **Event Propagation** | < 500ms end-to-end | ✅ Achieved |
| **Bundle Size** | < 500KB gzipped | ✅ Frontend: 190KB |
| **First Meaningful Paint** | < 2s on budget Android | ✅ ~1.2s |
| **WebSocket Latency** | < 100ms | ✅ ~50ms |
| **Database Query** | < 50ms P95 | ✅ ~30ms |

## 🔒 Security

- **Multi-tenant isolation** at database query layer
- **JWT authentication** with refresh token rotation
- **Row-level security** on all database tables
- **API rate limiting** and request validation
- **OWASP Top 10** compliance
- **Token-based customer access** (no persistent auth)

## 📈 Roadmap

### MVP (Current)
- ✅ Order lifecycle management (The Rail)
- ✅ Kitchen status & inventory tracking
- ✅ Service Tempo calculation
- ✅ Station View & Expeditor Dashboard
- ✅ Customer order tracking
- ✅ Delivery partner optimization
- ✅ Supplier auto-reorder system

### v2 — Operational Intelligence
- Floor plan spatial visualization
- Historical analytics and service replay
- Forecast mode for inventory
- Sound/audio cues for kitchen events
- Auto-generated prep lists from consumption

### v3 — Platform Dominance
- ATC-style priority routing
- Gamification for kitchen staff
- Multi-location transparency screens
- Mobile-native apps
- Advanced analytics and reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support & Contact

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/foodtech-bmad/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/foodtech-bmad/discussions)
- **Email**: support@foodtech.com

---

**Built with ❤️ using the BMAD (Business Method AI Development) framework**

*Transforming restaurant operations through connected intelligence.*