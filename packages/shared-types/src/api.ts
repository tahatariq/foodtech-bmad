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
