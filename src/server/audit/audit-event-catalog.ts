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
import { consultationOutcomeSourceLabel, roleDisplayLabel } from "@/lib/ui-copy";

export type AuditSeverity = "عادي" | "مهم" | "حساس";
export type AuditCategory = "الأمان" | "العملاء" | "القضايا" | "المواعيد" | "المستندات" | "المهام" | "المالية" | "المحتوى" | "الإدارة" | "النظام";

export const PLAN35_AUDIT_ACTIONS = {
  appointmentCreate: "calendar.appointment_create",
  appointmentReschedule: "calendar.appointment_reschedule",
  manualCaseCreate: "case.manual_create",
  caseCoreUpdate: "case.core_update",
  rolePermissionsReplace: "role.permissions_replace",
  contactReview: "contact.message_review",
  contactArchive: "contact.message_archive"
} as const;

export const PLAN36_AUDIT_ACTIONS = {
  awaitingResult: "consultation.outcome.awaiting_result",
  missed: "consultation.outcome.missed",
  confirmed: "consultation.outcome.confirmed",
  corrected: "consultation.outcome.corrected",
  reopened: "consultation.outcome.reopened",
  rejected: "consultation.reject",
  backfilled: "consultation.outcome.backfilled"
} as const;

export type Plan35AuditAction = (typeof PLAN35_AUDIT_ACTIONS)[keyof typeof PLAN35_AUDIT_ACTIONS];
export type Plan36AuditAction = (typeof PLAN36_AUDIT_ACTIONS)[keyof typeof PLAN36_AUDIT_ACTIONS];

export const PLAN35_AUDIT_SAFE_METADATA_KEYS = {
  [PLAN35_AUDIT_ACTIONS.appointmentCreate]: ["startsAt", "status", "type", "mode", "reasonCode"],
  [PLAN35_AUDIT_ACTIONS.appointmentReschedule]: ["previousStartsAt", "startsAt", "status", "reasonCode"],
  [PLAN35_AUDIT_ACTIONS.manualCaseCreate]: ["requestHash", "source", "status", "reasonCode"],
  [PLAN35_AUDIT_ACTIONS.caseCoreUpdate]: ["changedFields", "previousAssignedLawyerId", "assignedLawyerId", "previousPriority", "priority", "reasonCode"],
  [PLAN35_AUDIT_ACTIONS.rolePermissionsReplace]: ["previousPermissionCount", "permissionCount", "reasonCode"],
  [PLAN35_AUDIT_ACTIONS.contactReview]: ["previousStatus", "status", "topic", "reasonCode"],
  [PLAN35_AUDIT_ACTIONS.contactArchive]: ["previousStatus", "status", "topic", "reasonCode"]
} as const satisfies Record<Plan35AuditAction, readonly string[]>;

const plan36AuditSafeKeys = [
  "fromOutcome",
  "toOutcome",
  "reasonCode",
  "outcomeVersion",
  "source",
  "primaryAppointmentId",
  "assignedLawyerId"
] as const;

export const PLAN36_AUDIT_SAFE_METADATA_KEYS = {
  [PLAN36_AUDIT_ACTIONS.awaitingResult]: plan36AuditSafeKeys,
  [PLAN36_AUDIT_ACTIONS.missed]: plan36AuditSafeKeys,
  [PLAN36_AUDIT_ACTIONS.confirmed]: plan36AuditSafeKeys,
  [PLAN36_AUDIT_ACTIONS.corrected]: plan36AuditSafeKeys,
  [PLAN36_AUDIT_ACTIONS.reopened]: plan36AuditSafeKeys,
  [PLAN36_AUDIT_ACTIONS.rejected]: plan36AuditSafeKeys,
  [PLAN36_AUDIT_ACTIONS.backfilled]: plan36AuditSafeKeys
} as const satisfies Record<Plan36AuditAction, readonly string[]>;

const plan35AuditActions = new Set<Plan35AuditAction>(Object.values(PLAN35_AUDIT_ACTIONS));
const plan36AuditActions = new Set<Plan36AuditAction>(Object.values(PLAN36_AUDIT_ACTIONS));
const safeCaseCoreFields = new Set(["title", "caseType", "courtName", "externalCaseNumber", "priority", "summary", "assignedLawyerId"]);

export function isPlan35AuditAction(action: string): action is Plan35AuditAction {
  return plan35AuditActions.has(action as Plan35AuditAction);
}

export function isPlan36AuditAction(action: string): action is Plan36AuditAction {
  return plan36AuditActions.has(action as Plan36AuditAction);
}

export function plan35SafeAuditMetadata(action: Plan35AuditAction, metadata: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const key of PLAN35_AUDIT_SAFE_METADATA_KEYS[action] as readonly string[]) {
    const value = metadata[key];
    if (key === "changedFields") {
      if (Array.isArray(value)) {
        safe[key] = value.filter((field): field is string => typeof field === "string" && safeCaseCoreFields.has(field));
      }
    } else if (key === "requestHash") {
      if (typeof value === "string" && /^[a-f\d]{64}$/i.test(value)) safe[key] = value;
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return safe;
}

export function plan36SafeAuditMetadata(action: Plan36AuditAction, metadata: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const key of PLAN36_AUDIT_SAFE_METADATA_KEYS[action]) {
    const value = metadata[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return safe;
}

export function plan35AuditMetadataForStorage(action: string, metadata: unknown) {
  const record = metadataRecord(metadata);
  if (isPlan35AuditAction(action)) return plan35SafeAuditMetadata(action, record);
  if (isPlan36AuditAction(action)) return plan36SafeAuditMetadata(action, record);
  return metadata;
}

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
  clientId?: string | null;
  caseId?: string | null;
  lawyerId?: string | null;
  appointmentId?: string | null;
  documentId?: string | null;
  paymentId?: string | null;
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
    clientId?: string | null;
    caseId?: string | null;
    lawyerId?: string | null;
    appointmentId?: string | null;
    documentId?: string | null;
    paymentId?: string | null;
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
  Role: "دور وصلاحيات",
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
  [PLAN35_AUDIT_ACTIONS.manualCaseCreate]: { label: "تم إنشاء قضية يدويًا", category: "القضايا", severity: "مهم", summary: () => "تم إنشاء ملف قضية يدويًا من لوحة الإدارة." },
  [PLAN35_AUDIT_ACTIONS.caseCoreUpdate]: { label: "تم تعديل بيانات قضية", category: "القضايا", severity: "مهم", summary: () => "تم تعديل البيانات الأساسية لملف قضية." },

  "client.archive": { label: "تم أرشفة عميل", category: "العملاء", severity: "مهم", summary: () => "تمت أرشفة ملف عميل." },
  "client.assign": { label: "تم تغيير المحامي المسؤول", category: "العملاء", severity: "مهم", summary: () => "تم تحديث التكليف المسؤول عن ملف عميل." },
  "client.account.create": { label: "تم إنشاء حساب بوابة عميل", category: "الأمان", severity: "حساس", summary: () => "تم إنشاء حساب دخول مربوط بملف عميل." },
  "client.account.link_profile": { label: "تم ربط حساب بملف عميل", category: "الأمان", severity: "حساس", summary: () => "تم ربط حساب دخول عميل بملف CRM." },
  "client.account.password_reset": { label: "تمت إعادة ضبط كلمة مرور عميل", category: "الأمان", severity: "حساس", summary: () => "تم تحديث كلمة مرور حساب بوابة عميل." },
  "client.create": { label: "تم إنشاء عميل", category: "العملاء", severity: "عادي", summary: () => "تم إنشاء ملف عميل جديد." },
  "client.update": { label: "تم تعديل عميل", category: "العملاء", severity: "عادي", summary: ({ metadata }) => statusSummary("تم تعديل ملف عميل", "Client", metadata) },

  "contact.message_create": { label: "تم استقبال رسالة تواصل", category: "العملاء", severity: "عادي", summary: () => "تم استقبال رسالة تواصل من الموقع." },
  "contact.message_update": { label: "تم تحديث رسالة تواصل", category: "الإدارة", severity: "عادي", summary: ({ metadata }) => statusSummary("تم تحديث حالة رسالة تواصل", "ContactMessage", metadata) },
  [PLAN35_AUDIT_ACTIONS.contactReview]: { label: "تمت مراجعة رسالة تواصل", category: "الإدارة", severity: "عادي", summary: () => "تمت مراجعة رسالة تواصل." },
  [PLAN35_AUDIT_ACTIONS.contactArchive]: { label: "تمت أرشفة رسالة تواصل", category: "الإدارة", severity: "مهم", summary: () => "تمت أرشفة رسالة تواصل." },

  "consultation.assign": { label: "تم إسناد استشارة", category: "العملاء", severity: "عادي", summary: () => "تم إسناد طلب استشارة إلى مسؤول." },
  "consultation.convert_to_case": { label: "تم تحويل استشارة إلى قضية", category: "القضايا", severity: "مهم", summary: () => "تم تحويل طلب استشارة إلى ملف قضية." },
  "consultation.create_public": { label: "تم استقبال طلب استشارة", category: "العملاء", severity: "عادي", summary: () => "تم استقبال طلب استشارة من الموقع." },
  "consultation.assistant_book": { label: "تم حجز استشارة عبر المساعد", category: "المواعيد", severity: "مهم", summary: ({ metadata }) => withDateSummary("تم حجز موعد استشارة عبر المساعد", metadata.startsAt) },
  "consultation.reject": { label: "تم رفض استشارة", category: "العملاء", severity: "مهم", summary: () => "تم رفض طلب استشارة بعد المراجعة." },
  [PLAN36_AUDIT_ACTIONS.awaitingResult]: { label: "استشارة بانتظار النتيجة", category: "المواعيد", severity: "مهم", summary: () => "انتهى موعد الاستشارة وأصبحت النتيجة بانتظار التأكيد." },
  [PLAN36_AUDIT_ACTIONS.missed]: { label: "طلب استشارة فائت", category: "المواعيد", severity: "مهم", summary: () => "انتهى موعد طلب الاستشارة دون إسناد أو مراجعة." },
  [PLAN36_AUDIT_ACTIONS.confirmed]: { label: "تم تأكيد نتيجة استشارة", category: "المواعيد", severity: "مهم", summary: () => "تم تأكيد النتيجة النهائية للاستشارة." },
  [PLAN36_AUDIT_ACTIONS.corrected]: { label: "تم تصحيح نتيجة استشارة", category: "المواعيد", severity: "حساس", summary: () => "تم تصحيح النتيجة النهائية مع الاحتفاظ بالسجل السابق." },
  [PLAN36_AUDIT_ACTIONS.reopened]: { label: "تمت إعادة فتح طلب فائت", category: "المواعيد", severity: "مهم", summary: () => "تمت إعادة فتح الطلب الفائت وجدولة موعد جديد." },
  [PLAN36_AUDIT_ACTIONS.backfilled]: { label: "تمت مصالحة نتيجة استشارة", category: "النظام", severity: "عادي", summary: () => "تمت مطابقة نتيجة تاريخية أثناء المصالحة." },

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

  [PLAN35_AUDIT_ACTIONS.rolePermissionsReplace]: { label: "تم استبدال صلاحيات دور", category: "الأمان", severity: "حساس", summary: () => "تم استبدال مجموعة الصلاحيات المسندة إلى دور قابل للإدارة." },

  "settings.update": { label: "تم تعديل إعداد", category: "الإدارة", severity: "حساس", summary: ({ metadata }) => `تم تعديل ${settingLabel(metadata.key)}.` },

  "task.create": { label: "تم إنشاء مهمة", category: "المهام", severity: "عادي", summary: () => "تم إنشاء مهمة داخلية جديدة." },
  "task.update": { label: "تم تعديل مهمة", category: "المهام", severity: "عادي", summary: ({ metadata }) => statusSummary("تم تعديل مهمة", "Task", metadata) },

  "user.create": { label: "تم إنشاء مستخدم", category: "الإدارة", severity: "حساس", summary: () => "تم إنشاء حساب مستخدم جديد." },
  "user.password.update": { label: "تم تغيير كلمة مرور", category: "الأمان", severity: "حساس", summary: () => "تم تغيير كلمة مرور مستخدم." },
  "user.update": { label: "تم تعديل مستخدم", category: "الإدارة", severity: "حساس", summary: () => "تم تعديل بيانات مستخدم." }
};

export function toAdminAuditLogDto(row: AuditLogPresentationRow): AdminAuditLogDto {
  const storedMetadata = metadataRecord(row.metadata);
  const metadata = isPlan35AuditAction(row.action)
    ? plan35SafeAuditMetadata(row.action, storedMetadata)
    : isPlan36AuditAction(row.action)
      ? plan36SafeAuditMetadata(row.action, storedMetadata)
      : storedMetadata;
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
    details: auditDetails(row.action, row.resourceType, metadata),
    technical: {
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId ?? null,
      clientId: row.clientId ?? null,
      caseId: row.caseId ?? null,
      lawyerId: row.lawyerId ?? null,
      appointmentId: row.appointmentId ?? null,
      documentId: row.documentId ?? null,
      paymentId: row.paymentId ?? null
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

function auditDetails(action: string, resourceType: string, metadata: Record<string, unknown>) {
  const details: Array<{ label: string; value: string }> = [];
  addDetail(details, "رقم الفاتورة", stringValue(metadata.invoiceNumber));
  addDetail(details, "القيمة", moneyValue(metadata.amount, metadata.currency));
  addStatusDetail(details, resourceType, metadata);
  addDetail(
    details,
    "المصدر",
    isPlan36AuditAction(action)
      ? consultationOutcomeSourceLabel(stringValue(metadata.source))
      : stringValue(metadata.source)
  );
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
