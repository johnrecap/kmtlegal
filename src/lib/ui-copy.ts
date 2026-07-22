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

export const plan35DashboardSectionCopy = {
  "tasks.overdue": { title: "مهام متأخرة تحتاج إجراء", empty: "لا توجد مهام متأخرة ضمن نطاقك." },
  "appointments.today": { title: "مواعيد اليوم", empty: "لا توجد مواعيد نشطة اليوم ضمن نطاقك." },
  "consultations.unreviewed": { title: "استشارات تنتظر المراجعة", empty: "لا توجد استشارات مجدولة تنتظر المراجعة." },
  "contacts.new": { title: "رسائل تواصل جديدة", empty: "لا توجد رسائل تواصل جديدة." },
  "documents.under-review": { title: "مستندات تحت المراجعة", empty: "لا توجد مستندات تنتظر المراجعة." }
} as const;

export const plan35DashboardUiCopy = {
  eyebrow: "لوحة المكتب",
  shellTitle: "نظرة تشغيلية",
  metadataTitle: "مركز قيادة المكتب | KMT Legal",
  metadataDescription: "أعمال ومؤشرات تشغيلية مرتبة حسب صلاحيات فريق KMT Legal.",
  title: "مركز قيادة المكتب",
  description: "ابدأ بالأعمال الأكثر إلحاحًا ضمن صلاحياتك، ثم انتقل مباشرة إلى القائمة المطابقة.",
  quickActionsTitle: "إجراءات سريعة",
  clientSearchLabel: "البحث السريع في العملاء",
  clientSearchPlaceholder: "ابحث بالاسم أو الهاتف أو البريد",
  search: "بحث",
  priorityTitle: "العمل المطلوب الآن",
  priorityDescription: "قوائم محدودة ومرتبة حسب الأولوية والوقت.",
  metricsTitle: "مؤشرات التشغيل",
  metricsDescription: "كل مؤشر يوضح المدة والنطاق ويفتح القائمة المطابقة.",
  recentActivityTitle: "النشاط الأخير",
  openDestination: "فتح القائمة المطابقة",
  retrySection: "إعادة محاولة تحميل هذا القسم",
  metricUnavailable: "تعذر حساب هذا المؤشر الآن. افتح القائمة المطابقة أو أعد تحميل الصفحة.",
  sectionUnavailable: "تعذر تحميل هذا القسم وحده. بقية مركز القيادة ما زال متاحًا.",
  generatedAt: "آخر تحديث",
  timeframe: "الفترة",
  scope: "النطاق",
  consultationReviewBadge: "تنتظر المراجعة",
  consultationActivityBadge: "طلب استشارة",
  noOperationalQueues: "لا توجد قوائم تشغيل مسموحة لهذا الدور حاليًا. استخدم الإجراء المتاح للمتابعة."
} as const;

export const plan35StorageDiagnosticUiCopy = {
  title: "جاهزية التخزين الفعلية",
  description: "قراءة لحظية من بيئة الخادم. لا تُعرض المسارات أو الأسرار ولا يمكن تغييرها من لوحة التحكم.",
  source: "المصدر",
  sourceEnvironment: "بيئة الخادم",
  status: "الحالة",
  driver: "نوع التخزين",
  maxUpload: "أقصى حجم للملف",
  allowedTypes: "أنواع الملفات المسموحة",
  uploadsPathConfigured: "تهيئة مسار الرفع الخاص",
  rootStatus: "صلاحية مجلد التخزين",
  scannerMode: "سياسة فحص البرمجيات الخبيثة",
  scannerStatus: "اتصال خدمة الفحص",
  checkedAt: "وقت الفحص",
  readOnly: "تشخيص للقراءة فقط",
  configured: "جاهز",
  degraded: "جاهزية محدودة",
  unavailable: "غير جاهز",
  yes: "مهيأ",
  no: "غير مهيأ",
  rootStatuses: {
    "valid-writable": "صالح وقابل للكتابة",
    invalid: "غير صالح",
    unwritable: "غير قابل للكتابة"
  },
  scannerModes: {
    required: "الفحص مطلوب",
    "optional-disabled": "الفحص معطل في بيئة غير إنتاجية"
  },
  scannerStatuses: {
    reachable: "متصل",
    disabled: "معطل",
    unreachable: "غير متصل"
  },
  remediation: {
    configured: "لا يلزم إجراء حاليًا. راقب الجاهزية بعد أي تحديث للخادم.",
    degraded: "الفحص معطل لأن البيئة غير إنتاجية. فعّله قبل اعتماد بيئة الإنتاج.",
    unavailable: "راجع إعدادات الخادم وصلاحيات مجلد التخزين واتصال خدمة الفحص، ثم أعد تحميل الصفحة."
  }
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

export const plan35ContactInboxUiCopy = {
  eyebrow: "لوحة المكتب",
  title: "رسائل التواصل",
  description: "مراجعة الرسائل الواردة من نموذج التواصل وتصنيفها دون إنشاء عميل أو قضية تلقائيًا.",
  filtersLabel: "فلاتر رسائل التواصل",
  searchLabel: "البحث في رسائل التواصل",
  searchPlaceholder: "ابحث بالاسم أو البريد أو الهاتف أو محتوى الرسالة",
  status: "الحالة",
  topic: "الموضوع",
  sort: "الترتيب",
  direction: "الاتجاه",
  allStatuses: "كل الحالات",
  allTopics: "كل الموضوعات",
  apply: "تطبيق",
  clearFilters: "مسح الفلاتر",
  tableCaption: "رسائل التواصل الواردة",
  sender: "المرسل",
  message: "الرسالة",
  reviewer: "المراجع",
  receivedAt: "وقت الاستلام",
  actions: "الإجراءات",
  openDetails: "عرض التفاصيل",
  markReviewed: "تحديد كمراجعة",
  archive: "أرشفة",
  updating: "جارٍ تحديث حالة الرسالة",
  updateSucceeded: "تم تحديث حالة الرسالة.",
  updateFailed: "تعذر تحديث حالة الرسالة. حاول مرة أخرى.",
  empty: "لا توجد رسائل مطابقة للفلاتر الحالية.",
  totalSuffix: "رسالة",
  page: "صفحة",
  of: "من",
  previous: "السابق",
  next: "التالي",
  readerOnly: "يمكنك قراءة الرسائل، لكن تغيير حالتها يحتاج صلاحية إدارة رسائل التواصل.",
  statuses: {
    NEW: "جديدة",
    REVIEWED: "تمت المراجعة",
    ARCHIVED: "مؤرشفة"
  },
  topics: {
    consultation: "استشارة قانونية",
    documents: "مستندات",
    media: "إعلام وتعاون",
    other: "أخرى"
  },
  sortOptions: {
    createdAt: "تاريخ الاستلام",
    status: "الحالة",
    topic: "الموضوع"
  },
  directions: {
    desc: "الأحدث أولًا",
    asc: "الأقدم أولًا"
  }
} as const;

export const plan35NotificationUiCopy = {
  eyebrow: "لوحة المكتب",
  title: "مركز الإشعارات",
  description: "الإشعارات الخاصة بحسابك وطلبات الاستشارة التي تقع ضمن نطاق مراجعتك.",
  bellLabel: "فتح الإشعارات",
  popoverTitle: "الإشعارات والعمل المطلوب",
  noAttention: "لا توجد عناصر جديدة تحتاج انتباهك.",
  attentionSummary: "عناصر تحتاج انتباهك",
  reviewRequestTitle: "طلب استشارة جديد يحتاج مراجعة",
  markRead: "تحديد كمقروء",
  markedRead: "تم تحديد الإشعار كمقروء.",
  markReadFailed: "تعذر تحديث الإشعار. حاول مرة أخرى.",
  openCenter: "فتح مركز الإشعارات",
  loadMore: "تحميل المزيد",
  loadingMore: "جارٍ تحميل المزيد",
  loadPreviewFailed: "تعذر تحميل الإشعارات الآن.",
  loadMoreFailed: "تعذر تحميل المزيد من الإشعارات.",
  retry: "إعادة المحاولة",
  exhausted: "تم عرض كل الإشعارات المتاحة.",
  empty: "لا توجد إشعارات متاحة حاليًا.",
  unreadGeneric: "إشعارات غير مقروءة",
  consultationReview: "استشارات تنتظر المراجعة"
} as const;

export const plan35ManualCaseUiCopy = {
  eyebrow: "إدارة القضايا",
  createTitle: "إنشاء قضية يدوية",
  createDescription: "افتح ملف قضية لعميل موجود دون إنشاء طلب استشارة صوري. تُسجل العملية كاملة في سجل التدقيق.",
  editTitle: "تعديل البيانات الأساسية",
  editDescription: "حدّث بيانات الملف الأساسية فقط. تغيير الحالة والجلسات يظل من إجراءاته المخصصة.",
  clientSection: "العميل والإسناد",
  caseSection: "بيانات القضية",
  partiesSection: "الأطراف الأولية",
  partiesDescription: "إضافة الأطراف اختيارية ويمكن استكمالها لاحقًا من ملف القضية.",
  clientSearch: "البحث عن العميل",
  clientSearchPlaceholder: "اكتب اسم العميل أو رقم الهاتف",
  client: "العميل",
  chooseClient: "اختر عميلًا نشطًا",
  assignedLawyer: "المحامي المسؤول",
  chooseLawyer: "اختر محاميًا نشطًا",
  title: "عنوان القضية",
  caseType: "نوع القضية",
  courtName: "المحكمة",
  externalCaseNumber: "رقم القضية الخارجي",
  priority: "الأولوية",
  summary: "ملخص القضية",
  summaryHint: "هذا المحتوى قانوني خاص ولا يظهر في بيانات التدقيق.",
  partyName: "اسم الطرف",
  partyType: "صفة الطرف",
  partyNotes: "ملاحظات الطرف",
  addParty: "إضافة طرف",
  removeParty: "حذف الطرف",
  create: "إنشاء القضية",
  createForClient: "إنشاء قضية لهذا العميل",
  editAction: "تعديل بيانات القضية",
  save: "حفظ التعديلات",
  cancel: "إلغاء والعودة للقضايا",
  noClients: "لا يوجد عميل نشط متاح لإنشاء قضية.",
  noLawyers: "لا يوجد محامٍ نشط مؤهل للإسناد.",
  assignedOnly: "يمكنك تعديل البيانات الأساسية للقضية، لكن نقل الإسناد يحتاج صلاحية التحديث على مستوى المكتب.",
  validation: {
    required: "أكمل الحقول المطلوبة قبل المتابعة.",
    clientRequired: "اختر عميلًا نشطًا.",
    lawyerRequired: "اختر محاميًا مسؤولًا.",
    partyNameRequired: "أدخل اسم الطرف أو احذف صف الطرف الفارغ.",
    invalid: "راجع البيانات المدخلة ثم أعد المحاولة."
  },
  feedback: {
    creating: "جارٍ إنشاء القضية وحفظ سجل التدقيق.",
    created: "تم إنشاء القضية بنجاح.",
    replayed: "تم العثور على نفس الطلب السابق دون إنشاء قضية مكررة.",
    updating: "جارٍ حفظ التعديلات.",
    updated: "تم حفظ التعديلات الأساسية.",
    failed: "تعذر تنفيذ الإجراء الآن. احتفظنا بالقيم المدخلة.",
    network: "تعذر الوصول إلى الخادم. احتفظنا بالقيم المدخلة؛ حاول مرة أخرى.",
    stale: "تغيرت القضية بعد فتح النموذج. حدّث الصفحة ثم راجع التعديلات قبل الحفظ."
  },
  collisionTitle: "تعذر حجز رقم ملف فريد",
  retryWithNewRequest: plan35AdminRecoveryCopy.caseReferenceRetry
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

export const permissionGroupDisplayLabels = {
  governance: "الحوكمة وإدارة الوصول",
  appointments: "المواعيد والاستشارات",
  cases: "القضايا والمهام",
  clients: "العملاء والمحامون",
  communications: "التواصل والإشعارات",
  documents: "المستندات",
  finance: "المالية والتقارير",
  content: "المحتوى والخدمات"
} as const;

export type PermissionGroupKey = keyof typeof permissionGroupDisplayLabels;

export const permissionDisplayLabels: Record<string, string> = {
  "audit.read.any": "عرض سجل التدقيق للمكتب",
  "appointment.create.self": "إنشاء موعد شخصي",
  "appointment.manage.any": "إدارة كل المواعيد",
  "appointment.read.assigned": "عرض المواعيد المسندة",
  "appointment.read.own": "عرض المواعيد الشخصية",
  "case.create.any": "إنشاء قضية",
  "case.read.any": "عرض كل القضايا",
  "case.read.assigned": "عرض القضايا المسندة",
  "case.read.own": "عرض القضايا الخاصة بالحساب",
  "case.update.any": "تعديل كل القضايا",
  "case.update.assigned": "تعديل القضايا المسندة",
  "caseStudy.approve.any": "اعتماد دراسات الحالة",
  "caseStudy.create.any": "إنشاء دراسات الحالة",
  "caseStudy.read.public": "عرض دراسات الحالة المنشورة",
  "client.account.manage": "إدارة حسابات بوابة العملاء",
  "client.read.any": "عرض كل العملاء",
  "client.read.assigned": "عرض العملاء المسندين",
  "client.read.self": "عرض ملف العميل الشخصي",
  "client.update.any": "تعديل كل العملاء",
  "contact.manage.any": "إدارة رسائل التواصل",
  "contact.read.any": "عرض رسائل التواصل",
  "conversation.assign.any": "إسناد محادثات العملاء",
  "conversation.create.own": "بدء محادثة شخصية",
  "conversation.manage.any": "إدارة كل المحادثات",
  "conversation.read.any": "عرض كل المحادثات",
  "conversation.read.own": "عرض المحادثات الشخصية",
  "conversation.reply.any": "الرد على كل المحادثات",
  "conversation.reply.own": "الرد على المحادثات الشخصية",
  "consultation.create.public": "إرسال طلب استشارة عام",
  "consultation.review.any": "مراجعة كل الاستشارات",
  "consultation.review.assigned": "مراجعة الاستشارات المسندة",
  "content.approve.any": "اعتماد المحتوى",
  "content.create.any": "إنشاء المحتوى",
  "content.read.public": "عرض المحتوى المنشور",
  "document.manage.any": "إدارة كل المستندات",
  "document.read.assigned": "عرض المستندات المسندة",
  "document.read.own": "عرض المستندات الشخصية",
  "document.upload.self": "رفع مستند شخصي",
  "email.read.audit": "عرض سجل تسليم البريد",
  "finance.manage.any": "إدارة العمليات المالية",
  "finance.read.any": "عرض العمليات المالية",
  "lawyer.manage.any": "إدارة ملفات المحامين",
  "lawyer.read.public": "عرض ملفات المحامين المنشورة",
  "note.create.assigned": "إضافة ملاحظات للقضايا المسندة",
  "note.read.any": "عرض كل الملاحظات",
  "note.read.assigned": "عرض ملاحظات القضايا المسندة",
  "notification.read.self": "عرض الإشعارات الشخصية",
  "payment.read.own": "عرض المدفوعات الشخصية",
  "permission.manage.any": "إدارة تعيينات الصلاحيات",
  "report.read.any": "عرض تقارير المكتب",
  "role.manage.any": "إدارة أدوار النظام",
  "service.manage.any": "إدارة الخدمات القانونية",
  "service.read.public": "عرض الخدمات المنشورة",
  "session.manage.any": "إدارة كل جلسات الدخول",
  "session.manage.assigned": "إدارة الجلسات المسندة",
  "settings.manage.any": "إدارة إعدادات النظام",
  "socialDraft.approve.any": "اعتماد مسودات التواصل الاجتماعي",
  "socialDraft.create.any": "إنشاء مسودات التواصل الاجتماعي",
  "task.manage.any": "إدارة كل المهام",
  "task.manage.assigned": "إدارة المهام المسندة",
  "task.read.assigned": "عرض المهام المسندة",
  "twoFactor.manage.self": "إدارة التحقق الثنائي الشخصي",
  "twoFactor.reset.staff": "إعادة ضبط تحقق الموظفين",
  "user.manage.any": "إدارة مستخدمي النظام",
  "user.read.self": "عرض الحساب الشخصي"
};

export const plan35RoleGovernanceUiCopy = {
  eyebrow: "حوكمة الإدارة",
  title: "الأدوار والصلاحيات",
  description: "مراجعة الصلاحيات الفعلية للأدوار التشغيلية واستبدالها كوحدة واحدة.",
  metadataDescription: "إدارة صلاحيات الأدوار التشغيلية داخل منصة KMT Legal.",
  roleList: "أدوار النظام",
  permissionMatrix: "صلاحيات الدور المحدد",
  protectedRole: "دور محمي ولا يقبل التعديل.",
  inactiveRole: "الدور غير نشط ويظهر للقراءة فقط.",
  effectiveWildcard: "مدير النظام يملك كل الصلاحيات تلقائيًا ولا تُعدّل صفوفه.",
  usersSuffix: "مستخدم",
  save: "حفظ صلاحيات الدور",
  saving: "جارٍ حفظ الصلاحيات",
  reload: "تحميل النسخة الحالية",
  noEditableRole: "لا يوجد دور تشغيلي نشط قابل للتعديل.",
  dirty: "توجد تعديلات غير محفوظة لهذا الدور.",
  clean: "لا توجد تعديلات غير محفوظة.",
  status: {
    active: "نشط",
    inactive: "غير نشط",
    readOnly: "للقراءة فقط"
  },
  feedback: {
    successTitle: "تم الحفظ",
    incompleteTitle: "لم يكتمل الحفظ",
    saved: "تم حفظ صلاحيات الدور وتسجيل العملية في سجل التدقيق.",
    stale: "تغيرت صلاحيات هذا الدور بعد فتح الصفحة. احتفظنا باختياراتك؛ حمّل النسخة الحالية ثم راجعها قبل الحفظ.",
    failed: "تعذر حفظ صلاحيات الدور الآن. راجع الاختيارات وحاول مرة أخرى.",
    unavailable: "لا يمكن الوصول إلى الخادم الآن. لم تُفقد اختياراتك."
  }
} as const;

export const plan35UserGovernanceUiCopy = {
  systemAction: "إجراء نظامي",
  saveSucceeded: "تم حفظ بيانات المستخدم وإنهاء جلساته السابقة إذا تغير الوصول."
} as const;

export function permissionGroupForKey(permissionKey: string): PermissionGroupKey {
  const prefix = permissionKey.split(".", 1)[0];
  if (["appointment", "consultation"].includes(prefix)) return "appointments";
  if (["case", "note", "task"].includes(prefix)) return "cases";
  if (["client", "lawyer"].includes(prefix)) return "clients";
  if (["contact", "conversation", "email", "notification"].includes(prefix)) return "communications";
  if (prefix === "document") return "documents";
  if (["finance", "payment", "report"].includes(prefix)) return "finance";
  if (["caseStudy", "content", "service", "socialDraft"].includes(prefix)) return "content";
  return "governance";
}

export function permissionGroupDisplayLabel(groupKey: string) {
  return permissionGroupDisplayLabels[groupKey as PermissionGroupKey] ?? permissionGroupDisplayLabels.governance;
}

export function permissionDisplayLabel(permissionKey: string) {
  return permissionDisplayLabels[permissionKey] ?? "صلاحية تشغيلية";
}

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
  "An active existing client is required.": plan35ManualCaseUiCopy.validation.clientRequired,
  "An active eligible lawyer is required.": plan35ManualCaseUiCopy.validation.lawyerRequired,
  "The request token is already bound to another case request.": "رمز المحاولة مستخدم بالفعل مع طلب قضية مختلف. ابدأ محاولة جديدة بعد مراجعة البيانات.",
  "Case was not found in the current access scope.": "لم يتم العثور على القضية داخل نطاق صلاحيات حسابك.",
  "Case reassignment requires office-wide update permission.": plan35ManualCaseUiCopy.assignedOnly,
  "Case data changed after this form was loaded.": plan35ManualCaseUiCopy.feedback.stale,
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
  "Exact Super Admin role and both role and permission management permissions are required.": "إدارة صلاحيات الأدوار تتطلب حساب مدير نظام فعليًا مع صلاحيتي إدارة الأدوار والصلاحيات.",
  "An active exact Super Admin account is required.": "يلزم حساب مدير نظام نشط لإدارة الأدوار والصلاحيات.",
  "No active Super Admin governance path remains.": "لا يوجد مسار حوكمة نشط لمدير النظام. لم يتم حفظ التغيير.",
  "Protected roles cannot be changed.": "هذا الدور محمي ولا يمكن تعديل صلاحياته.",
  "Only canonical operational roles can be changed.": "يمكن تعديل الأدوار التشغيلية المعتمدة فقط.",
  "Inactive roles are read-only.": "الدور غير النشط متاح للقراءة فقط.",
  "Permission keys must be canonical.": "تتضمن البيانات صلاحية غير معتمدة في النظام.",
  "Role permissions changed after this form was loaded.": plan35RoleGovernanceUiCopy.feedback.stale,
  "Role permissions changed concurrently. Reload and try again.": plan35RoleGovernanceUiCopy.feedback.stale,
  "An active user manager account is required.": "يلزم حساب نشط يملك صلاحية إدارة المستخدمين.",
  "Only Super Admin can assign a protected role.": "تعيين الأدوار المحمية متاح لمدير النظام فقط.",
  "The selected role exceeds your permission ceiling.": "الدور المحدد يتجاوز نطاق الصلاحيات المسموح لك بإدارته.",
  "The final active Super Admin account cannot be changed.": "لا يمكن تعطيل أو خفض صلاحيات آخر حساب مدير نظام نشط.",
  "User data changed after this form was loaded.": "تغيرت بيانات المستخدم بعد فتح الصفحة. حدّث الصفحة ثم راجع التغيير.",
  "User access changed concurrently. Reload and try again.": "تغير وصول المستخدم بالتزامن مع طلبك. حدّث الصفحة ثم حاول مرة أخرى.",
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
  "Case core update": "تعديل بيانات القضية",
  "Case id": "معرّف القضية",
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
  "Manual case": "بيانات القضية اليدوية",
  "Password": "كلمة المرور",
  "Payment": "الفاتورة",
  "Payment list query": "فلاتر الفواتير",
  "Profile": "الملف الشخصي",
  "Reject": "بيانات الرفض",
  "Report": "التقرير",
  "Role": "الدور",
  "Role permission": "صلاحيات الدور",
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
