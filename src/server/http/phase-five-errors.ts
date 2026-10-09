import { phaseFiveApiCopy } from "@/content/phase-five-api-copy";
import { ApiError, errorToResponse, getRequestId } from "./errors";

export function phaseFiveErrorResponse(error: unknown, request: Request) {
  const locale = request.headers.get("x-kmt-locale") === "en" ? "en" : "ar";
  const copy = phaseFiveApiCopy[locale];
  const localized = error instanceof ApiError ? new ApiError(error.status, error.code, copy[error.code] ?? copy.fallback) : error;
  return errorToResponse(localized, getRequestId(request), { locale, method: request.method });
}
