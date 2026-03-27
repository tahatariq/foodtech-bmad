/**
 * RFC 7807 Problem Details for HTTP APIs.
 */
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Health check response shape.
 */
export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

/**
 * Auth request/response types.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export interface TierRestrictedError extends ProblemDetail {
  requiredTier?: string;
  currentTier?: string;
}

export interface UpgradeGuidance {
  currentTier: string;
  requiredTier: string;
  upgradeUrl: string;
}
