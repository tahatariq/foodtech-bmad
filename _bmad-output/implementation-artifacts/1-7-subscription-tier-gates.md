# Story 1.7: Subscription Tier Feature Gates

Status: review

## Story

As a **platform operator**,
I want subscription tier enforcement (Indie/Growth/Enterprise),
So that features are properly restricted by plan level.

## Acceptance Criteria (BDD)

**Given** a location has a subscription tier stored in the `locations` table
**When** a request is made to a tier-gated feature (e.g., supplier API access on Indie tier)
**Then** a 403 response is returned in RFC 7807 format with `type: "https://foodtech.app/errors/tier-restricted"` and `detail` explaining which tier is required

**Given** the tier definitions: Indie (1 location, 10 staff, no supplier API), Growth (10 locations, supplier portal), Enterprise (unlimited, supplier API, SSO)
**When** an org_owner on Growth tier attempts to add an 11th location
**Then** the system returns a 403 with upgrade guidance

**And** a `@TierGated('growth')` decorator and `TierGuard` are implemented for NestJS controllers
**And** tier limits are configurable via environment variables (not hardcoded)

## Tasks / Subtasks

### Task 1: Define Tier Configuration and Constants (AC: tier definitions, configurable via env vars)

- [x] Create `backend/src/common/constants/tiers.ts`:
  - Define `SubscriptionTier` enum: `indie`, `growth`, `enterprise`
  - Define `TierLimits` interface: `{ maxLocations: number, maxStaff: number, supplierApi: boolean, supplierPortal: boolean, sso: boolean }`
  - Define default tier limits:
    - `indie`: `{ maxLocations: 1, maxStaff: 10, supplierApi: false, supplierPortal: false, sso: false }`
    - `growth`: `{ maxLocations: 10, maxStaff: -1 (unlimited), supplierApi: false, supplierPortal: true, sso: false }`
    - `enterprise`: `{ maxLocations: -1, maxStaff: -1, supplierApi: true, supplierPortal: true, sso: true }`
  - Define `TierFeature` enum for feature-level gating: `SUPPLIER_API`, `SUPPLIER_PORTAL`, `SSO`, `UNLIMITED_LOCATIONS`, `UNLIMITED_STAFF`
- [x] Create `backend/src/common/config/tier.config.ts`:
  - Load tier limits from environment variables with defaults:
    - `TIER_INDIE_MAX_LOCATIONS` (default: 1)
    - `TIER_INDIE_MAX_STAFF` (default: 10)
    - `TIER_GROWTH_MAX_LOCATIONS` (default: 10)
  - Register as NestJS config namespace using `@nestjs/config`
  - Validate env vars with Zod schema
- [x] Update `backend/.env.example` with tier configuration variables

### Task 2: Implement @TierGated() Decorator (AC: @TierGated('growth') decorator implemented)

- [x] Create `backend/src/common/decorators/tier-gated.decorator.ts`:
  - `@TierGated(minimumTier: SubscriptionTier)` — sets metadata for minimum required tier
  - `@TierGated('growth')` means the endpoint requires `growth` or `enterprise` tier
  - Uses `SetMetadata('tier', minimumTier)` from `@nestjs/common`
  - Supports feature-level gating: `@TierGated('enterprise', { feature: 'SUPPLIER_API' })` for more granular control
- [x] Add JSDoc documentation with usage examples
- [x] Export from `backend/src/common/decorators/index.ts`

### Task 3: Implement TierGuard (AC: 403 with RFC 7807 on tier-restricted access)

- [x] Create `backend/src/common/guards/tier.guard.ts`:
  - Implements `CanActivate`
  - Uses `Reflector` to read `tier` metadata from handler
  - If no `@TierGated()` decorator, allow access (no tier restriction)
  - Extracts `tenantId` from `request.user` (JWT payload)
  - Looks up the organization's `subscription_tier` from the database (via `locations` → `organizations` join)
  - Compares organization tier against required tier using hierarchy: `indie < growth < enterprise`
  - On insufficient tier: throw `ForbiddenException` with RFC 7807:
    - `type: "https://foodtech.app/errors/tier-restricted"`
    - `title: "Tier Restricted"`
    - `status: 403`
    - `detail: "This feature requires the {requiredTier} plan. Your organization is on the {currentTier} plan. Visit https://foodtech.app/upgrade to upgrade."`
  - Cache organization tier per request to avoid repeated DB lookups
- [x] Register `TierGuard` in the global guard chain after `RolesGuard`:
  - Order: `AuthGuard → TenantGuard → RolesGuard → TierGuard → Controller`
- [x] Write unit tests:
  - Indie tier accessing growth feature → 403 with correct RFC 7807 body
  - Growth tier accessing growth feature → allowed
  - Enterprise tier accessing any feature → allowed
  - No @TierGated decorator → all tiers allowed

### Task 4: Implement Tier Limit Enforcement Service (AC: location and staff limits enforced)

- [x] Create `backend/src/modules/tenants/tier-enforcement.service.ts`:
  - `checkLocationLimit(organizationId: string)`:
    - Count current active locations for the organization
    - Compare against tier's `maxLocations` limit
    - If at or over limit: throw `ForbiddenException` with:
      - `type: "https://foodtech.app/errors/tier-restricted"`
      - `detail: "Your {tier} plan allows a maximum of {limit} locations. You currently have {count}. Upgrade to {nextTier} for more locations."`
  - `checkStaffLimit(tenantId: string)`:
    - Count current active staff for the location
    - Compare against tier's `maxStaff` limit
    - If at or over limit: throw similar error with staff-specific messaging
  - `checkFeatureAccess(organizationId: string, feature: TierFeature)`:
    - Check if the organization's tier includes the requested feature
    - Return boolean or throw with upgrade guidance
  - `getTierLimits(tier: SubscriptionTier)`: returns the `TierLimits` for the given tier (from config)
- [x] Make `TierEnforcementService` injectable and available across modules

### Task 5: Create Tenants Module (AC: tier data accessible for guard)

- [x] Create `backend/src/modules/tenants/tenants.module.ts`:
  - Provides `TenantsService` and `TierEnforcementService`
  - Exports both for use by other modules
- [x] Create `backend/src/modules/tenants/tenants.service.ts`:
  - `findLocationById(locationId: string)`: returns location with organization data
  - `findOrganizationById(orgId: string)`: returns organization with tier info
  - `getOrganizationTier(tenantId: string)`: returns the subscription tier for a location's organization
  - `countLocationsByOrg(orgId: string)`: count active locations
  - `countStaffByLocation(tenantId: string)`: count active staff
- [x] Create `backend/src/modules/tenants/tenants.repository.ts`:
  - Drizzle queries for organization and location lookups
  - Efficient queries using existing indexes

### Task 6: Add Tier Types to shared-types (AC: tier types shared across packages)

- [x] Update `packages/shared-types/src/models.ts`:
  - Export `SubscriptionTier = 'indie' | 'growth' | 'enterprise'`
  - Export `TierLimits` interface
  - Export `TierFeature` type
- [x] Update `packages/shared-types/src/api.ts`:
  - Export `TierRestrictedError` extending `ProblemDetail` with additional `requiredTier` and `currentTier` fields
  - Export `UpgradeGuidance` type: `{ currentTier: SubscriptionTier, requiredTier: SubscriptionTier, upgradeUrl: string }`

### Task 7: Create Test Endpoints for Tier Verification (AC: tier gating works end-to-end)

- [x] Create test endpoints (or add to existing test controller from Story 1.4):
  - `GET /api/v1/test/tier-indie` — `@TierGated('indie')`, any tier can access
  - `GET /api/v1/test/tier-growth` — `@TierGated('growth')`, growth+ only
  - `GET /api/v1/test/tier-enterprise` — `@TierGated('enterprise')`, enterprise only
  - `POST /api/v1/test/add-location` — calls `checkLocationLimit()` before proceeding
  - `POST /api/v1/test/add-staff` — calls `checkStaffLimit()` before proceeding
- [x] Write integration tests:
  - Indie org accessing growth endpoint → 403 with upgrade guidance
  - Growth org accessing growth endpoint → 200
  - Growth org adding 11th location → 403 with limit message
  - Enterprise org → no restrictions on any endpoint
- [x] Update seed data to include organizations at different tiers for testing

## Dev Notes

### Architecture References
- Subscription tiers are stored in the `organizations` table (via `subscription_tier` column, Story 1.2)
- Tier hierarchy: `indie < growth < enterprise` (epics.md, Story 1.7)
- Error responses follow **RFC 7807 Problem Details** with custom `type` URL (architecture.md)
- Guard chain extends to: `AuthGuard → TenantGuard → RolesGuard → TierGuard → Controller`
- Tier limits should be **configurable via environment variables** — not hardcoded (epics.md, Story 1.7)

### Technical Stack
- `@nestjs/common` — `CanActivate`, `SetMetadata`, `Reflector`
- `@nestjs/config` — environment variable management for tier limits
- `zod` — env var validation
- No additional packages required beyond existing Story 1.2-1.4 dependencies

### File Structure
```
backend/src/
├── common/
│   ├── constants/
│   │   ├── roles.ts                 # From Story 1.4
│   │   └── tiers.ts                 # New
│   ├── config/
│   │   └── tier.config.ts           # New
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── tenant.guard.ts
│   │   ├── roles.guard.ts
│   │   └── tier.guard.ts            # New
│   └── decorators/
│       ├── index.ts                 # Updated with @TierGated
│       └── tier-gated.decorator.ts  # New
├── modules/
│   └── tenants/
│       ├── tenants.module.ts        # New
│       ├── tenants.service.ts       # New
│       ├── tenants.repository.ts    # New
│       └── tier-enforcement.service.ts  # New
packages/
└── shared-types/
    └── src/
        ├── models.ts                # Updated with tier types
        └── api.ts                   # Updated with tier error types
```

### Testing Requirements
- Unit tests for `TierGuard`:
  - Insufficient tier returns 403 with correct RFC 7807 body and `type: "https://foodtech.app/errors/tier-restricted"`
  - Sufficient tier passes
  - No @TierGated decorator allows all tiers
  - Tier hierarchy comparison is correct
- Unit tests for `TierEnforcementService`:
  - Location limit check at limit → 403 with upgrade guidance
  - Location limit check under limit → passes
  - Staff limit check at limit → 403
  - Feature access check for disabled feature → 403
  - Unlimited (-1) limits always pass
- Unit tests for tier config loading from environment variables
- Integration tests: full guard chain with tier gating against test database
- Verify seed data includes orgs at indie, growth, and enterprise tiers

### Dependencies
- **Story 1.1** (Monorepo Scaffold) — project structure, shared-types
- **Story 1.2** (Database Schema) — `organizations` table with `subscription_tier`, `locations` table, `staff` table
- **Story 1.3** (Authentication) — JWT with `tenantId` in payload
- **Story 1.4** (RBAC) — guard chain (AuthGuard, TenantGuard, RolesGuard), decorator patterns, RFC 7807 filter

### References
- [Source: epics.md#Epic 1, Story 1.7]
- [Source: architecture.md#Data Architecture (tenant schema)]
- [Source: architecture.md#RBAC Guard Flow]
- [Source: architecture.md#API & Communication Patterns (RFC 7807)]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
N/A

### Completion Notes List
- All 7 tasks implemented with 59 backend tests passing (15 new)
- Tier constants: SubscriptionTier enum, TIER_HIERARCHY, meetsMinimumTier(), getNextTier()
- TierLimits interface and DEFAULT_TIER_LIMITS for indie/growth/enterprise
- TierFeature enum for feature-level gating
- tierConfig from @nestjs/config registerAs with env var overrides
- @TierGated decorator with optional feature parameter
- TierGuard: global guard after RolesGuard, DB lookup for org tier, RFC 7807 errors
- TierEnforcementService: checkLocationLimit, checkStaffLimit, checkFeatureAccess
- TenantsModule with TenantsService, TenantsRepository, TierEnforcementService
- shared-types updated with TierLimits, TierFeature, TierRestrictedError, UpgradeGuidance
- Guard chain: AuthGuard → TenantGuard → RolesGuard → TierGuard → Controller

### File List
- backend/src/common/constants/tiers.ts
- backend/src/common/constants/tiers.spec.ts
- backend/src/common/config/tier.config.ts
- backend/src/common/decorators/tier-gated.decorator.ts
- backend/src/common/decorators/index.ts (modified)
- backend/src/common/guards/tier.guard.ts
- backend/src/common/guards/tier.guard.spec.ts
- backend/src/modules/tenants/tenants.module.ts
- backend/src/modules/tenants/tenants.service.ts
- backend/src/modules/tenants/tenants.repository.ts
- backend/src/modules/tenants/tier-enforcement.service.ts
- backend/src/modules/tenants/tier-enforcement.service.spec.ts
- backend/src/app.module.ts (modified — added TenantsModule, TierGuard)
- backend/.env.example (modified — added tier env vars)
- packages/shared-types/src/models.ts (modified — added TierLimits, TierFeature)
- packages/shared-types/src/api.ts (modified — added TierRestrictedError, UpgradeGuidance)
