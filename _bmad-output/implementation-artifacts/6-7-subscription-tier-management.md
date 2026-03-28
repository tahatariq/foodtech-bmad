# Story 6.7: Subscription Tier Management & Feature Gates

Status: review

## Story

As **David (organization owner) or Alex (admin)**,
I want the system to enforce subscription tier limits and allow tier upgrades,
So that features are gated appropriately and growth-path upsells are clear.

## Acceptance Criteria (BDD)

**Given** a tenant is on the Indie tier
**When** the owner attempts to add a second location
**Then** the system displays a clear upgrade prompt: "Your Indie plan supports 1 location. Upgrade to Growth for up to 10 locations" with a CTA to upgrade — the action is blocked, not silently ignored

**Given** a tenant is on the Growth tier
**When** the owner accesses the Management Console
**Then** the Supplier Portal integration, CSV import/export, cross-location analytics, and priority support features are enabled — features not available on Indie are visible but gated with upgrade prompts

**Given** any tier-gated action
**When** the backend processes the request
**Then** tier enforcement is applied via the subscription gate middleware (established in Epic 1, Story 1.7), returning a 403 with a RFC 7807 error body: `{ type: "tier-limit-exceeded", detail: "Feature requires Growth tier or above" }`

## Tasks / Subtasks

### Task 1: Frontend TierGate Component (AC: upgrade prompts)

- [ ] Create `frontend/src/components/common/TierGate/TierGate.tsx` — wrapper component
- [ ] Props: `requiredTier: 'indie' | 'growth' | 'enterprise'`, `children`, `fallback?`
- [ ] When current tier < required: show upgrade prompt with CTA instead of children
- [ ] Upgrade prompt: clear message about what tier is needed and what it unlocks

### Task 2: Feature Visibility Matrix (AC: Growth tier features)

- [ ] Define feature-to-tier mapping in shared-types: `TIER_FEATURES` constant
- [ ] Supplier Portal: Growth+, CSV import/export: Growth+, Cross-location analytics: Growth+, Priority support: Enterprise
- [ ] Wrap gated features in TierGate component throughout Management Console
- [ ] Indie-restricted features show as visible but grayed with upgrade prompt

### Task 3: Location Limit Enforcement (AC: Indie → 1 location)

- [ ] Frontend: intercept "Add Location" action with tier check
- [ ] Backend: verify location count vs tier limit in POST `/api/v1/organizations/:orgId/locations`
- [ ] Return 403 with RFC 7807 body including upgrade guidance
- [ ] Display user-friendly upgrade prompt in UI

### Task 4: Upgrade Flow UI (AC: CTA to upgrade)

- [ ] Create upgrade prompt modal/inline component
- [ ] Show current tier, required tier, and feature comparison
- [ ] CTA button (initially links to contact/external billing — actual payment in future)

### Task 5: Write Tests (AC: all)

- [ ] Unit tests for TierGate component (renders children vs upgrade prompt)
- [ ] Unit tests for feature visibility matrix
- [ ] Integration test: Indie tenant blocked from adding 2nd location (frontend + backend)
- [ ] API test: 403 with RFC 7807 body for tier-gated endpoints

## Dev Notes

- Builds on Story 1.7 `@TierGated()` decorator and `TierGuard` for backend enforcement
- Frontend uses TierGate wrapper component for consistent upgrade UX
- Features are visible but gated — show what users are missing, don't hide it
- Upgrade CTA is a placeholder — actual payment integration is future work

### Project Structure Notes

- `frontend/src/components/common/TierGate/` — gate wrapper component
- `packages/shared-types/src/tiers.ts` — tier definitions and feature mapping
- Backend: uses existing TierGuard from Story 1.7

### References

- [Source: epics.md#Story 6.7]
- [Source: epics.md#Story 1.7 (TierGuard foundation)]
- [Source: prd.md#FR43]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
