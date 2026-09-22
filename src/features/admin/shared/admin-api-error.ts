import { localizeApiMessage } from "@/lib/ui-copy";

type AdminApiPayload<T> = {
  data?: T;
  requestId?: string;
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
};

const errorCodeCopy: Record<string, string> = {
  UNAUTHENTICATED: "انتهت جلسة الدخول. سجّل الدخول ثم حاول مرة أخرى.",
  PERMISSION_DENIED: "لا تملك الصلاحية المطلوبة لتنفيذ هذا الإجراء.",
  VALIDATION_ERROR: "راجع البيانات المدخلة ثم حاول مرة أخرى.",
  BAD_REQUEST: "تعذر تنفيذ الطلب بالبيانات الحالية.",
  NOT_FOUND: "لم يعد العنصر المطلوب متاحًا.",
  CONFLICT: "تغيرت البيانات منذ فتح الصفحة. راجع أحدث نسخة ثم أعد المحاولة.",
  RATE_LIMITED: "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.",
  INTERNAL_ERROR: "حدث خطأ غير متوقع في الخادم. حاول مرة أخرى لاحقًا."
};

export class AdminApiError extends Error {
  readonly requestId?: string;
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, options: { requestId?: string; code?: string; status?: number } = {}) {
    super(message);
    this.name = "AdminApiError";
    this.requestId = options.requestId;
    this.code = options.code;
    this.status = options.status;
  }
}

export async function readAdminApiResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as AdminApiPayload<T>;
  if (response.ok && payload.data !== undefined) {
    return payload.data;
  }

  const code = payload.error?.code;
  const requestId = payload.error?.requestId ?? payload.requestId ?? response.headers?.get?.("x-request-id") ?? undefined;
  const localized = payload.error?.message
    ? localizeApiMessage(payload.error.message, "ar")
    : code && errorCodeCopy[code]
      ? errorCodeCopy[code]
      : "تعذر تنفيذ الإجراء الآن.";
  const safeMessage = /^[\u0600-\u06ff]/.test(localized) ? localized : (code && errorCodeCopy[code]) || "تعذر تنفيذ الإجراء الآن.";
  throw new AdminApiError(requestId ? `${safeMessage} (مرجع الطلب: ${requestId})` : safeMessage, { requestId, code, status: response.status });
}

export async function readAdminApiErrorMessage(response: Response, fallback = "تعذر تنفيذ الإجراء الآن.") {
  return (await readAdminApiError(response, fallback)).message;
}

export async function readAdminApiError(response: Response, fallback = "تعذر تنفيذ الإجراء الآن.") {
  try {
    await readAdminApiResponse<unknown>(response);
    return new AdminApiError(fallback);
  } catch (error) {
    return error instanceof AdminApiError ? error : new AdminApiError(fallback);
  }
}
