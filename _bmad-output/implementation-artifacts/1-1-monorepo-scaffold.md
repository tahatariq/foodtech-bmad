# Story 1.1: Monorepo Scaffold & Development Environment

Status: ready-for-dev

## Story

As a **developer**,
I want a fully initialized monorepo with backend, frontend, supplier-portal, and shared-types packages running via Docker Compose,
So that I have a working development environment to build all FoodTech features upon.

## Acceptance Criteria (BDD)

**Given** a fresh clone of the repository
**When** I run `docker compose up`
**Then** PostgreSQL starts on :5432, Redis on :6379, NestJS backend on :3000 (with health endpoint returning 200), Vite frontend on :5173, and supplier-portal on :5174
**And** npm workspaces are configured so `packages/shared-types` is importable from all packages
**And** Turborepo `turbo.json` orchestrates build/test/lint tasks
**And** `tsconfig.base.json` provides shared TypeScript strict-mode configuration
**And** `.env.example` files exist for backend and root with documented variables
**And** `.github/workflows/ci.yml` runs lint + test + build in parallel per package

## Tasks / Subtasks

### Task 1: Initialize Root Monorepo Structure (AC: workspaces, tsconfig)

- [ ] Create root `package.json` with npm workspaces configured for `backend`, `frontend`, `supplier-portal`, `packages/*`
- [ ] Create `tsconfig.base.json` with TypeScript strict mode enabled (`strict: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`, `esModuleInterop: true`, target `ES2022`, module `ESNext`)
- [ ] Create `.gitignore` with Node.js, Docker, IDE, and environment file exclusions
- [ ] Create `.nvmrc` with `20` (Node.js 20 LTS)
- [ ] Create `.prettierrc` and `.eslintrc.base.js` for consistent formatting across all packages

### Task 2: Scaffold NestJS Backend (AC: backend on :3000, health endpoint)

- [ ] Initialize NestJS 11.x project in `backend/` with `--strict` flag: `npx @nestjs/cli@latest new backend --strict --skip-git --package-manager npm`
- [ ] Create `backend/tsconfig.json` extending `../tsconfig.base.json`
- [ ] Add health check endpoint at `GET /api/v1/health` returning `{ "status": "ok", "timestamp": "<ISO8601>" }` with HTTP 200
- [ ] Configure NestJS to listen on port 3000 (from `PORT` env var)
- [ ] Add `@nestjs/config` for environment variable management
- [ ] Create `backend/.env.example` with documented variables: `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- [ ] Configure global API prefix `/api/v1`
- [ ] Add Jest test configuration with a passing health controller test

### Task 3: Scaffold Vite + React Frontend (AC: frontend on :5173)

- [ ] Initialize Vite 6.x + React 19 + TypeScript project in `frontend/`: `npm create vite@latest frontend -- --template react-ts`
- [ ] Create `frontend/tsconfig.json` extending `../tsconfig.base.json`
- [ ] Install and configure Tailwind CSS v4.2 with `@tailwindcss/vite` plugin
- [ ] Install Radix UI v1.4.3: `npm install radix-ui`
- [ ] Configure Vite dev server to run on port 5173
- [ ] Add proxy configuration for API requests to backend at `http://localhost:3000`
- [ ] Create minimal `App.tsx` with a "FoodTech" heading and connection status placeholder
- [ ] Add Vitest configuration for frontend testing

### Task 4: Scaffold Supplier Portal (AC: supplier-portal on :5174)

- [ ] Initialize Vite 6.x + React 19 + TypeScript project in `supplier-portal/`: `npm create vite@latest supplier-portal -- --template react-ts`
- [ ] Create `supplier-portal/tsconfig.json` extending `../tsconfig.base.json`
- [ ] Install and configure Tailwind CSS v4.2 with `@tailwindcss/vite` plugin
- [ ] Configure Vite dev server to run on port 5174
- [ ] Add proxy configuration for API requests to backend
- [ ] Create minimal `App.tsx` with "Supplier Portal" heading
- [ ] Add Vitest configuration

### Task 5: Create shared-types Package (AC: importable from all packages)

- [ ] Create `packages/shared-types/package.json` with name `@foodtech/shared-types`, main entry, and TypeScript build configuration
- [ ] Create `packages/shared-types/tsconfig.json` extending `../../tsconfig.base.json`
- [ ] Create `packages/shared-types/src/index.ts` as barrel export
- [ ] Create `packages/shared-types/src/events.ts` with placeholder `FoodTechEvent<T>` interface
- [ ] Create `packages/shared-types/src/models.ts` with placeholder domain types
- [ ] Create `packages/shared-types/src/api.ts` with placeholder API types (RFC 7807 `ProblemDetail` type)
- [ ] Verify `@foodtech/shared-types` is importable from `backend`, `frontend`, and `supplier-portal` via workspace resolution

### Task 6: Configure Turborepo (AC: turbo.json orchestration)

- [ ] Install Turborepo: `npm install turbo --save-dev` (at root)
- [ ] Create `turbo.json` with pipeline definitions:
  - `build`: depends on `^build` (topological), outputs `dist/**`
  - `test`: no dependencies, outputs `coverage/**`
  - `lint`: no dependencies, no outputs
  - `dev`: persistent, no cache
- [ ] Add root `package.json` scripts: `turbo run build`, `turbo run test`, `turbo run lint`, `turbo run dev`

### Task 7: Create Docker Compose Environment (AC: docker compose up starts all services)

- [ ] Create `docker-compose.yml` with services:
  - `postgres`: PostgreSQL 16, port 5432, volume for data persistence, healthcheck
  - `redis`: Redis 7.x, port 6379, healthcheck
  - `backend`: NestJS app, port 3000, depends on postgres + redis, volume mounts for hot-reload
  - `frontend`: Vite dev server, port 5173, volume mounts for HMR
  - `supplier-portal`: Vite dev server, port 5174, volume mounts for HMR
- [ ] Create `backend/Dockerfile` (development target with hot-reload)
- [ ] Create `frontend/Dockerfile` (development target with HMR)
- [ ] Create `supplier-portal/Dockerfile` (development target with HMR)
- [ ] Create root `.env.example` with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_URL`
- [ ] Verify `docker compose up` starts all services and health endpoint returns 200

### Task 8: GitHub Actions CI (AC: CI runs lint + test + build in parallel)

- [ ] Create `.github/workflows/ci.yml` with:
  - Trigger on push to `main` and pull requests
  - Node.js 20 setup
  - npm ci install
  - Parallel jobs: `lint`, `test`, `build` (using Turborepo)
  - PostgreSQL and Redis service containers for integration tests
- [ ] Verify workflow syntax is valid

## Dev Notes

### Architecture References
- Selected starter is **Option C: Vite + React + NestJS Monorepo** (architecture.md, "Selected Starter" section)
- Monorepo uses **npm workspaces** for dependency management (not pnpm)
- Backend uses **NestJS CLI** for builds (webpack under the hood)
- Frontend uses **Vite 6.x** for builds with HMR
- Testing: **Vitest** for frontend, **Jest** for NestJS backend, **Playwright** for E2E

### Technical Stack
- Node.js 20 LTS
- TypeScript 5.x (strict mode)
- NestJS 11.x (`@nestjs/cli@latest`, `@nestjs/config`)
- Vite 6.x + React 19
- Tailwind CSS v4.2 (`@tailwindcss/vite`)
- Radix UI v1.4.3 (`radix-ui`)
- PostgreSQL 16 (Docker image: `postgres:16`)
- Redis 7.x (Docker image: `redis:7`)
- Turborepo (`turbo`)
- Vitest (frontend testing)
- Jest (backend testing)

### File Structure
```
foodtech/
├── package.json                    # Root workspace config
├── tsconfig.base.json              # Shared strict TS config
├── turbo.json                      # Turborepo pipeline
├── docker-compose.yml              # Dev environment
├── .env.example                    # Root env vars
├── .gitignore
├── .nvmrc
├── .prettierrc
├── .eslintrc.base.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts       # Health endpoint
│   │   └── app.controller.spec.ts
│   └── test/
├── frontend/
│   ├── Dockerfile
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── public/
├── supplier-portal/
│   ├── Dockerfile
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── public/
└── packages/
    └── shared-types/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── events.ts
            ├── models.ts
            └── api.ts
```

### Testing Requirements
- Unit test for health endpoint (`GET /api/v1/health` returns 200 with expected shape)
- Verify npm workspaces resolve `@foodtech/shared-types` correctly
- Verify Turborepo pipeline runs `build`, `test`, `lint` successfully
- Smoke test: `docker compose up` starts all services without errors
- CI workflow passes on clean push

### Dependencies
- **None** — this is the foundational story. All subsequent stories depend on this.

### References
- [Source: epics.md#Epic 1, Story 1.1]
- [Source: architecture.md#Selected Starter: Vite + React + NestJS Monorepo]
- [Source: architecture.md#Code Organization]
- [Source: architecture.md#Infrastructure & Deployment]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
