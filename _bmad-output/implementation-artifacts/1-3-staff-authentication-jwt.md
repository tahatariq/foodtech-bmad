# Story 1.3: Staff Authentication & JWT Token Management

Status: ready-for-dev

## Story

As a **restaurant staff member**,
I want to log in with my credentials and receive a JWT token pair,
So that I can securely access my role-appropriate view.

## Acceptance Criteria (BDD)

**Given** a staff member exists in the database with email and bcrypt-hashed password (cost factor 12)
**When** they POST to `/api/v1/auth/login` with valid credentials
**Then** they receive a 200 response with `accessToken` (JWT, 15-min expiry) and `refreshToken` (7-day expiry)
**And** the JWT payload contains `userId`, `tenantId`, `role`, and `email`

**Given** an access token has expired
**When** the client POSTs to `/api/v1/auth/refresh` with a valid refresh token
**Then** a new access token and rotated refresh token are returned
**And** the previous refresh token is invalidated

**Given** invalid credentials are provided
**When** they POST to `/api/v1/auth/login`
**Then** a 401 response is returned in RFC 7807 format
**And** no token or user information is leaked in the error response

**Given** a valid JWT
**When** it is used to access any protected endpoint
**Then** the `AuthGuard` validates the token and populates `request.user`

## Tasks / Subtasks

### Task 1: Install Auth Dependencies (AC: JWT, bcrypt, Passport)

- [ ] Install NestJS auth packages in `backend/`: `@nestjs/passport`, `@nestjs/jwt`, `passport`, `passport-jwt`, `@types/passport-jwt`
- [ ] Install bcrypt: `bcryptjs`, `@types/bcryptjs`
- [ ] Add `JWT_SECRET` and `JWT_REFRESH_SECRET` to `.env.example` with documentation

### Task 2: Create Auth Module Structure (AC: all auth ACs)

- [ ] Create `backend/src/modules/auth/auth.module.ts`:
  - Imports `JwtModule.registerAsync()` with config from `ConfigService`
  - Imports `PassportModule.register({ defaultStrategy: 'jwt' })`
  - Imports `UsersModule` for user lookup
  - Exports `AuthService`, `JwtStrategy`
- [ ] Create `backend/src/modules/auth/dto/login.dto.ts`:
  - `email`: string (validated with Zod — valid email format)
  - `password`: string (min 8 characters)
- [ ] Create `backend/src/modules/auth/dto/refresh-token.dto.ts`:
  - `refreshToken`: string (required)
- [ ] Create `backend/src/modules/auth/dto/auth-response.dto.ts`:
  - `accessToken`: string
  - `refreshToken`: string

### Task 3: Implement Auth Service (AC: login, refresh, token generation)

- [ ] Create `backend/src/modules/auth/auth.service.ts`:
  - `login(email, password)`:
    - Look up user by email via `UsersService`
    - Compare password with bcrypt (`bcryptjs.compare()`, cost factor 12 hash)
    - If valid, generate access token (15-min expiry) and refresh token (7-day expiry)
    - Store refresh token hash in database (or Redis) for rotation tracking
    - Return `{ accessToken, refreshToken }`
  - `refresh(refreshToken)`:
    - Verify refresh token signature
    - Check if token has been used/invalidated (rotation check)
    - If valid, generate new access + refresh token pair
    - Invalidate the old refresh token
    - Return new token pair
  - `validateUser(payload)`: used by JwtStrategy to populate request.user
- [ ] JWT access token payload: `{ userId: string, tenantId: string, role: string, email: string, type: 'access' }`
- [ ] JWT refresh token payload: `{ userId: string, type: 'refresh', tokenId: string }`

### Task 4: Create Refresh Token Storage (AC: refresh token rotation and invalidation)

- [ ] Create `backend/src/database/schema/refresh-tokens.schema.ts`:
  - `id`: UUID v4 primary key
  - `user_id`: text, foreign key to `users.id`
  - `token_hash`: text, not null (bcrypt hash of the refresh token)
  - `expires_at`: timestamp, not null
  - `is_revoked`: boolean, default false
  - `created_at`: timestamp
- [ ] Generate and run migration for the new table
- [ ] Implement cleanup: revoke all tokens for a user on suspicious activity (e.g., reuse of revoked token)

### Task 5: Implement JWT Strategy and AuthGuard (AC: AuthGuard validates token, populates request.user)

- [ ] Create `backend/src/modules/auth/strategies/jwt.strategy.ts`:
  - Extends `PassportStrategy(Strategy, 'jwt')`
  - Extracts JWT from `Authorization: Bearer <token>` header
  - Validates token using `JWT_SECRET`
  - Returns user payload: `{ userId, tenantId, role, email }`
- [ ] Create `backend/src/common/guards/auth.guard.ts`:
  - Extends `AuthGuard('jwt')` from `@nestjs/passport`
  - On failure, returns RFC 7807 error response with 401 status
  - Populates `request.user` with JWT payload on success
- [ ] Create `backend/src/common/decorators/current-user.decorator.ts`:
  - `@CurrentUser()` parameter decorator that extracts `request.user`
  - Supports `@CurrentUser('userId')` for specific property extraction

### Task 6: Implement Auth Controller (AC: login and refresh endpoints)

- [ ] Create `backend/src/modules/auth/auth.controller.ts`:
  - `POST /api/v1/auth/login` — accepts `LoginDto`, returns `AuthResponseDto`
  - `POST /api/v1/auth/refresh` — accepts `RefreshTokenDto`, returns `AuthResponseDto`
  - `POST /api/v1/auth/logout` — revokes refresh token (optional, good practice)
  - No authentication required on login/refresh endpoints
- [ ] Apply Zod validation pipe to all DTOs

### Task 7: Implement RFC 7807 Error Responses (AC: 401 in RFC 7807 format, no leaking)

- [ ] Create `backend/src/common/filters/http-exception.filter.ts`:
  - Global exception filter that formats all HTTP exceptions as RFC 7807 Problem Details
  - Response shape: `{ type: string, title: string, status: number, detail: string, instance: string }`
  - For 401: `type: "https://foodtech.app/errors/unauthorized"`, no user/token info in response
  - For invalid credentials: generic message "Invalid email or password" (no indication of which field is wrong)
- [ ] Register filter globally in `app.module.ts`
- [ ] Verify error responses never leak password hashes, user existence, or token details

### Task 8: Create Users Module (AC: user lookup for auth)

- [ ] Create `backend/src/modules/users/users.module.ts`
- [ ] Create `backend/src/modules/users/users.service.ts`:
  - `findByEmail(email)`: returns user with staff roles
  - `findById(userId)`: returns user by ID
  - Queries use tenant scoping where applicable
- [ ] Create `backend/src/modules/users/users.repository.ts`:
  - Drizzle queries for user lookup, joining with staff table for role info
- [ ] Export `UsersModule` for use by `AuthModule`

### Task 9: Add Auth Types to shared-types (AC: JWT payload type shared)

- [ ] Add to `packages/shared-types/src/api.ts`:
  - `LoginRequest` type: `{ email: string, password: string }`
  - `AuthResponse` type: `{ accessToken: string, refreshToken: string }`
  - `JwtPayload` type: `{ userId: string, tenantId: string, role: StaffRole, email: string }`
  - `ProblemDetail` type: `{ type: string, title: string, status: number, detail: string, instance?: string }`

## Dev Notes

### Architecture References
- Auth uses **@nestjs/passport + @nestjs/jwt** with JWT access (15 min) + refresh token (7 days) (architecture.md, "Authentication & Security")
- Password hashing: **bcrypt cost factor 12** (architecture.md)
- Guard chain: `AuthGuard (JWT valid?) → TenantGuard → RolesGuard → Controller` (architecture.md, "RBAC Guard Flow")
- Error responses use **RFC 7807 Problem Details** format (architecture.md, "API & Communication Patterns")

### Technical Stack
- `@nestjs/passport` — Passport integration for NestJS
- `@nestjs/jwt` — JWT module for NestJS
- `passport` — authentication middleware
- `passport-jwt` — JWT strategy for Passport
- `bcryptjs` — bcrypt hashing (pure JS, no native deps)
- `zod` — request validation

### File Structure
```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.test.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── refresh-token.dto.ts
│   │       └── auth-response.dto.ts
│   └── users/
│       ├── users.module.ts
│       ├── users.service.ts
│       └── users.repository.ts
├── common/
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── filters/
│       └── http-exception.filter.ts
└── database/
    └── schema/
        └── refresh-tokens.schema.ts
```

### Testing Requirements
- Unit tests for `AuthService`:
  - Valid login returns token pair
  - Invalid password returns 401
  - Non-existent email returns 401 (same error as invalid password)
  - Refresh token rotation works correctly
  - Expired refresh token is rejected
  - Reused/revoked refresh token is rejected
- Unit tests for `JwtStrategy`: validates payload extraction
- Unit tests for `AuthGuard`: validates 401 response format (RFC 7807)
- Integration test: full login flow against test database
- Security test: verify error responses contain no leaked information

### Dependencies
- **Story 1.1** (Monorepo Scaffold) — backend project structure, shared-types package
- **Story 1.2** (Database Schema) — `users` and `staff` tables, DatabaseModule, schema helpers

### References
- [Source: epics.md#Epic 1, Story 1.3]
- [Source: architecture.md#Authentication & Security]
- [Source: architecture.md#RBAC Guard Flow]
- [Source: architecture.md#API & Communication Patterns (RFC 7807)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
