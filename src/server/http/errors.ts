import { NextResponse } from "next/server";
import {
  localizeApiMessage,
  plan35ApiErrorSourceMessages,
  plan36ApiErrorSourceMessages
} from "@/lib/ui-copy";
import type { PublicLocale } from "@/lib/public-locale";
import { safeLog } from "@/server/observability/safe-log";

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
  | "APPOINTMENT_CONFLICT"
  | "CONSULTATION_OUTCOME_NOT_READY"
  | "CONSULTATION_STATE_CHANGED"
  | "CONSULTATION_REOPEN_REQUIRED"
  | "CASE_REFERENCE_CONFLICT"
  | "SETTING_READ_ONLY"
  | "TOO_MANY_REQUESTS"
  | "RATE_LIMITED"
  | "PAYMENT_PROVIDER_DISABLED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "MALWARE_DETECTED"
  | "MALWARE_SCANNER_UNAVAILABLE"
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

export type CanonicalApiErrorCode = Exclude<ApiErrorCode, "UNAUTHENTICATED">;

export function canonicalApiErrorCode(code: ApiErrorCode): CanonicalApiErrorCode {
  return code === "UNAUTHENTICATED" ? "AUTH_REQUIRED" : code;
}

const stableApiMessageByCode: Partial<Record<CanonicalApiErrorCode, string>> = {
  APPOINTMENT_CONFLICT: plan35ApiErrorSourceMessages.APPOINTMENT_CONFLICT,
  CASE_REFERENCE_CONFLICT: plan35ApiErrorSourceMessages.CASE_REFERENCE_CONFLICT,
  SETTING_READ_ONLY: plan35ApiErrorSourceMessages.SETTING_READ_ONLY,
  CONSULTATION_OUTCOME_NOT_READY: plan36ApiErrorSourceMessages.CONSULTATION_OUTCOME_NOT_READY,
  CONSULTATION_STATE_CHANGED: plan36ApiErrorSourceMessages.CONSULTATION_STATE_CHANGED,
  CONSULTATION_REOPEN_REQUIRED: plan36ApiErrorSourceMessages.CONSULTATION_REOPEN_REQUIRED
};

export function canonicalApiErrorMessage(code: ApiErrorCode, fallbackMessage: string) {
  return stableApiMessageByCode[canonicalApiErrorCode(code)] ?? fallbackMessage;
}

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
  constructor(message = "البيانات المرسلة غير مكتملة أو غير صحيحة.", details?: ApiErrorDetails) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationApiError";
  }
}

export class RateLimitApiError extends ApiError {
  constructor(message = "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.") {
    super(429, "RATE_LIMITED", message);
    this.name = "RateLimitApiError";
  }
}

export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  requestId?: string,
  details?: ApiErrorDetails,
  options: { locale?: PublicLocale } = {}
) {
  return NextResponse.json(
    {
      error: {
        code: canonicalApiErrorCode(code),
        message: localizeApiMessage(canonicalApiErrorMessage(code, message), options.locale),
        details: details ?? [],
        requestId
      }
    },
    { status, headers: { "Cache-Control": "no-store" } }
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

export function errorToResponse(
  error: unknown,
  requestId: string,
  context: { routeGroup?: string; method?: string; locale?: PublicLocale } = {}
) {
  if (error instanceof ApiError) {
    return jsonError(error.status, error.code, error.message, requestId, error.details, { locale: context.locale });
  }

  safeLog("error", "api.unexpected_error", {
    requestId,
    routeGroup: context.routeGroup ?? null,
    method: context.method ?? null,
    status: 500,
    code: "INTERNAL_ERROR",
    errorName: error instanceof Error ? error.name : typeof error
  });

  return jsonError(500, "INTERNAL_ERROR", "حدث خطأ غير متوقع في الخادم. حاول مرة أخرى لاحقًا.", requestId, undefined, { locale: context.locale });
}

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
