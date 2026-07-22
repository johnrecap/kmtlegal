export const LEGAL_TIME_ZONE = "Africa/Cairo";

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "medium",
  timeZone: LEGAL_TIME_ZONE
});

const dateTimeFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: LEGAL_TIME_ZONE
});

const cairoPartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
  timeZone: LEGAL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

const cairoDatePartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
  timeZone: LEGAL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function formatDate(value?: Date | string | null) {
  if (!value) {
    return "غير محدد";
  }

  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) {
    return "غير محدد";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatCairoDateInput(value: Date | string) {
  const parts = cairoDatePartsFormatter.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addCairoDateInputDays(value: string, days: number) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match || !Number.isInteger(days)) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const ordinal = new Date(Date.UTC(year, month - 1, day));
  if (
    ordinal.getUTCFullYear() !== year ||
    ordinal.getUTCMonth() !== month - 1 ||
    ordinal.getUTCDate() !== day
  ) {
    return null;
  }
  ordinal.setUTCDate(ordinal.getUTCDate() + days);
  return [
    String(ordinal.getUTCFullYear()).padStart(4, "0"),
    String(ordinal.getUTCMonth() + 1).padStart(2, "0"),
    String(ordinal.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function cairoLocalDateTimeToIso(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const desired = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute
  );
  const normalized = new Date(desired);
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day ||
    normalized.getUTCHours() !== hour ||
    normalized.getUTCMinutes() !== minute
  ) {
    return null;
  }
  let candidate = desired;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const represented = cairoLocalOrdinal(new Date(candidate));
    const difference = desired - represented;
    candidate += difference;
    if (difference === 0) break;
  }
  if (Number.isNaN(candidate) || cairoLocalOrdinal(new Date(candidate)) !== desired) {
    return null;
  }
  return new Date(candidate).toISOString();
}

function cairoLocalOrdinal(value: Date) {
  const parts = cairoPartsFormatter.formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  return Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute")
  );
}

export function formatMoney(amount: number | string, currency = "EGP") {
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const consultationStatusLabels: Record<string, string> = {
  NEW: "جديد",
  REVIEWING: "قيد المراجعة",
  PAYMENT_PENDING: "في انتظار الدفع",
  SCHEDULED: "تم تحديد موعد",
  REJECTED: "مرفوض",
  CONVERTED: "تم التحويل"
};

export const urgencyLabels: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "عاجلة"
};

export const modeLabels: Record<string, string> = {
  PHONE: "هاتف",
  ONLINE: "أونلاين",
  OFFICE: "في المكتب",
  COURT: "محكمة"
};

export const serviceCategoryLabels: Record<string, string> = {
  "legal-consultation": "استشارات حسب المجال",
  "corporate-business-services": "الشركات والعقود التجارية",
  "real-estate-legal-support": "مراجعة قانونية عقارية",
  "claims-collections": "المطالبات المالية والتسويات",
  corporate: "الشركات والعقود",
  "real-estate": "العقارات",
  employment: "العمل",
  disputes: "المنازعات"
};

export function consultationServiceCategoryLabel(value?: string | null) {
  if (!value) return "غير محدد";
  return serviceCategoryLabels[value] ?? "مجال استشارة آخر";
}

export const caseStatusLabels: Record<string, string> = {
  NEW: "جديدة",
  UNDER_REVIEW: "قيد المراجعة",
  ACTIVE: "نشطة",
  AWAITING_JUDGMENT: "في انتظار الحكم",
  COMPLETED: "مكتملة",
  CLOSED: "مغلقة",
  ARCHIVED: "مؤرشفة"
};

export const clientStatusLabels: Record<string, string> = {
  LEAD: "عميل محتمل",
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  ARCHIVED: "مؤرشف",
  DELETED: "محذوف"
};

export const priorityLabels: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "عاجلة"
};

export const partyTypeLabels: Record<string, string> = {
  CLIENT: "العميل",
  OPPOSING_PARTY: "الطرف الآخر",
  WITNESS: "شاهد",
  EXPERT: "خبير",
  OTHER: "آخر"
};

export const documentStatusLabels: Record<string, string> = {
  NEW: "جديد",
  UNDER_REVIEW: "قيد المراجعة",
  NEEDS_CLARIFICATION: "يحتاج توضيح",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  DELETED: "محذوف"
};

export const documentCategoryLabels: Record<string, string> = {
  CONTRACT: "عقد",
  COURT_FILE: "ملف محكمة",
  IDENTITY: "هوية",
  EVIDENCE: "دليل",
  PAYMENT: "دفع",
  OTHER: "أخرى"
};

export const documentVisibilityLabels: Record<string, string> = {
  CLIENT_VISIBLE: "مرئي للعميل",
  STAFF_ONLY: "فريق العمل فقط",
  INTERNAL_ONLY: "داخلي فقط"
};

export const appointmentStatusLabels: Record<string, string> = {
  SCHEDULED: "مجدول",
  RESCHEDULED: "تمت إعادة الجدولة",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
  NO_SHOW: "لم يحضر"
};

export const appointmentTypeLabels: Record<string, string> = {
  CONSULTATION: "استشارة",
  COURT_SESSION: "جلسة محكمة",
  INTERNAL_MEETING: "اجتماع داخلي",
  CALL: "مكالمة",
  ONLINE_MEETING: "اجتماع أونلاين",
  CASE_FOLLOW_UP: "متابعة قضية",
  INTERNAL: "داخلي"
};

export const taskStatusLabels: Record<string, string> = {
  NEW: "جديدة",
  IN_PROGRESS: "قيد التنفيذ",
  REVIEW: "قيد المراجعة",
  COMPLETED: "مكتملة",
  OVERDUE: "متأخرة",
  ARCHIVED: "مؤرشفة"
};

export const taskPriorityLabels: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "عاجلة"
};

export const paymentStatusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  ISSUED: "صادرة",
  PENDING: "معلقة",
  PAID: "مدفوعة",
  OVERDUE: "متأخرة",
  CANCELLED: "ملغاة"
};

export const conversationStatusLabels: Record<string, string> = {
  OPEN: "مفتوحة",
  WAITING_STAFF: "بانتظار الفريق",
  WAITING_CLIENT: "بانتظار العميل",
  CLOSED: "مغلقة",
  ARCHIVED: "مؤرشفة"
};

export function labelFrom(map: Record<string, string>, value?: string | null) {
  if (!value) {
    return "غير محدد";
  }

  return map[value] ?? value;
}
