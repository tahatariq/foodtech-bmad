# Story 1.4: Role-Based Access Control & Guard Chain

Status: ready-for-dev

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

- [ ] Create `backend/src/common/constants/roles.ts`:
  - Define `StaffRole` enum with all 9 values: `line_cook`, `head_chef`, `location_manager`, `org_owner`, `customer`, `delivery_partner`, `supplier`, `supplier_api`, `system_admin`
  - Define role hierarchy map for permission inheritance (e.g., `org_owner` inherits `location_manager` permissions)
  - Export `ROLE_HIERARCHY: Record<StaffRole, StaffRole[]>` mapping each role to its inherited roles
- [ ] Update `packages/shared-types/src/models.ts` to export the `StaffRole` type union matching the backend enum

### Task 2: Implement @Roles() Decorator (AC: @Roles() decorator implemented)

- [ ] Create `backend/src/common/decorators/roles.decorator.ts`:
  - `@Roles(...roles: StaffRole[])` — sets metadata on the handler with the allowed roles
  - Uses `SetMetadata('roles', roles)` from `@nestjs/common`
  - Supports multiple roles: `@Roles('head_chef', 'location_manager', 'org_owner')`
- [ ] Add JSDoc documentation explaining usage patterns

### Task 3: Implement TenantGuard (AC: verifies user belongs to requested tenant, 403 on cross-tenant)

- [ ] Create `backend/src/common/guards/tenant.guard.ts`:
  - Implements `CanActivate`
  - Extracts `tenantId` from JWT payload (`request.user.tenantId`)
  - Extracts requested `tenantId` from route parameter (`:tenantId`), query parameter, or request body
  - Compares: if user's tenantId does not match the requested resource's tenantId, throw `ForbiddenException`
  - Returns RFC 7807 error: `{ type: "https://foodtech.app/errors/forbidden", title: "Forbidden", status: 403, detail: "Access denied to this tenant's resources" }`
  - `system_admin` role bypasses tenant check
- [ ] Handle edge case: if no tenant context is required (e.g., user profile endpoints), skip check via `@SkipTenantCheck()` decorator
- [ ] Create `backend/src/common/decorators/skip-tenant-check.decorator.ts`

### Task 4: Implement RolesGuard (AC: checks role against @Roles(), 403 on unauthorized)

- [ ] Create `backend/src/common/guards/roles.guard.ts`:
  - Implements `CanActivate`
  - Uses `Reflector` to read `roles` metadata from the handler
  - If no `@Roles()` decorator is present, allow access (endpoint is role-agnostic, only requires auth)
  - Extracts `role` from `request.user` (JWT payload)
  - Checks if user's role (or any inherited role via hierarchy) matches any of the required roles
  - On failure: throw `ForbiddenException` with RFC 7807 format:
    - `type: "https://foodtech.app/errors/forbidden"`
    - `title: "Forbidden"`
    - `status: 403`
    - `detail: "Insufficient permissions for this resource"`
- [ ] Write unit tests:
  - line_cook accessing admin endpoint → 403
  - org_owner accessing location_manager endpoint → allowed (hierarchy)
  - system_admin accessing any endpoint → allowed
  - No @Roles() decorator → all authenticated users allowed

### Task 5: Wire Guard Chain Globally (AC: guard chain AuthGuard → TenantGuard → RolesGuard)

- [ ] Configure global guard chain in `app.module.ts`:
  - Register guards in order: `AuthGuard`, `TenantGuard`, `RolesGuard`
  - Use `APP_GUARD` provider token for global registration
  - Guards execute in registration order
- [ ] Create `backend/src/common/decorators/public.decorator.ts`:
  - `@Public()` decorator to mark endpoints that skip all guards (e.g., health check, login, refresh)
  - `AuthGuard` checks for `isPublic` metadata and skips validation if present
- [ ] Update `AuthGuard` to respect `@Public()` decorator
- [ ] Update existing endpoints:
  - Health check: add `@Public()`
  - Login: add `@Public()`
  - Refresh: add `@Public()`

### Task 6: Implement ZodValidationPipe (AC: Zod validation pipe validates all incoming DTOs)

- [ ] Install `zod` in backend if not already installed
- [ ] Create `backend/src/common/pipes/zod-validation.pipe.ts`:
  - Implements `PipeTransform`
  - Accepts a Zod schema as constructor argument
  - Validates `value` against the schema
  - On failure: throws `BadRequestException` with RFC 7807 format including Zod error details
  - On success: returns the parsed (and potentially transformed) value
- [ ] Create `backend/src/common/decorators/zod-body.decorator.ts`:
  - Convenience decorator that combines `@Body()` with `ZodValidationPipe`
  - Usage: `@ZodBody(loginSchema) body: LoginDto`
- [ ] Apply to existing auth endpoints:
  - `POST /auth/login` — validate with `loginSchema`
  - `POST /auth/refresh` — validate with `refreshTokenSchema`
- [ ] Write unit tests for validation pipe with valid and invalid inputs

### Task 7: Enhance @CurrentUser() and @TenantScoped() Decorators (AC: decorators implemented and documented)

- [ ] Verify `@CurrentUser()` decorator from Story 1.3 works correctly with the guard chain
- [ ] Enhance `@TenantScoped()` decorator from Story 1.2:
  - Combine with `@UseGuards(TenantGuard)` if not globally applied
  - Sets metadata indicating this endpoint requires tenant scoping on DB queries
- [ ] Create `backend/src/common/decorators/index.ts` barrel export for all custom decorators:
  - `@Roles()`
  - `@CurrentUser()`
  - `@TenantScoped()`
  - `@Public()`
  - `@SkipTenantCheck()`

### Task 8: Create Test Controller for Guard Chain Verification (AC: all guard chain behaviors)

- [ ] Create `backend/src/modules/auth/auth-test.controller.ts` (or use in e2e tests):
  - `GET /api/v1/test/public` — `@Public()`, returns 200
  - `GET /api/v1/test/authenticated` — requires any valid JWT, returns user payload
  - `GET /api/v1/test/admin-only` — `@Roles('system_admin')`, returns 200
  - `GET /api/v1/test/manager-up` — `@Roles('location_manager', 'org_owner', 'system_admin')`, returns 200
  - `GET /api/v1/test/tenant/:tenantId` — tenant-scoped, returns tenant data
- [ ] Write integration tests exercising:
  - Public endpoint accessible without token
  - Authenticated endpoint returns 401 without token
  - Admin endpoint returns 403 for line_cook
  - Manager endpoint allows org_owner (hierarchy)
  - Cross-tenant access returns 403

## Dev Notes

### Architecture References
- RBAC Guard Flow: `Request → AuthGuard (JWT valid?) → TenantGuard (tenant_id matches?) → RolesGuard (role authorized?) → Controller` (architecture.md, "RBAC Guard Flow")
- 9 roles defined in architecture: `line_cook`, `head_chef`, `location_manager`, `org_owner`, `customer`, `delivery_partner`, `supplier`, `supplier_api`, `system_admin`
- Error responses follow **RFC 7807 Problem Details** format (architecture.md)
- Data validation uses **Zod** at API boundaries (architecture.md, "Data Architecture")

### Technical Stack
- `@nestjs/common` — `CanActivate`, `SetMetadata`, `Reflector`, `PipeTransform`
- `@nestjs/passport` — `AuthGuard('jwt')`
- `zod` — runtime DTO validation
- No additional packages required beyond what Story 1.3 installed

### File Structure
```
backend/src/
├── common/
│   ├── constants/
│   │   └── roles.ts
│   ├── guards/
│   │   ├── auth.guard.ts            # Updated with @Public() check
│   │   ├── tenant.guard.ts          # New
│   │   └── roles.guard.ts           # New
│   ├── decorators/
│   │   ├── index.ts                 # Barrel export
│   │   ├── roles.decorator.ts       # New
│   │   ├── public.decorator.ts      # New
│   │   ├── skip-tenant-check.decorator.ts  # New
│   │   ├── current-user.decorator.ts  # From Story 1.3
│   │   └── tenant-scoped.decorator.ts # From Story 1.2
│   ├── pipes/
│   │   └── zod-validation.pipe.ts   # New
│   └── filters/
│       └── http-exception.filter.ts # From Story 1.3
```

### Testing Requirements
- Unit tests for `RolesGuard`:
  - Unauthorized role returns 403 with correct RFC 7807 body
  - Authorized role passes
  - Role hierarchy inheritance works
  - No @Roles metadata allows all authenticated users
- Unit tests for `TenantGuard`:
  - Matching tenant_id passes
  - Mismatched tenant_id returns 403
  - system_admin bypasses check
  - @SkipTenantCheck() bypasses check
- Unit tests for `ZodValidationPipe`:
  - Valid input passes through
  - Invalid input returns 400 with Zod error details
- Integration tests for full guard chain flow (via test controller)

### Dependencies
- **Story 1.1** (Monorepo Scaffold) — project structure
- **Story 1.2** (Database Schema) — `staff` table with roles, TenantScopeInterceptor, @TenantScoped()
- **Story 1.3** (Authentication) — AuthGuard, @CurrentUser(), JWT strategy, RFC 7807 filter

### References
- [Source: epics.md#Epic 1, Story 1.4]
- [Source: architecture.md#Authentication & Security]
- [Source: architecture.md#RBAC Guard Flow]
- [Source: architecture.md#API & Communication Patterns]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
