export const phaseFiveApiCopy: Record<"ar" | "en", Record<string, string>> = {
  ar: {
    AUTH_REQUIRED: "سجّل الدخول بحساب موثّق للمتابعة.", PERMISSION_DENIED: "لا تملك الصلاحية المطلوبة لهذا الإجراء.", FORBIDDEN: "لا تملك الصلاحية المطلوبة لهذا الإجراء.",
    NOT_FOUND: "لم يتم العثور على الطلب المطلوب.", TOKEN_EXPIRED: "رابط التحقق غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.",
    VALIDATION_ERROR: "راجع البيانات المطلوبة وأعد المحاولة.", CONFLICT: "تغيرت البيانات أو حالة الطلب. حدّث الصفحة وراجع التفاصيل قبل المتابعة.",
    APPOINTMENT_CONFLICT: "الموعد المطلوب غير متاح. اختر موعدًا بديلًا ليُراجعه المكتب.",
    RATE_LIMITED: "انتظر قليلًا قبل إعادة المحاولة.", TOO_MANY_REQUESTS: "انتظر قليلًا قبل إعادة المحاولة.",
    EMAIL_DELIVERY_FAILED: "تعذر إرسال رسالة التحقق. أعد المحاولة لاحقًا أو تواصل مع المكتب.",
    AI_PROVIDER_UNAVAILABLE: "المساعد غير متاح مؤقتًا. يمكنك إعادة المحاولة أو التواصل مع المكتب.", AI_PROVIDER_TIMEOUT: "تأخر رد المساعد. أعد المحاولة أو تواصل مع المكتب.",
    AI_OUTPUT_INVALID: "تعذر إكمال رد المساعد. أعد المحاولة أو تواصل مع المكتب.", FEATURE_DISABLED: "هذه الخدمة غير متاحة حاليًا. تواصل مع المكتب.",
    fallback: "تعذر إكمال الإجراء. أعد المحاولة أو تواصل مع المكتب."
  },
  en: {
    AUTH_REQUIRED: "Sign in with a verified account to continue.", PERMISSION_DENIED: "You do not have permission for this action.", FORBIDDEN: "You do not have permission for this action.",
    NOT_FOUND: "The requested item was not found.", TOKEN_EXPIRED: "The verification link is invalid or expired. Request a new link.",
    VALIDATION_ERROR: "Check the required details and try again.", CONFLICT: "The details or request status changed. Refresh and review them before continuing.",
    APPOINTMENT_CONFLICT: "The requested time is unavailable. Choose an alternative for office review.",
    RATE_LIMITED: "Please wait before trying again.", TOO_MANY_REQUESTS: "Please wait before trying again.",
    EMAIL_DELIVERY_FAILED: "The verification email could not be sent. Try later or contact the office.",
    AI_PROVIDER_UNAVAILABLE: "The assistant is temporarily unavailable. Retry or contact the office.", AI_PROVIDER_TIMEOUT: "The assistant took too long to respond. Retry or contact the office.",
    AI_OUTPUT_INVALID: "The assistant could not complete its response. Retry or contact the office.", FEATURE_DISABLED: "This service is currently unavailable. Contact the office.",
    fallback: "The action could not be completed. Try again or contact the office."
  }
};
