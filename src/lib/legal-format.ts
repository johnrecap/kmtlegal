const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "medium"
});

const dateTimeFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "medium",
  timeStyle: "short"
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

export function labelFrom(map: Record<string, string>, value?: string | null) {
  if (!value) {
    return "غير محدد";
  }

  return map[value] ?? value;
}
