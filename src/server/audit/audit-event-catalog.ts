import {
  appointmentStatusLabels,
  appointmentTypeLabels,
  caseStatusLabels,
  clientStatusLabels,
  documentStatusLabels,
  formatDateTime,
  formatMoney,
  labelFrom,
  modeLabels,
  paymentStatusLabels,
  taskStatusLabels
} from "@/lib/legal-format";
import { articleStatusLabels, caseStudyStatusLabels, socialDraftStatusLabels, socialPlatformLabels } from "@/lib/legal-content";
import { roleDisplayLabel } from "@/lib/ui-copy";

export type AuditSeverity = "عادي" | "مهم" | "حساس";
export type AuditCategory = "الأمان" | "العملاء" | "القضايا" | "المواعيد" | "المستندات" | "المهام" | "المالية" | "المحتوى" | "الإدارة" | "النظام";

type AuditActor = {
  name: string;
  role: {
    name: string;
  };
} | null;

export type AuditLogPresentationRow = {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: unknown;
  createdAt: Date | string;
  actor?: AuditActor;
};

export type AdminAuditLogDto = {
  id: string;
  occurredAt: string;
  actor: { name: string; role: string } | null;
  event: {
    code: string;
    label: string;
    category: AuditCategory;
    severity: AuditSeverity;
  };
  resource: {
    type: string;
    label: string;
    id?: string | null;
  };
  summary: string;
  details: Array<{ label: string; value: string }>;
  technical: {
    action: string;
    resourceType: string;
    resourceId?: string | null;
  };
};

type AuditEventDefinition = {
  label: string;
  category: AuditCategory;
  severity: AuditSeverity;
  summary?: (context: AuditSummaryContext) => string;
};

type AuditSummaryContext = {
  metadata: Record<string, unknown>;
  resourceLabel: string;
};

export type AuditFilterOption = {
  value: string;
  label: string;
};

const resourceLabels: Record<string, string> = {
  Appointment: "موعد",
  Article: "مقال",
  CaseSession: "جلسة قضية",
  CaseStudy: "دراسة حالة",
  Client: "عميل",
  ContactMessage: "رسالة تواصل",
  ConsultationRequest: "طلب استشارة",
  Document: "مستند",
  LegalCase: "قضية",
  Payment: "فاتورة",
  Session: "جلسة دخول",
  SocialPostDraft: "مسودة محتوى",
  SystemSetting: "إعدادات النظام",
  Task: "مهمة",
  User: "مستخدم"
};

const settingLabels: Record<string, string> = {
  "email.policy": "سياسة البريد",
  "office.profile": "بيانات المكتب",
  "security.staff2fa": "حوكمة التحقق الثنائي",
  "storage.policy": "سياسة التخزين"
};

const contactMessageStatusLabels: Record<string, string> = {
  NEW: "جديدة",
  REVIEWED: "تمت مراجعتها",
  ARCHIVED: "مؤرشفة"
};

const contactTopicLabels: Record<string, string> = {
  consultation: "استشارة",
  documents: "مستندات",
  media: "إعلام",
  other: "أخرى"
};

const auditEventDefinitions: Record<string, AuditEventDefinition> = {
  "auth.login_failed": { label: "محاولة دخول فاشلة", category: "الأمان", severity: "حساس", summary: () => "تم تسجيل محاولة دخول غير ناجحة." },
  "auth.login_password_verified_pending_2fa": {
    label: "كلمة المرور صحيحة وتنتظر التحقق",
    category: "الأمان",
    severity: "مهم",
    summary: () => "تم قبول كلمة المرور وينتظر الحساب خطوة التحقق الإضافية."
  },
  "auth.login_success": { label: "تسجيل دخول ناجح", category: "الأمان", severity: "مهم", summary: () => "تم تسجيل دخول ناجح إلى النظام." },
  "auth.2fa_totp_verified": { label: "تم التحقق الثنائي", category: "الأمان", severity: "مهم", summary: () => "تم تأكيد التحقق الثنائي للحساب." },
  "auth.2fa_email_otp_created": { label: "تم إنشاء رمز تحقق بالبريد", category: "الأمان", severity: "مهم", summary: () => "تم إنشاء رمز تحقق إضافي للحساب." },
  "auth.2fa_email_otp_verified": { label: "تم تأكيد رمز البريد", category: "الأمان", severity: "مهم", summary: () => "تم قبول رمز التحقق المرسل بالبريد." },
  "auth.2fa_totp_failed": { label: "فشل التحقق الثنائي", category: "الأمان", severity: "حساس", summary: () => "تم تسجيل محاولة تحقق ثنائي غير ناجحة." },
  "auth.2fa_email_otp_failed": { label: "فشل رمز التحقق بالبريد", category: "الأمان", severity: "حساس", summary: () => "تم تسجيل محاولة غير ناجحة لاستخدام رمز تحقق بالبريد." },
  "auth.2fa_reset": { label: "إعادة ضبط التحقق الثنائي", category: "الأمان", severity: "حساس", summary: () => "تمت إعادة ضبط التحقق الثنائي لمستخدم." },

  "calendar.appointment_create": { label: "تم إنشاء موعد", category: "المواعيد", severity: "عادي", summary: ({ metadata }) => withDateSummary("تم إنشاء موعد", metadata.startsAt) },
  "calendar.appointment_reschedule": { label: "تمت إعادة جدولة موعد", category: "المواعيد", severity: "مهم", summary: ({ metadata }) => withDateSummary("تمت إعادة جدولة موعد", metadata.startsAt) },

  "case.session_create": { label: "تمت إضافة جلسة قضية", category: "القضايا", severity: "مهم", summary: ({ metadata }) => withDateSummary("تمت إضافة جلسة قضية", metadata.sessionDate) },
  "case.status_update": { label: "تم تغيير حالة قضية", category: "القضايا", severity: "مهم", summary: ({ metadata }) => statusSummary("تم تغيير حالة قضية", "LegalCase", metadata) },

  "client.archive": { label: "تم أرشفة عميل", category: "العملاء", severity: "مهم", summary: () => "تمت أرشفة ملف عميل." },
  "client.assign": { label: "تم تغيير المحامي المسؤول", category: "العملاء", severity: "مهم", summary: () => "تم تحديث التكليف المسؤول عن ملف عميل." },
  "client.create": { label: "تم إنشاء عميل", category: "العملاء", severity: "عادي", summary: () => "تم إنشاء ملف عميل جديد." },
  "client.update": { label: "تم تعديل عميل", category: "العملاء", severity: "عادي", summary: ({ metadata }) => statusSummary("تم تعديل ملف عميل", "Client", metadata) },

  "contact.message_create": { label: "تم استقبال رسالة تواصل", category: "العملاء", severity: "عادي", summary: () => "تم استقبال رسالة تواصل من الموقع." },
  "contact.message_update": { label: "تم تحديث رسالة تواصل", category: "الإدارة", severity: "عادي", summary: ({ metadata }) => statusSummary("تم تحديث حالة رسالة تواصل", "ContactMessage", metadata) },

  "consultation.assign": { label: "تم إسناد استشارة", category: "العملاء", severity: "عادي", summary: () => "تم إسناد طلب استشارة إلى مسؤول." },
  "consultation.convert_to_case": { label: "تم تحويل استشارة إلى قضية", category: "القضايا", severity: "مهم", summary: () => "تم تحويل طلب استشارة إلى ملف قضية." },
  "consultation.create_public": { label: "تم استقبال طلب استشارة", category: "العملاء", severity: "عادي", summary: () => "تم استقبال طلب استشارة من الموقع." },
  "consultation.reject": { label: "تم رفض استشارة", category: "العملاء", severity: "مهم", summary: () => "تم رفض طلب استشارة بعد المراجعة." },

  "content.article_create": { label: "تم إنشاء مقال", category: "المحتوى", severity: "عادي", summary: () => "تم إنشاء مقال جديد." },
  "content.article_update": { label: "تم تعديل مقال", category: "المحتوى", severity: "عادي", summary: () => "تم تعديل مقال." },
  "content.case_study_create": { label: "تم إنشاء دراسة حالة", category: "المحتوى", severity: "عادي", summary: () => "تم إنشاء دراسة حالة جديدة." },
  "content.case_study_update": { label: "تم تعديل دراسة حالة", category: "المحتوى", severity: "عادي", summary: () => "تم تعديل دراسة حالة." },
  "content.social_draft_ai_create": { label: "تم إنشاء مسودة بالذكاء الاصطناعي", category: "المحتوى", severity: "مهم", summary: () => "تم إنشاء مسودة محتوى باستخدام الذكاء الاصطناعي." },
  "content.social_draft_create": { label: "تم إنشاء مسودة محتوى", category: "المحتوى", severity: "عادي", summary: () => "تم إنشاء مسودة محتوى جديدة." },
  "content.social_draft_update": { label: "تم تعديل مسودة محتوى", category: "المحتوى", severity: "عادي", summary: () => "تم تعديل مسودة محتوى." },

  "document.delete": { label: "تم حذف مستند", category: "المستندات", severity: "حساس", summary: () => "تم حذف مستند من النظام." },
  "document.download": { label: "تم تنزيل مستند", category: "المستندات", severity: "مهم", summary: () => "تم تنزيل مستند من النظام." },
  "document.update": { label: "تم تعديل مستند", category: "المستندات", severity: "عادي", summary: ({ metadata }) => statusSummary("تم تعديل مستند", "Document", metadata) },
  "document.upload": { label: "تم رفع مستند", category: "المستندات", severity: "عادي", summary: () => "تم رفع مستند جديد." },

  "finance.payment_create": { label: "تم إنشاء فاتورة", category: "المالية", severity: "مهم", summary: ({ metadata }) => paymentSummary("تم إنشاء فاتورة", metadata) },
  "finance.payment_update": { label: "تم تعديل فاتورة", category: "المالية", severity: "مهم", summary: ({ metadata }) => paymentSummary("تم تعديل فاتورة", metadata) },

  "installer.locked": { label: "تم إغلاق معالج التثبيت", category: "النظام", severity: "حساس", summary: () => "تم إغلاق معالج التثبيت بعد الإعداد." },
  "installer.super_admin.bootstrap": { label: "تم إنشاء المدير الرئيسي", category: "النظام", severity: "حساس", summary: () => "تم إنشاء حساب المدير الرئيسي أثناء التثبيت." },

  "settings.update": { label: "تم تعديل إعداد", category: "الإدارة", severity: "حساس", summary: ({ metadata }) => `تم تعديل ${settingLabel(metadata.key)}.` },

  "task.create": { label: "تم إنشاء مهمة", category: "المهام", severity: "عادي", summary: () => "تم إنشاء مهمة داخلية جديدة." },
  "task.update": { label: "تم تعديل مهمة", category: "المهام", severity: "عادي", summary: ({ metadata }) => statusSummary("تم تعديل مهمة", "Task", metadata) },

  "user.create": { label: "تم إنشاء مستخدم", category: "الإدارة", severity: "حساس", summary: () => "تم إنشاء حساب مستخدم جديد." },
  "user.password.update": { label: "تم تغيير كلمة مرور", category: "الأمان", severity: "حساس", summary: () => "تم تغيير كلمة مرور مستخدم." },
  "user.update": { label: "تم تعديل مستخدم", category: "الإدارة", severity: "حساس", summary: () => "تم تعديل بيانات مستخدم." }
};

export function toAdminAuditLogDto(row: AuditLogPresentationRow): AdminAuditLogDto {
  const metadata = metadataRecord(row.metadata);
  const resourceLabel = auditResourceLabel(row.resourceType);
  const definition = auditEventDefinitions[row.action] ?? fallbackEventDefinition(row.action);
  const summary = definition.summary?.({ metadata, resourceLabel }) ?? `${definition.label} على ${resourceLabel}.`;

  return {
    id: row.id,
    occurredAt: new Date(row.createdAt).toISOString(),
    actor: row.actor ? { name: row.actor.name, role: roleDisplayLabel(row.actor.role.name) } : null,
    event: {
      code: row.action,
      label: definition.label,
      category: definition.category,
      severity: definition.severity
    },
    resource: {
      type: row.resourceType,
      label: resourceLabel,
      id: row.resourceId ?? null
    },
    summary,
    details: auditDetails(row.resourceType, metadata),
    technical: {
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId ?? null
    }
  };
}

export function auditActionOptionLabel(action: string) {
  return auditEventDefinitions[action]?.label ?? fallbackEventDefinition(action).label;
}

export function auditResourceLabel(resourceType: string) {
  return resourceLabels[resourceType] ?? "مورد داخلي";
}

export function auditFilterOption(value: string, label: string): AuditFilterOption {
  return { value, label };
}

function fallbackEventDefinition(action: string): AuditEventDefinition {
  return {
    label: "حدث تدقيق",
    category: "النظام",
    severity: "عادي",
    summary: () => "تم تسجيل حدث تشغيلي داخل النظام."
  };
}

function metadataRecord(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? (metadata as Record<string, unknown>) : {};
}

function auditDetails(resourceType: string, metadata: Record<string, unknown>) {
  const details: Array<{ label: string; value: string }> = [];
  addDetail(details, "رقم الفاتورة", stringValue(metadata.invoiceNumber));
  addDetail(details, "القيمة", moneyValue(metadata.amount, metadata.currency));
  addStatusDetail(details, resourceType, metadata);
  addDetail(details, "المصدر", stringValue(metadata.source));
  addDetail(details, "الموضوع", contactTopicValue(metadata.topic));
  addDetail(details, "الإعداد", settingValue(metadata.key));
  addDetail(details, "طريقة التحقق", methodValue(metadata.method));
  addDetail(details, "طريقة التسليم", deliveryValue(metadata.delivery));
  addDetail(details, "الدور", roleValue(metadata.role ?? metadata.targetRole));
  addDetail(details, "نوع الموعد", labelValue(appointmentTypeLabels, metadata.type));
  addDetail(details, "طريقة الموعد", labelValue(modeLabels, metadata.mode));
  addDetail(details, "المنصة", labelValue(socialPlatformLabels, metadata.platform));
  addDetail(details, "وقت الموعد", dateTimeValue(metadata.startsAt ?? metadata.sessionDate));
  addDetail(details, "الموعد السابق", dateTimeValue(metadata.previousStartsAt));
  addDetail(details, "الموعد الجديد", dateTimeValue(metadata.nextSessionDate));
  addDetail(details, "سبب الإجراء", stringValue(metadata.reason));
  addDetail(details, "عدد المحاولات", stringValue(metadata.attemptCount));

  return details;
}

function addStatusDetail(details: Array<{ label: string; value: string }>, resourceType: string, metadata: Record<string, unknown>) {
  const status = statusValue(resourceType, metadata.status);
  const previousStatus = statusValue(resourceType, metadata.previousStatus);
  if (previousStatus && status) {
    addDetail(details, "الحالة", `من ${previousStatus} إلى ${status}`);
    return;
  }
  addDetail(details, "الحالة", status);
}

function addDetail(details: Array<{ label: string; value: string }>, label: string, value: string | null) {
  if (value) {
    details.push({ label, value });
  }
}

function statusSummary(prefix: string, resourceType: string, metadata: Record<string, unknown>) {
  const status = statusValue(resourceType, metadata.status);
  const previousStatus = statusValue(resourceType, metadata.previousStatus);
  if (previousStatus && status) {
    return `${prefix} من ${previousStatus} إلى ${status}.`;
  }
  if (status) {
    return `${prefix} إلى ${status}.`;
  }
  return `${prefix}.`;
}

function paymentSummary(prefix: string, metadata: Record<string, unknown>) {
  const amount = moneyValue(metadata.amount, metadata.currency);
  const invoiceNumber = stringValue(metadata.invoiceNumber);
  if (amount && invoiceNumber) {
    return `${prefix} رقم ${invoiceNumber} بقيمة ${amount}.`;
  }
  if (amount) {
    return `${prefix} بقيمة ${amount}.`;
  }
  if (invoiceNumber) {
    return `${prefix} رقم ${invoiceNumber}.`;
  }
  return `${prefix}.`;
}

function withDateSummary(prefix: string, value: unknown) {
  const date = dateTimeValue(value);
  return date ? `${prefix} في ${date}.` : `${prefix}.`;
}

function statusValue(resourceType: string, value: unknown) {
  const raw = stringValue(value);
  if (!raw) {
    return null;
  }

  const labels = statusLabelsForResource(resourceType);
  return labels ? labelFrom(labels, raw) : raw;
}

function statusLabelsForResource(resourceType: string): Record<string, string> | null {
  switch (resourceType) {
    case "Appointment":
      return appointmentStatusLabels;
    case "Article":
      return articleStatusLabels;
    case "CaseStudy":
      return caseStudyStatusLabels;
    case "Client":
      return clientStatusLabels;
    case "ContactMessage":
      return contactMessageStatusLabels;
    case "Document":
      return documentStatusLabels;
    case "LegalCase":
      return caseStatusLabels;
    case "Payment":
      return paymentStatusLabels;
    case "SocialPostDraft":
      return socialDraftStatusLabels;
    case "Task":
      return taskStatusLabels;
    default:
      return null;
  }
}

function labelValue(labels: Record<string, string>, value: unknown) {
  const raw = stringValue(value);
  return raw ? labelFrom(labels, raw) : null;
}

function contactTopicValue(value: unknown) {
  const raw = stringValue(value);
  return raw ? labelFrom(contactTopicLabels, raw) : null;
}

function methodValue(value: unknown) {
  const method = stringValue(value);
  if (method === "totp") {
    return "تطبيق المصادقة";
  }
  if (method === "email_otp") {
    return "رمز البريد";
  }
  return method;
}

function deliveryValue(value: unknown) {
  const delivery = stringValue(value);
  if (delivery === "queued") {
    return "في قائمة الإرسال";
  }
  if (delivery === "sent") {
    return "تم الإرسال";
  }
  return delivery;
}

function settingValue(value: unknown) {
  const key = stringValue(value);
  return key ? settingLabel(key) : null;
}

function settingLabel(value: unknown) {
  const key = stringValue(value);
  return key ? settingLabels[key] ?? key : "إعدادات النظام";
}

function roleValue(value: unknown) {
  const role = stringValue(value);
  return role ? roleDisplayLabel(role) : null;
}

function moneyValue(amount: unknown, currency: unknown) {
  const numeric = typeof amount === "number" ? amount : Number(stringValue(amount));
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return formatMoney(numeric, stringValue(currency) ?? "EGP");
}

function dateTimeValue(value: unknown) {
  const raw = stringValue(value);
  if (!raw) {
    return null;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : formatDateTime(date);
}

function stringValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "string") {
    return value === "[REDACTED]" ? null : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}
