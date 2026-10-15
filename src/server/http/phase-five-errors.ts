import { phaseFiveApiCopy } from "@/content/phase-five-api-copy";
import { ApiError, errorToResponse, getRequestId } from "./errors";
import { ConversationRateLimitError } from "@/server/ai/conversation-rate-limit";

export function phaseFiveErrorResponse(error: unknown, request: Request) {
  const locale = request.headers.get("x-kmt-locale") === "en" ? "en" : "ar";
  const copy = phaseFiveApiCopy[locale];
  const localized = error instanceof ApiError ? new ApiError(error.status, error.code, copy[error.code] ?? copy.fallback) : error;
  const response = errorToResponse(localized, getRequestId(request), { locale, method: request.method });
  if (error instanceof ConversationRateLimitError && error.retryable && error.retryAfterMs !== null) {
    response.headers.set("Retry-After", String(Math.ceil(error.retryAfterMs / 1000)));
  }
  return response;
}
