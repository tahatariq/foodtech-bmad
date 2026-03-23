# Story 6.1: Admin Tenant Configuration Wizard

Status: ready-for-dev

## Story

As **Alex (system admin)**,
I want a step-by-step wizard to create and configure new restaurant tenants,
So that I can onboard restaurants quickly with all required settings in place.

## Acceptance Criteria (BDD)

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

## Tasks / Subtasks

### Task 1: Wizard Shell & Navigation (AC: 8-step flow)

- [ ] Create `frontend/src/views/AdminConsole/OnboardingWizard/OnboardingWizard.tsx` — wizard shell with step indicator
- [ ] Implement step navigation: next, back, step indicator showing progress
- [ ] Track wizard state in Zustand store (current step, accumulated data per step)
- [ ] Implement progressive disclosure — steps unlock sequentially

### Task 2: Step 1 — Basic Info (AC: tenant creation)

- [ ] Create `BasicInfoStep.tsx` with fields: restaurant name, location count, subscription tier (Indie/Growth/Enterprise)
- [ ] React Hook Form + Zod schema shared with backend
- [ ] On submit: POST `/api/v1/admin/tenants` → receives `tenantId` for subsequent steps
- [ ] Radix UI Select for tier dropdown

### Task 3: Steps 2-3 — Station Layout & Order Stages

- [ ] Create `StationLayoutStep.tsx` — dynamic form to add/name/reorder stations with emoji picker
- [ ] Create `OrderStagesStep.tsx` — configurable stage flow with defaults (received → preparing → plating → ready)
- [ ] Allow drag-to-reorder for both stations and stages

### Task 4: Steps 4-5 — Menu Import & Inventory Thresholds

- [ ] Create `MenuImportStep.tsx` — CSV upload or manual entry (delegates to Story 6.2)
- [ ] Create `InventoryThresholdsStep.tsx` — table of imported items with editable reorder thresholds and quantities

### Task 5: Steps 6-7 — Staff Roles & POS Integration

- [ ] Create `StaffRolesStep.tsx` — invite users, assign roles from 9-role RBAC matrix
- [ ] Create `PosIntegrationStep.tsx` — generate API credentials (delegates to Story 6.3)

### Task 6: Step 8 — Review & Activate (AC: single transaction)

- [ ] Create `ReviewActivateStep.tsx` — summary of all configured settings
- [ ] "Activate" button: POST `/api/v1/admin/tenants/:tenantId/activate` — creates all records in a single database transaction
- [ ] On success: redirect to tenant dashboard, offer demo simulator launch

### Task 7: Backend — Tenant Management API

- [ ] Create `backend/src/admin/admin.module.ts`
- [ ] POST `/api/v1/admin/tenants` — create tenant with tier
- [ ] POST `/api/v1/admin/tenants/:tenantId/activate` — batch create all records in transaction
- [ ] Add `@Roles('system_admin')` guard on all admin endpoints

### Task 8: Write Tests (AC: all)

- [ ] Unit tests for each wizard step component
- [ ] Integration test: full wizard flow → tenant activation → all records created
- [ ] Test transaction rollback on partial failure

## Dev Notes

- Uses React Hook Form + Zod resolver with schemas shared between frontend and backend
- Radix UI Select, Checkbox, Dialog for form controls
- Activation creates all records in a single PostgreSQL transaction via Drizzle
- UX-DR16: wizard + form layout, light theme, desktop-first, progressive disclosure

### Project Structure Notes

- `frontend/src/views/AdminConsole/OnboardingWizard/` — wizard shell + step components
- `backend/src/admin/` — tenant management module
- `packages/shared-types/src/admin/` — shared Zod schemas

### References

- [Source: epics.md#Story 6.1]
- [Source: ux-design-specification.md#UX-DR16]
- [Source: prd.md#FR44]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
