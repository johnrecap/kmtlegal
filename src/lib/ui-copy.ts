export const commonUiCopy = {
  unknown: "غير محدد",
  notAssigned: "غير معين",
  noData: "لا توجد بيانات",
  noResults: "لا توجد نتائج مطابقة.",
  saved: "تم الحفظ.",
  serverUnavailable: "لا يمكن الوصول إلى الخادم الآن. حاول مرة أخرى بعد قليل."
} as const;

export const paymentGatewayUiCopy = {
  primaryProvider: "بوابة الدفع الأساسية",
  standbyProvider: "احتياطي غير مفعل",
  ready: "جاهزة",
  missingConfiguration: "ناقص إعدادات",
  disabledOptionSuffix: "احتياطي غير مفعل",
  disabledProviderHint: "PayTabs محفوظة كاحتياطي ولا يمكن اختيارها للحجوزات الجديدة في هذا الإصدار."
} as const;

export const consultationAvailabilityUiCopy = {
  days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  modes: { ONLINE: "عن بُعد", PHONE: "هاتف", OFFICE: "المكتب" },
  saved: "تم حفظ أوقات الاستشارات.",
  saveFailed: "تعذر حفظ أوقات الاستشارات.",
  connectionFailed: "تعذر حفظ أوقات الاستشارات. تحقق من الاتصال وحاول مرة أخرى.",
  rulesTitle: "قواعد حجز الاستشارات",
  duration: "مدة الاستشارة بالدقائق",
  leadTime: "الحد الأدنى قبل الموعد بالساعات",
  bookingWindow: "عدد الأيام الظاهرة للعميل",
  timezone: "المنطقة الزمنية",
  enabledDays: "أيام العمل المفعلة",
  weeklyHours: "مواعيد الاستشارات الأسبوعية",
  start: "البداية",
  end: "النهاية",
  availableMethods: "طرق الاستشارة المتاحة",
  save: "حفظ أوقات الاستشارات"
} as const;

export const protectedRecoveryUiCopy = {
  loadingTitle: "جارٍ تحميل الصفحة",
  loadingDescription: "لحظات ويتم تجهيز البيانات المطلوبة.",
  errorTitle: "تعذر تحميل هذه الصفحة",
  errorDescription: "لم تتغير بياناتك. حاول مرة أخرى، وإذا استمرت المشكلة تواصل مع مسؤول النظام.",
  retry: "إعادة المحاولة",
  notFoundTitle: "الصفحة غير موجودة",
  notFoundDescription: "الرابط الذي فتحته غير صحيح أو لم يعد متاحًا لحسابك.",
  backToDashboard: "العودة إلى الرئيسية",
  adminOnlyTitle: "غير مسموح بالدخول إلى لوحة المكتب",
  adminOnlyDescription: "هذا المسار مخصص لفريق العمل فقط. حسابات العملاء تظل داخل بوابة العميل."
} as const;

export const plan35AdminRouteLabels = {
  "admin.routes.dashboard.home": "لوحة التحكم",
  "admin.routes.consultations.availability": "أوقات الاستشارات",
  "admin.routes.consultations.list": "طلبات الاستشارة",
  "admin.routes.clients.list": "العملاء",
  "admin.routes.messages.list": "محادثات العملاء",
  "admin.routes.cases.list": "القضايا",
  "admin.routes.cases.create": "إنشاء قضية",
  "admin.routes.calendar.list": "التقويم",
  "admin.routes.tasks.list": "المهام",
  "admin.routes.documents.list": "المستندات",
  "admin.routes.finance.list": "المالية",
  "admin.routes.reports.list": "التقارير",
  "admin.routes.content.home": "المحتوى",
  "admin.routes.contacts.list": "رسائل التواصل",
  "admin.routes.notifications.list": "الإشعارات",
  "admin.routes.users.list": "المستخدمون",
  "admin.routes.roles.list": "الأدوار والصلاحيات",
  "admin.routes.settings.home": "الإعدادات",
  "admin.routes.audit.list": "سجل التدقيق"
} as const;

export type Plan35AdminRouteLabelKey = keyof typeof plan35AdminRouteLabels;

export const plan35AdminRouteGroupLabels = {
  "office-operations": "تشغيل المكتب",
  "files-finance": "الملفات والمالية",
  administration: "الإدارة"
} as const;

export const plan35DashboardMetricCopy = {
  "appointments.today": { label: "مواعيد اليوم", definition: "المواعيد النشطة المجدولة اليوم بتوقيت القاهرة." },
  "tasks.overdue": { label: "المهام المتأخرة", definition: "المهام غير المكتملة التي تجاوزت موعد استحقاقها." },
  "consultations.unreviewed": { label: "استشارات تنتظر المراجعة", definition: "طلبات الاستشارة المجدولة التي لم يراجعها الفريق بعد." },
  "contacts.new": { label: "رسائل تواصل جديدة", definition: "رسائل التواصل الموجودة حاليًا في حالة جديدة." },
  "documents.under-review": { label: "مستندات تحت المراجعة", definition: "المستندات الموجودة حاليًا في حالة تحت المراجعة." },
  "cases.active": { label: "قضايا نشطة", definition: "ملفات القضايا الموجودة حاليًا في حالة نشطة." },
  "clients.active": { label: "عملاء نشطون", definition: "ملفات العملاء الموجودة حاليًا في حالة نشطة." }
} as const;

export const plan35DashboardTimeframeCopy = {
  "before-generated-at": "حتى وقت تحديث اللوحة",
  "cairo-today": "اليوم بتوقيت القاهرة",
  "as-of-generated-at": "كما هي عند تحديث اللوحة"
} as const;

export const plan35DashboardScopeCopy = {
  "office-wide": "كل المكتب ضمن صلاحياتك",
  "actor-assigned": "المسند إليك مباشرة",
  "actor-or-case-assigned": "المسند إليك مباشرة أو عبر القضية",
  "actor-owned": "السجلات الخاصة بك"
} as const;

export const plan35AdminStateCopy = {
  loading: { title: "جارٍ تحميل بيانات القسم", description: "يمكنك متابعة استخدام بقية مساحة العمل أثناء التحميل." },
  empty: { title: "لا توجد بيانات مطابقة", description: "عدّل الفلاتر أو ابدأ بإضافة سجل جديد إذا كانت صلاحيتك تسمح." },
  unavailable: { title: "هذا القسم غير متاح مؤقتًا", description: "باقي مساحة العمل ما زالت متاحة. حاول تحميل هذا القسم مرة أخرى." },
  denied: { title: "هذا القسم غير متاح لحسابك", description: "يمكنك متابعة العمل من الأقسام الظاهرة لك في القائمة أو الرجوع إلى مساحة العمل." }
} as const;

export const plan35AdminRecoveryCopy = {
  retry: "إعادة المحاولة",
  refresh: "تحديث البيانات",
  backToWorkspace: "العودة إلى مساحة العمل",
  caseReferenceRetry: "إنشاء محاولة جديدة وإعادة الإرسال"
} as const;

export const plan35AdminShellCopy = {
  adminMode: "إدارة المكتب",
  portalMode: "بوابة العميل",
  adminBadge: "إدارة",
  clientBadge: "عميل",
  workspaceEyebrow: "مساحة عمل المكتب",
  desktopNavigation: "التنقل في لوحة التحكم",
  mobileNavigation: "التنقل في مساحة العمل على الهاتف",
  openNavigation: "فتح قائمة الإدارة",
  closeNavigation: "إغلاق قائمة الإدارة",
  navigationTitle: "القائمة الرئيسية لمساحة العمل",
  logout: "تسجيل الخروج",
  unknownSection: "شاشة إدارية",
  fallbackUser: "فريق المكتب"
} as const;

export const plan35AdminRestrictedActionCopy = {
  caseStudyCreate: {
    title: "إنشاء دراسات الحالة غير متاح",
    description: "يمكنك مراجعة المحتوى المتاح، لكن إنشاء دراسة حالة جديدة غير متاح لهذا الحساب."
  },
  socialDraftCreate: {
    title: "إنشاء مسودات السوشيال غير متاح",
    description: "يمكنك مراجعة المسودات المتاحة، لكن إنشاء مسودة جديدة غير متاح لهذا الحساب."
  },
  articleCreate: {
    title: "إنشاء المقالات غير متاح",
    description: "يمكنك مراجعة المقالات المتاحة، لكن إنشاء مقال جديد غير متاح لهذا الحساب."
  },
  paymentSettingsManage: {
    title: "إدارة الدفع غير متاحة",
    description: "يمكنك قراءة معلومات الدفع، لكن حفظ إعدادات الدفع غير متاح لهذا الحساب."
  },
  invoiceManage: {
    title: "إدارة الفواتير غير متاحة",
    description: "يمكنك قراءة الفواتير، لكن إنشاءها أو تعديلها غير متاح لهذا الحساب."
  }
} as const;

export const plan35ApiErrorSourceMessages = {
  APPOINTMENT_CONFLICT: "Another appointment already exists for this lawyer at this time. Choose a different time.",
  CASE_REFERENCE_CONFLICT: "A unique case reference could not be generated. Create a new request and retry.",
  SETTING_READ_ONLY: "Storage runtime settings are managed by the server environment and cannot be changed from the admin dashboard."
} as const;

export const plan35ApiErrorCopy = {
  APPOINTMENT_CONFLICT: {
    message: "يوجد موعد آخر للمحامي في هذا التوقيت. اختر وقتًا مختلفًا.",
    recoveryAction: "اختيار وقت مختلف"
  },
  CASE_REFERENCE_CONFLICT: {
    message: "تعذر إنشاء رقم مرجعي فريد للقضية. احتفظنا بالبيانات؛ أنشئ محاولة جديدة ثم أعد الإرسال.",
    recoveryAction: plan35AdminRecoveryCopy.caseReferenceRetry,
    preservesEnteredValues: true
  },
  SETTING_READ_ONLY: {
    message: "إعدادات التخزين الفعلية تُدار من بيئة الخادم ولا يمكن تعديلها من لوحة التحكم.",
    recoveryAction: "مراجعة إعدادات بيئة الخادم"
  }
} as const;

export type Plan35StableApiErrorCode = keyof typeof plan35ApiErrorCopy;

export const roleDisplayLabels: Record<string, string> = {
  "Super Admin": "مدير النظام",
  "Office Admin": "مدير المكتب",
  Secretary: "سكرتيرة المكتب",
  "Marketing Staff": "مسؤول التسويق",
  Lawyer: "محام",
  Client: "عميل",
  Guest: "زائر"
};

export const technicalValueDisplayLabels: Record<string, string> = {
  manual: "يدوي",
  "read-only": "للقراءة فقط",
  disabled: "غير مفعل",
  dev: "وضع تجريبي",
  smtp: "SMTP",
  true: "نعم",
  false: "لا"
};

const apiExactMessages: Record<string, string> = {
  "Authentication required.": "يجب تسجيل الدخول للمتابعة.",
  "Active session required.": "انتهت الجلسة أو لم تعد نشطة. سجل الدخول مرة أخرى.",
  [plan35ApiErrorSourceMessages.APPOINTMENT_CONFLICT]: plan35ApiErrorCopy.APPOINTMENT_CONFLICT.message,
  [plan35ApiErrorSourceMessages.CASE_REFERENCE_CONFLICT]: plan35ApiErrorCopy.CASE_REFERENCE_CONFLICT.message,
  [plan35ApiErrorSourceMessages.SETTING_READ_ONLY]: plan35ApiErrorCopy.SETTING_READ_ONLY.message,
  "Invalid request.": "الطلب غير صحيح.",
  "Request validation failed.": "البيانات المرسلة غير مكتملة أو غير صحيحة.",
  "Too many requests.": "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.",
  "Too many requests. Try again later.": "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.",
  "Request protection is temporarily unavailable. Try again later.": "حماية الطلبات غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.",
  "File security scanning is temporarily unavailable. Try again later.": "فحص أمان الملفات غير متاح مؤقتًا. حاول رفع الملف مرة أخرى بعد قليل.",
  "The uploaded file failed the security scan and was rejected.": "تم رفض الملف المرفوع لأنه لم يجتز فحص الأمان.",
  "Contact form data is incomplete.": "بيانات نموذج التواصل غير مكتملة.",
  "Consultation request data is incomplete.": "بيانات طلب الاستشارة غير مكتملة.",
  "An unexpected server error occurred.": "حدث خطأ غير متوقع في الخادم. حاول مرة أخرى لاحقًا.",
  "A recent consultation request already exists for the same phone number and area. Please wait for the team review or contact us.":
    "يوجد طلب استشارة قريب بنفس رقم الهاتف ونفس المجال. انتظر مراجعة الفريق أو تواصل معنا.",
  "Appointment date is invalid.": "الموعد المختار غير واضح. اختر موعدًا جديدًا.",
  "Appointment date must be in the future.": "الموعد ده لم يعد متاحًا. اختر موعدًا جديدًا.",
  "This consultation slot is no longer available. Please choose another time.": "الموعد ده لم يعد متاحًا. اختر موعدًا آخر.",
  "This consultation slot is already booked.": "الموعد ده تم حجزه بالفعل. اختر موعدًا آخر.",
  "A scheduled consultation already exists for this contact and service area.":
    "يوجد بالفعل حجز استشارة مجدول لنفس بيانات التواصل ونفس مجال الطلب.",
  "Email OTP fallback is disabled for this release.": "التحقق عبر البريد غير متاح في هذه النسخة.",
  "TOTP is deferred and disabled in this release.": "التحقق الثنائي غير متاح في هذه النسخة.",
  "Staff 2FA reset is deferred and disabled in this release.": "إعادة ضبط التحقق الثنائي للموظفين غير متاحة في هذه النسخة.",
  "Staff access is required.": "هذا المسار مخصص لفريق المكتب.",
  "Client portal access is required.": "هذا المسار مخصص لبوابة العميل.",
  "Only Super Admin can create user email accounts.": "إنشاء حسابات البريد للمستخدمين متاح لمدير النظام فقط.",
  "Only Super Admin can change user passwords.": "تغيير كلمات مرور المستخدمين متاح لمدير النظام فقط.",
  "You cannot change your own active Super Admin access.": "لا يمكنك تعديل صلاحية حساب مدير النظام النشط الذي تستخدمه الآن.",
  "SMTP/email policy management is disabled for this release.": "إدارة سياسة البريد وSMTP غير متاحة في هذه النسخة.",
  "Installer is disabled.": "معالج التثبيت غير مفعل.",
  "Installer setup token is invalid.": "رمز إعداد التثبيت غير صحيح.",
  "Database schema": "مخطط قاعدة البيانات",
  "Production seed": "بيانات التشغيل الأساسية",
  "First Super Admin": "مدير النظام الأول",
  "Installer lock": "قفل معالج التثبيت",
  "No active Super Admin exists yet.": "لم يتم إنشاء حساب مدير نظام نشط بعد.",
  "An active Super Admin already exists.": "يوجد حساب مدير نظام نشط بالفعل.",
  "Super Admin role is missing. Run migrations and production seed first.": "دور مدير النظام غير موجود. شغل الهجرات وتجهيز بيانات الإنتاج أولًا.",
  "Installer bootstrap is closed because an active Super Admin already exists.": "تم إغلاق إنشاء المدير الأول لأن حساب مدير نظام نشط موجود بالفعل.",
  "Create the first Super Admin before closing the installer.": "أنشئ حساب مدير النظام الأول قبل إغلاق معالج التثبيت.",
  "Migrations cannot be verified until Prisma initializes.": "لا يمكن التحقق من الهجرات قبل تهيئة Prisma.",
  "Role seed cannot be verified until Prisma initializes.": "لا يمكن التحقق من أدوار النظام قبل تهيئة Prisma.",
  "First Super Admin cannot be verified until Prisma initializes.": "لا يمكن التحقق من مدير النظام الأول قبل تهيئة Prisma.",
  "Installer completion cannot be verified until Prisma initializes.": "لا يمكن التحقق من اكتمال التثبيت قبل تهيئة Prisma.",
  "Migrations cannot be verified until the database connects.": "لا يمكن التحقق من الهجرات قبل الاتصال بقاعدة البيانات.",
  "Role seed cannot be verified until the database connects.": "لا يمكن التحقق من أدوار النظام قبل الاتصال بقاعدة البيانات.",
  "First Super Admin cannot be verified until the database connects.": "لا يمكن التحقق من مدير النظام الأول قبل الاتصال بقاعدة البيانات.",
  "Installer completion cannot be verified until the database connects.": "لا يمكن التحقق من اكتمال التثبيت قبل الاتصال بقاعدة البيانات.",
  "At least one active Super Admin exists.": "يوجد حساب مدير نظام نشط واحد على الأقل.",
  "First Super Admin status cannot be verified.": "لا يمكن التحقق من حالة مدير النظام الأول.",
  "Create the first active Super Admin before opening the app.": "أنشئ حساب مدير النظام الأول قبل فتح التطبيق.",
  "Installer request failed.": "تعذر تنفيذ طلب التثبيت.",
  "Preflight failed.": "تعذر تشغيل فحص الجاهزية.",
  "Bootstrap failed.": "تعذر إنشاء حساب المدير الأول.",
  "Could not lock the installer.": "تعذر قفل معالج التثبيت."
};

const apiSubjectLabels: Record<string, string> = {
  "Analytics event": "حدث التحليلات",
  "Article": "المقال",
  "Assignment": "بيانات التعيين",
  "Audit log": "سجل التدقيق",
  "Calendar appointment": "الموعد",
  "Case": "القضية",
  "Case session": "جلسة القضية",
  "Case status": "حالة القضية",
  "Case study": "دراسة الحالة",
  "Client": "العميل",
  "Client assignment": "تعيين العميل",
  "Client archive": "أرشفة العميل",
  "Client profile": "ملف العميل",
  "Contact message status": "حالة رسالة التواصل",
  "Conversion": "بيانات التحويل",
  "Document": "المستند",
  "Document delete": "حذف المستند",
  "Document owner client": "العميل مالك المستند",
  "Email policy setting": "إعدادات البريد",
  "Installer bootstrap": "بيانات إنشاء المدير الأول",
  "Installer preflight": "بيانات فحص الجاهزية",
  "Lawyer profile": "ملف المحامي",
  "Password": "كلمة المرور",
  "Payment": "الفاتورة",
  "Payment list query": "فلاتر الفواتير",
  "Profile": "الملف الشخصي",
  "Reject": "بيانات الرفض",
  "Report": "التقرير",
  "Role": "الدور",
  "Service": "الخدمة",
  "Setting": "الإعداد",
  "Social draft": "مسودة السوشيال",
  "Storage policy setting": "إعدادات التخزين",
  "Task": "المهمة",
  "User": "المستخدم",
  "User create": "بيانات إنشاء المستخدم"
};

export function roleDisplayLabel(roleName: string | null | undefined) {
  if (!roleName) return commonUiCopy.unknown;
  return roleDisplayLabels[roleName] ?? roleName;
}

export function technicalValueDisplayLabel(value: string | null | undefined) {
  if (!value) return commonUiCopy.unknown;
  return technicalValueDisplayLabels[value] ?? value;
}

export function sourceTypeDisplayLabel(value: string | null | undefined) {
  if (!value || value === "manual") return technicalValueDisplayLabels.manual;
  return technicalValueDisplayLabels[value] ?? value;
}

export function booleanDisplayLabel(value: boolean | null | undefined) {
  if (value === undefined || value === null) return commonUiCopy.unknown;
  return value ? technicalValueDisplayLabels.true : technicalValueDisplayLabels.false;
}

type UiLocale = "ar" | "en";

const apiEnglishMessages: Record<string, string> = {
  "يجب تسجيل الدخول للمتابعة.": "Authentication required.",
  [plan35ApiErrorCopy.APPOINTMENT_CONFLICT.message]: plan35ApiErrorSourceMessages.APPOINTMENT_CONFLICT,
  [plan35ApiErrorCopy.CASE_REFERENCE_CONFLICT.message]: plan35ApiErrorSourceMessages.CASE_REFERENCE_CONFLICT,
  [plan35ApiErrorCopy.SETTING_READ_ONLY.message]: plan35ApiErrorSourceMessages.SETTING_READ_ONLY,
  "الطلب غير صحيح.": "Invalid request.",
  "البيانات المرسلة غير مكتملة أو غير صحيحة.": "Submitted data is incomplete or invalid.",
  "بيانات الطلب غير مكتملة أو غير صحيحة.": "Request data is incomplete or invalid.",
  "فلاتر الطلب غير صحيحة.": "Request filters are invalid.",
  "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.": "Too many requests. Try again later.",
  "حدث خطأ غير متوقع في الخادم. حاول مرة أخرى لاحقًا.": "An unexpected server error occurred. Try again later.",
  "تعذر حفظ طلب الاستشارة الآن. تأكد من تشغيل قاعدة البيانات وحاول مرة أخرى.": "The consultation request could not be saved right now. Try again later.",
  "يوجد طلب استشارة قريب بنفس رقم الهاتف ونفس المجال. انتظر مراجعة الفريق أو تواصل معنا.":
    "A recent consultation request already exists for the same phone number and area. Please wait for the team review or contact us."
};

export function localizeApiMessage(message: string, locale: UiLocale = "ar") {
  if (locale === "en") {
    return apiEnglishMessages[message] ?? message;
  }

  if (apiExactMessages[message]) {
    return apiExactMessages[message];
  }

  const payloadMatch = message.match(/^(.+) payload is invalid\.$/);
  if (payloadMatch) {
    const subject = apiSubjectLabels[payloadMatch[1]] ?? "البيانات";
    return `${subject} غير مكتملة أو غير صحيحة.`;
  }

  const queryMatch = message.match(/^(.+) query is invalid\.$/);
  if (queryMatch) {
    const subject = apiSubjectLabels[queryMatch[1]] ?? "الفلاتر";
    return `${subject} غير صحيحة.`;
  }

  const invalidMatch = message.match(/^(.+) is invalid\.$/);
  if (invalidMatch) {
    const subject = apiSubjectLabels[invalidMatch[1]] ?? "القيمة";
    return `${subject} غير صحيح.`;
  }

  const requiredMatch = message.match(/^(.+) is required\.$/);
  if (requiredMatch) {
    const subject = apiSubjectLabels[requiredMatch[1]] ?? "هذا الحقل";
    return `${subject} مطلوب.`;
  }

  const notFoundMatch = message.match(/^(.+) was not found\.$/);
  if (notFoundMatch) {
    const subject = apiSubjectLabels[notFoundMatch[1]] ?? "العنصر المطلوب";
    return `لم يتم العثور على ${subject}.`;
  }

  const permissionMatch = message.match(/^(.+) permission is required\.$/);
  if (permissionMatch) {
    return "لا تملك الصلاحية المطلوبة لتنفيذ هذا الإجراء.";
  }

  if (message.includes("disabled for this release")) {
    return "هذه الميزة غير متاحة في النسخة الحالية.";
  }

  return message;
}
