# Story 7.3: API Documentation Portal

Status: review

## Story

As **Dev (POS integration developer)**,
I want comprehensive, interactive API documentation,
So that I can understand and use the FoodTech API without contacting support.

## Acceptance Criteria (BDD)

**Given** Dev navigates to the API documentation portal
**When** the page loads at `/api/docs`
**Then** the Swagger UI displays the auto-generated OpenAPI 3.0 specification from NestJS controller decorators, with all endpoints grouped by module (orders, inventory, webhooks, integrations), request/response schemas, authentication requirements, and example payloads

**Given** the documentation portal
**When** Dev browses endpoints
**Then** each endpoint shows: HTTP method, path, description, required headers (auth), request body schema (with Zod validation rules), response schema, error responses (RFC 7807 format), and rate limit information

**Given** Dev wants to try an endpoint
**When** she uses the "Try It" feature in Swagger UI
**Then** she can authenticate with her API key, send requests to the sandbox environment, and see live responses — enabling interactive exploration

**Given** the OpenAPI spec
**When** Dev needs client SDK generation
**Then** the spec is exportable as JSON/YAML at `/api/docs/openapi.json`, compatible with standard code generators (openapi-generator, swagger-codegen) for any language

## Tasks / Subtasks

### Task 1: NestJS Swagger Setup (AC: auto-generated OpenAPI spec)

- [ ] Install `@nestjs/swagger` and `swagger-ui-express`
- [ ] Configure Swagger in `backend/src/main.ts` with title, description, version, auth schemes
- [ ] Set up document builder with API key and JWT bearer auth schemes
- [ ] Enable Swagger UI at `/api/docs`
- [ ] Export OpenAPI spec as JSON at `/api/docs/openapi.json`

### Task 2: Controller Decorators (AC: endpoint documentation)

- [ ] Add `@ApiTags()` to all controllers for module grouping
- [ ] Add `@ApiOperation()` with summary and description to each endpoint
- [ ] Add `@ApiBody()` with Zod-derived schemas for request bodies
- [ ] Add `@ApiResponse()` for success and error responses (including RFC 7807 format)
- [ ] Add `@ApiBearerAuth()` or `@ApiSecurity('api-key')` as appropriate
- [ ] Add `@ApiHeader()` for custom headers (X-FoodTech-Signature, etc.)

### Task 3: Schema Documentation (AC: request/response schemas)

- [ ] Create Swagger DTOs from Zod schemas using `@nestjs/swagger` decorators
- [ ] Document all enums (order status, roles, subscription tiers)
- [ ] Add example payloads for each endpoint
- [ ] Document rate limit information per endpoint

### Task 4: Try It Configuration (AC: interactive exploration)

- [ ] Configure Swagger UI with "Try It Out" enabled
- [ ] Set sandbox environment as default server for Try It requests
- [ ] Add API key authentication input in Swagger UI
- [ ] Verify CORS allows Swagger UI to make requests

### Task 5: Write Tests (AC: all)

- [ ] Verify Swagger UI loads at `/api/docs` (integration test)
- [ ] Verify OpenAPI JSON is valid and exportable at `/api/docs/openapi.json`
- [ ] Verify all endpoints are documented (compare route count vs spec endpoints)

## Dev Notes

- @nestjs/swagger auto-generates OpenAPI 3.0 from controller decorators
- Zod schemas need to be bridged to Swagger DTOs (use nestjs-zod or manual mapping)
- Swagger UI is served by the backend — no separate frontend needed
- OpenAPI spec export enables SDK generation for any language

### Project Structure Notes

- `backend/src/main.ts` — Swagger configuration
- All `*.controller.ts` files — Swagger decorators
- `backend/src/common/dto/` — Swagger-compatible DTOs

### References

- [Source: epics.md#Story 7.3]
- [Source: architecture.md#API & Communication]
- [Source: prd.md#FR52]

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
