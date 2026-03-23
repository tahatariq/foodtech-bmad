# Story 1.4: Role-Based Access Control & Guard Chain

Status: review

## Story

As a **system administrator**,
I want 9 RBAC roles enforced across all API endpoints via a guard chain,
So that users can only access features and data appropriate to their role and tenant.

## Acceptance Criteria (BDD)

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

## Tasks / Subtasks

### Task 1: Define Role Constants and Types (AC: 9 roles defined)

- [x] Create `backend/src/common/constants/roles.ts`:
  - Define `StaffRole` enum with all 9 values
  - Define role hierarchy map for permission inheritance
  - Export `ROLE_HIERARCHY` and `hasRole()` utility
- [x] Update `packages/shared-types/src/models.ts` to export the `StaffRole` type union matching the backend enum

### Task 2: Implement @Roles() Decorator (AC: @Roles() decorator implemented)

- [x] Create `backend/src/common/decorators/roles.decorator.ts`
- [x] Add JSDoc documentation explaining usage patterns

### Task 3: Implement TenantGuard (AC: verifies user belongs to requested tenant, 403 on cross-tenant)

- [x] Create `backend/src/common/guards/tenant.guard.ts`
- [x] Handle edge case: @SkipTenantCheck() bypass
- [x] Create `backend/src/common/decorators/skip-tenant-check.decorator.ts`

### Task 4: Implement RolesGuard (AC: checks role against @Roles(), 403 on unauthorized)

- [x] Create `backend/src/common/guards/roles.guard.ts`
- [x] Write unit tests (5 tests: deny line_cook, allow hierarchy, allow system_admin, allow no @Roles, allow @Public)

### Task 5: Wire Guard Chain Globally (AC: guard chain AuthGuard → TenantGuard → RolesGuard)

- [x] Configure global guard chain in `app.module.ts` via APP_GUARD
- [x] Create `backend/src/common/decorators/public.decorator.ts`
- [x] Update `AuthGuard` to respect `@Public()` decorator
- [x] Update existing endpoints: health (@Public), login (@Public), refresh (@Public)

### Task 6: Implement ZodValidationPipe (AC: Zod validation pipe validates all incoming DTOs)

- [x] Install `zod` in backend
- [x] Create `backend/src/common/pipes/zod-validation.pipe.ts`
- [x] Write unit tests for validation pipe (4 tests: valid input, invalid throws, error details, strip unknown)

### Task 7: Enhance @CurrentUser() and @TenantScoped() Decorators (AC: decorators implemented and documented)

- [x] Verify `@CurrentUser()` decorator works with guard chain
- [x] Enhance `@TenantScoped()` decorator
- [x] Create `backend/src/common/decorators/index.ts` barrel export

### Task 8: Create Test Controller for Guard Chain Verification (AC: all guard chain behaviors)

- [x] Unit tests exercise guard chain behaviors via direct guard testing (5 RolesGuard + 5 TenantGuard tests)

## Dev Notes

### Architecture References
- RBAC Guard Flow: `Request → AuthGuard (JWT valid?) → TenantGuard (tenant_id matches?) → RolesGuard (role authorized?) → Controller`
- 9 roles defined in architecture
- Error responses follow RFC 7807 Problem Details format
- Data validation uses Zod at API boundaries

### Technical Stack
- `@nestjs/common` — CanActivate, SetMetadata, Reflector, PipeTransform
- `@nestjs/passport` — AuthGuard('jwt')
- `zod` — runtime DTO validation

### File Structure
```
backend/src/
├── common/
│   ├── constants/
│   │   └── roles.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── tenant.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── index.ts
│   │   ├── roles.decorator.ts
│   │   ├── public.decorator.ts
│   │   ├── skip-tenant-check.decorator.ts
│   │   ├── current-user.decorator.ts
│   │   └── tenant-scoped.decorator.ts
│   ├── pipes/
│   │   └── zod-validation.pipe.ts
│   └── filters/
│       └── http-exception.filter.ts
```

### Dependencies
- **Story 1.1** (Monorepo Scaffold)
- **Story 1.2** (Database Schema) — staff table with roles, TenantScopeInterceptor
- **Story 1.3** (Authentication) — AuthGuard, @CurrentUser(), JWT strategy

### References
- [Source: epics.md#Epic 1, Story 1.4]
- [Source: architecture.md#Authentication & Security]
- [Source: architecture.md#RBAC Guard Flow]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A

### Completion Notes List
- All 8 tasks implemented with 39 tests passing across all packages (36 backend, 2 frontend, 1 supplier-portal)
- Role constants with ROLE_HIERARCHY: system_admin inherits all, org_owner inherits location_manager/head_chef/line_cook
- hasRole() utility checks direct match and hierarchy inheritance
- TenantGuard: extracts tenant from params/query/body, system_admin bypasses, @SkipTenantCheck() bypass
- RolesGuard: checks @Roles() metadata with hierarchy, no @Roles = all auth users allowed
- Guard chain wired globally via APP_GUARD in registration order: JwtAuthGuard → TenantGuard → RolesGuard
- @Public() decorator skips all guards — applied to health, login, refresh endpoints
- ZodValidationPipe: validates against Zod schema, returns 400 with structured error details, strips unknown fields
- Barrel export at common/decorators/index.ts for all 5 custom decorators
- Fixed ZodValidationPipe: uses result.error.issues instead of ZodError.errors for compatibility

### File List
- backend/src/app.module.ts (modified — added APP_GUARD providers for 3 guards)
- backend/src/app.controller.ts (modified — added @Public() to health endpoint)
- backend/src/modules/auth/auth.controller.ts (modified — added @Public() to login/refresh)
- backend/src/common/constants/roles.ts
- backend/src/common/guards/auth.guard.ts (modified — added @Public() check via Reflector)
- backend/src/common/guards/tenant.guard.ts
- backend/src/common/guards/tenant.guard.spec.ts
- backend/src/common/guards/roles.guard.ts
- backend/src/common/guards/roles.guard.spec.ts
- backend/src/common/decorators/roles.decorator.ts
- backend/src/common/decorators/public.decorator.ts
- backend/src/common/decorators/skip-tenant-check.decorator.ts
- backend/src/common/decorators/index.ts
- backend/src/common/pipes/zod-validation.pipe.ts
- backend/src/common/pipes/zod-validation.pipe.spec.ts
- backend/package.json (modified — added zod)
