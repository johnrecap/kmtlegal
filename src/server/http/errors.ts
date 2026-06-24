import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "AUTH_REQUIRED"
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "FORBIDDEN"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "RATE_LIMITED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "FEATURE_DISABLED"
  | "TWO_FACTOR_REQUIRED"
  | "TWO_FACTOR_INVALID"
  | "TWO_FACTOR_EXPIRED"
  | "EMAIL_DELIVERY_FAILED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_OUTPUT_INVALID"
  | "APPROVAL_REQUIRED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type ApiErrorDetails = Array<{
  path?: string;
  message: string;
  code?: string;
}>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: ApiErrorDetails
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationApiError extends ApiError {
  constructor(message = "Request validation failed.", details?: ApiErrorDetails) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationApiError";
  }
}

export class RateLimitApiError extends ApiError {
  constructor(message = "Too many requests.") {
    super(429, "RATE_LIMITED", message);
    this.name = "RateLimitApiError";
  }
}

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  requestId?: string,
  details?: ApiErrorDetails
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? [],
        requestId
      }
    },
    { status }
  );
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      data
    },
    {
      status: init?.status ?? 200,
      headers: {
        "Cache-Control": "no-store",
        ...Object.fromEntries(new Headers(init?.headers).entries())
      }
    }
  );
}

export function errorToResponse(error: unknown, requestId: string) {
  if (error instanceof ApiError) {
    return jsonError(error.status, error.code, error.message, requestId, error.details);
  }

  return jsonError(500, "INTERNAL_ERROR", "An unexpected server error occurred.", requestId);
}

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
