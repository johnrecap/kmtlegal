export const clientLocales = ["ar", "en"] as const;
export type ClientLocale = (typeof clientLocales)[number];

export function normalizeClientLocale(value: unknown): ClientLocale {
  return value === "en" ? "en" : "ar";
}

const ar = {
  metadata: {
    homeTitle: "بوابة العميل | KMT Legal",
    homeDescription: "مساحة محمية لملفات ومواعيد ومدفوعات عملاء KMT Legal.",
    casesTitle: "قضاياي | KMT Legal",
    caseDetailTitle: "تفاصيل القضية | KMT Legal",
    appointmentsTitle: "مواعيدي | KMT Legal",
    filesTitle: "ملفاتي | KMT Legal",
    paymentsTitle: "مدفوعاتي | KMT Legal",
    profileTitle: "الملف الشخصي | KMT Legal",
    assistantTitle: "مساعد العميل | KMT Legal"
  },
  nav: {
    home: "الرئيسية",
    cases: "القضايا",
    appointments: "المواعيد",
    files: "الملفات",
    payments: "المدفوعات",
    assistant: "المساعد",
    profile: "الملف الشخصي"
  },
  shell: {
    portal: "بوابة العميل",
    navigation: "تنقل بوابة العميل",
    backToSite: "الرجوع للموقع",
    logout: "تسجيل الخروج",
    logoutShort: "خروج",
    description: "مساحة آمنة لمتابعة ملفاتك ومواعيدك ومدفوعاتك مع مكتب KMT Legal.",
    footerTitle: "KMT Legal - بوابة العميل المحمية",
    footerPrivacy: "البيانات الظاهرة هنا خاصة بحسابك فقط.",
    language: "اللغة",
    switchTo: "English",
    themeToggle: "تبديل بين الوضع الليلي والنهاري",
    switchingLanguage: "جارٍ تغيير اللغة",
    languageFailed: "تعذر حفظ اللغة الآن. حاول مرة أخرى.",
    readinessTitle: "النظام لم يكتمل تشغيله بعد",
    readinessDescription: "تم إيقاف بوابة العميل مؤقتًا لأن فحوصات التشغيل الأساسية لم تكتمل.",
    readinessUnknown: "فحوصات الجاهزية لم ترجع سببًا محددًا. راجع فريق الدعم."
  },
  common: {
    unknown: "غير محدد",
    unassigned: "غير معين",
    noCase: "بدون قضية",
    consultation: "استشارة",
    open: "فتح",
    back: "رجوع",
    download: "تنزيل",
    viewInvoice: "عرض الفاتورة",
    unavailable: "غير متاحة",
    openCase: "فتح القضية",
    issueDate: "تاريخ الإصدار",
    dueDate: "الاستحقاق",
    nextSession: "الجلسة التالية",
    sessionDecision: "قرار الجلسة",
    courtUnknown: "محكمة غير محددة",
    pendingOfficeReview: "قيد مراجعة المكتب",
    pendingAssignment: "قيد التعيين",
    case: "القضية",
    status: "الحالة",
    priority: "الأولوية",
    lawyer: "المحامي",
    nextDate: "الموعد التالي",
    date: "التاريخ",
    time: "الوقت",
    mode: "الطريقة",
    category: "التصنيف",
    amount: "المبلغ",
    invoice: "الفاتورة",
    issued: "الإصدار",
    receipt: "إيصال",
    notSet: "غير محدد"
  },
  dashboard: {
    welcome: "مرحبًا {name}",
    cases: "القضايا",
    casesMeta: "آخر ملفاتك النشطة.",
    upcoming: "المواعيد القادمة",
    upcomingMeta: "قضايا واستشارات مجدولة.",
    files: "الملفات",
    filesMeta: "مستندات مرئية لك.",
    dues: "المستحقات",
    duesMeta: "غير مدفوعة أو معلقة.",
    nextStep: "الخطوة التالية",
    dueTitle: "دفعة مستحقة",
    dueAction: "عرض المدفوعات",
    appointmentTitle: "موعد قريب",
    appointmentAction: "عرض المواعيد",
    documentsTitle: "مستنداتك غير مكتملة",
    documentsDescription: "ارفع المستندات التي طلبها المكتب أو أضف الملفات المهمة لبدء المراجعة.",
    documentsAction: "عرض الملفات",
    followTitle: "تابع مع الفريق",
    followDescription: "استخدم رسائل البوابة أو المساعد لمعرفة آخر خطوة في ملفك.",
    followAction: "فتح المساعد",
    allCases: "كل القضايا",
    noCases: "لا توجد قضايا بعد",
    noCasesDescription: "أي قضية مرتبطة بحسابك ستظهر هنا.",
    appointments: "المواعيد",
    allAppointments: "كل المواعيد",
    noAppointments: "لا توجد مواعيد قادمة",
    noAppointmentsDescription: "مواعيد القضايا والاستشارات ستظهر بعد تأكيدها.",
    payments: "المدفوعات والمستحقات",
    allPayments: "كل المدفوعات",
    noPayments: "لا توجد مدفوعات",
    noPaymentsDescription: "أي فاتورة أو إيصال يدوي من المكتب سيظهر هنا."
  },
  cases: {
    title: "قضاياي",
    empty: "لا توجد قضايا مرتبطة بحسابك حتى الآن.",
    detailsResponsibleLawyer: "المحامي المسؤول",
    professionalEmail: "البريد المهني",
    fileCreated: "تاريخ إنشاء الملف",
    sessions: "الجلسات",
    followUpSession: "جلسة متابعة",
    noSessions: "لا توجد جلسات مسجلة",
    noSessionsDescription: "تحديثات الجلسات ستظهر هنا عند إضافتها من المكتب.",
    appointments: "المواعيد",
    noAppointments: "لا توجد مواعيد",
    noAppointmentsDescription: "أي موعد مرتبط بالقضية سيظهر هنا.",
    visibleDocuments: "المستندات المرئية",
    noDocuments: "لا توجد مستندات مرئية",
    noDocumentsDescription: "المكتب يحدد المستندات التي تظهر لك داخل البوابة.",
    payments: "المدفوعات",
    noPayments: "لا توجد مدفوعات",
    noPaymentsDescription: "أي فاتورة مرتبطة بالقضية ستظهر هنا."
  },
  appointments: {
    title: "مواعيد القضايا والاستشارات",
    appointment: "الموعد",
    empty: "لا توجد مواعيد مرتبطة بحسابك حتى الآن."
  },
  files: {
    title: "ملفاتي",
    file: "الملف",
    uploadedAt: "تاريخ الرفع",
    visibleTitle: "المستندات المرئية",
    visibleDescription: "كل المستندات التي سمح المكتب بظهورها لك أو رفعتها من حسابك.",
    empty: "لا توجد مستندات مرئية لحسابك حتى الآن."
  },
  upload: {
    noCase: "بدون قضية محددة",
    failed: "تعذر رفع المستند.",
    succeeded: "تم رفع المستند بنجاح.",
    networkError: "لا يمكن الوصول إلى الخادم الآن.",
    title: "رفع مستند جديد",
    description: "الحد الأقصى 5MB. الأنواع المسموحة: PDF, DOC, DOCX, JPG, PNG.",
    caseLabel: "ربط المستند بقضية",
    categoryLabel: "تصنيف المستند",
    fileLabel: "الملف",
    submit: "رفع المستند"
  },
  payments: {
    title: "المدفوعات والمستحقات",
    records: "كل السجلات",
    openDues: "المستحقات المفتوحة",
    openDuesMeta: "ليست مدفوعة أو ملغاة.",
    dueTotal: "إجمالي المستحق",
    dueTotalMeta: "حسب الفواتير الظاهرة لك.",
    allRecordsMeta: "فواتير وإيصالات مرتبطة بحسابك.",
    empty: "لا توجد فواتير أو إيصالات مرتبطة بحسابك حتى الآن.",
    bookingAttempts: "محاولات دفع حجز الاستشارة",
    bookingAttemptsDescription: "يتم تأكيد الموعد فقط بعد إشعار دفع موثوق من بوابة الدفع.",
    continuePayment: "استكمال الدفع",
    followStatus: "متابعة الحالة",
    paymentInvoice: "فاتورة"
  },
  profile: {
    title: "الملف الشخصي",
    formTitle: "بيانات الملف الشخصي",
    formDescription: "هذه البيانات تستخدم للتواصل وتنظيم مواعيد القضية.",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    city: "المدينة",
    save: "حفظ البيانات",
    saveFailed: "تعذر حفظ البيانات.",
    saved: "تم حفظ بيانات الملف الشخصي.",
    networkError: "لا يمكن الوصول إلى الخادم الآن.",
    accountTitle: "بيانات الحساب",
    accountDescription: "البريد وكلمة المرور يتم تحديثهما من خلال المكتب.",
    loginEmail: "بريد تسجيل الدخول",
    responsibleLawyer: "المحامي المسؤول",
    fileCreated: "تاريخ إنشاء الملف"
  },
  assistant: {
    pageTitle: "المساعد",
    title: "المساعد التنظيمي",
    assistantName: "KMT Client Assistant",
    description: "اسأل عن البيانات التنظيمية الظاهرة في حسابك فقط: المواعيد، الجلسات، القضايا، المستندات، والمدفوعات.",
    status: "تنظيم فقط",
    scope: "بيانات حسابك فقط. بدون رأي قانوني.",
    placeholder: "مثال: موعد جلستي إمتى؟",
    inputLabel: "رسالتك",
    send: "إرسال",
    talkToTeam: "التحدث مع الفريق",
    typing: "المساعد يراجع بيانات حسابك",
    noData: "لا توجد بيانات ظاهرة لهذا السؤال الآن.",
    requestError: "تعذر تنفيذ الطلب الآن.",
    networkError: "لا يمكن الوصول إلى الخادم الآن.",
    intro: "أنا مساعد تنظيمي داخل بوابة العميل. أستطيع عرض المواعيد، جلسات القضايا، القضايا، المستندات المرئية، والمدفوعات الظاهرة في حسابك فقط. لا أقدم رأيًا قانونيًا.",
    quickActions: [
      { label: "مواعيدي القادمة", message: "ما هي مواعيدي القادمة؟", icon: "event" },
      { label: "جلسات القضايا", message: "ما هي جلسات القضايا الظاهرة لي؟", icon: "gavel" },
      { label: "قضاياي", message: "ما هي القضايا المفتوحة في حسابي؟", icon: "folder_open" },
      { label: "مستنداتي", message: "هل توجد مستندات جديدة أو مرئية لي؟", icon: "description" },
      { label: "مدفوعاتي", message: "ما هي المدفوعات الظاهرة في بوابتي؟", icon: "payments" }
    ],
    nextSession: "الجلسة القادمة",
    priority: "الأولوية",
    lawyer: "المحامي"
  },
  teamChat: {
    title: "التواصل مع الفريق",
    assistantName: "KMT Team Chat",
    description: "رسائل مباشرة بينك وبين السكرتيرة أو فريق المكتب. هذه المحادثة محفوظة لأنها تواصل بشري داخل البوابة.",
    status: "تواصل مباشر",
    scope: "الفريق يرد عليك داخل البوابة فقط.",
    placeholder: "اكتب رسالتك للفريق...",
    inputLabel: "رسالتك للفريق",
    send: "إرسال",
    start: "ابدأ محادثة مع الفريق",
    back: "رجوع للمساعد",
    loading: "جاري تحميل رسائل الفريق...",
    empty: "اكتب أول رسالة للفريق بخصوص الموعد أو المتابعة أو أي تنظيم مطلوب.",
    closed: "هذه المحادثة مغلقة. إرسال رسالة جديدة سيبدأ محادثة جديدة.",
    requestError: "تعذر تنفيذ الطلب الآن.",
    refreshError: "تعذر تحديث محادثة الفريق الآن.",
    networkError: "لا يمكن الوصول إلى الخادم الآن.",
    privacy: "لا تشارك مستندات حساسة هنا إلا إذا طلب الفريق ذلك من خلال قناة آمنة.",
    you: "أنت",
    team: "الفريق"
  },
  guard: {
    staffTitle: "غير مسموح بالدخول إلى بوابة العميل",
    staffDescription: "هذا المسار مخصص لحسابات العملاء فقط. فريق العمل يستخدم لوحة المكتب.",
    unlinkedTitle: "حساب العميل غير مكتمل",
    unlinkedDescription: "حساب الدخول غير مرتبط بملف عميل داخل المكتب. تواصل مع السكرتارية لتفعيل ربط الحساب بملفك قبل فتح البوابة."
  },
  errors: {
    fallback: "تعذر تنفيذ الطلب الآن. حاول مرة أخرى.",
    UNAUTHENTICATED: "انتهت جلسة الدخول. سجل الدخول مرة أخرى.",
    PERMISSION_DENIED: "لا تملك صلاحية تنفيذ هذا الإجراء.",
    NOT_FOUND: "لم يتم العثور على البيانات المطلوبة.",
    VALIDATION_ERROR: "راجع البيانات المدخلة ثم حاول مرة أخرى.",
    RATE_LIMITED: "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.",
    SERVER_ERROR: "حدث خطأ غير متوقع. حاول مرة أخرى لاحقًا."
  },
  statuses: {
    case: {
      NEW: "جديدة",
      UNDER_REVIEW: "قيد المراجعة",
      ACTIVE: "نشطة",
      AWAITING_JUDGMENT: "في انتظار الحكم",
      COMPLETED: "مكتملة",
      CLOSED: "مغلقة",
      ARCHIVED: "مؤرشفة"
    },
    priority: { LOW: "منخفضة", NORMAL: "عادية", HIGH: "مرتفعة", URGENT: "عاجلة" },
    appointment: {
      SCHEDULED: "مجدول",
      RESCHEDULED: "تمت إعادة الجدولة",
      COMPLETED: "مكتمل",
      CANCELLED: "ملغي",
      NO_SHOW: "لم يحضر"
    },
    appointmentType: {
      CONSULTATION: "استشارة",
      COURT_SESSION: "جلسة محكمة",
      INTERNAL_MEETING: "اجتماع داخلي",
      CALL: "مكالمة",
      ONLINE_MEETING: "اجتماع أونلاين",
      CASE_FOLLOW_UP: "متابعة قضية",
      INTERNAL: "داخلي"
    },
    mode: { PHONE: "هاتف", ONLINE: "أونلاين", OFFICE: "في المكتب", COURT: "محكمة" },
    documentCategory: {
      CONTRACT: "عقد",
      COURT_FILE: "ملف محكمة",
      IDENTITY: "هوية",
      EVIDENCE: "دليل",
      PAYMENT: "دفع",
      OTHER: "أخرى"
    },
    document: {
      NEW: "جديد",
      UNDER_REVIEW: "قيد المراجعة",
      NEEDS_CLARIFICATION: "يحتاج توضيح",
      ACCEPTED: "مقبول",
      REJECTED: "مرفوض",
      DELETED: "محذوف"
    },
    payment: {
      DRAFT: "مسودة",
      ISSUED: "صادرة",
      PENDING: "معلقة",
      PAID: "مدفوعة",
      OVERDUE: "متأخرة",
      CANCELLED: "ملغاة"
    },
    paymentAttempt: {
      CREATED: "تم الإنشاء",
      PENDING: "قيد الانتظار",
      PAID: "مدفوع",
      FAILED: "فشلت",
      EXPIRED: "انتهت",
      CANCELLED: "ملغاة",
      REFUNDED: "تم ردها",
      DISPUTED: "محل اعتراض"
    },
    conversation: {
      OPEN: "مفتوحة",
      WAITING_STAFF: "بانتظار الفريق",
      WAITING_CLIENT: "بانتظار العميل",
      CLOSED: "مغلقة",
      ARCHIVED: "مؤرشفة"
    }
  }
} as const;

type WidenStrings<T> =
  T extends string ? string
    : T extends readonly (infer Item)[] ? readonly WidenStrings<Item>[]
      : T extends object ? { [Key in keyof T]: WidenStrings<T[Key]> }
        : T;

const en = {
  metadata: {
    homeTitle: "Client Portal | KMT Legal",
    homeDescription: "A secure space for KMT Legal clients to follow cases, appointments, files, and payments.",
    casesTitle: "My Cases | KMT Legal",
    caseDetailTitle: "Case Details | KMT Legal",
    appointmentsTitle: "My Appointments | KMT Legal",
    filesTitle: "My Files | KMT Legal",
    paymentsTitle: "My Payments | KMT Legal",
    profileTitle: "Profile | KMT Legal",
    assistantTitle: "Client Assistant | KMT Legal"
  },
  nav: {
    home: "Home",
    cases: "Cases",
    appointments: "Appointments",
    files: "Files",
    payments: "Payments",
    assistant: "Assistant",
    profile: "Profile"
  },
  shell: {
    portal: "Client Portal",
    navigation: "Client portal navigation",
    backToSite: "Back to website",
    logout: "Sign out",
    logoutShort: "Sign out",
    description: "A secure space to follow your files, appointments, and payments with KMT Legal.",
    footerTitle: "KMT Legal — protected client portal",
    footerPrivacy: "The information shown here belongs to your account only.",
    language: "Language",
    switchTo: "العربية",
    themeToggle: "Toggle dark and light theme",
    switchingLanguage: "Changing language",
    languageFailed: "We could not save the language. Please try again.",
    readinessTitle: "The system is not ready yet",
    readinessDescription: "The client portal is temporarily unavailable because essential readiness checks did not complete.",
    readinessUnknown: "No specific readiness reason was returned. Contact the support team."
  },
  common: {
    unknown: "Not specified",
    unassigned: "Not assigned",
    noCase: "No case",
    consultation: "Consultation",
    open: "Open",
    back: "Back",
    download: "Download",
    viewInvoice: "View invoice",
    unavailable: "Unavailable",
    openCase: "Open case",
    issueDate: "Issue date",
    dueDate: "Due date",
    nextSession: "Next session",
    sessionDecision: "Session decision",
    courtUnknown: "Court not specified",
    pendingOfficeReview: "Under office review",
    pendingAssignment: "Assignment pending",
    case: "Case",
    status: "Status",
    priority: "Priority",
    lawyer: "Lawyer",
    nextDate: "Next date",
    date: "Date",
    time: "Time",
    mode: "Mode",
    category: "Category",
    amount: "Amount",
    invoice: "Invoice",
    issued: "Issued",
    receipt: "Receipt",
    notSet: "Not specified"
  },
  dashboard: {
    welcome: "Welcome, {name}",
    cases: "Cases",
    casesMeta: "Your latest active files.",
    upcoming: "Upcoming appointments",
    upcomingMeta: "Scheduled cases and consultations.",
    files: "Files",
    filesMeta: "Documents visible to you.",
    dues: "Amount due",
    duesMeta: "Unpaid or pending.",
    nextStep: "Next step",
    dueTitle: "Payment due",
    dueAction: "View payments",
    appointmentTitle: "Upcoming appointment",
    appointmentAction: "View appointments",
    documentsTitle: "Your documents are incomplete",
    documentsDescription: "Upload the documents requested by the office or add important files for review.",
    documentsAction: "View files",
    followTitle: "Follow up with the team",
    followDescription: "Use portal messages or the assistant to see the next step for your file.",
    followAction: "Open assistant",
    allCases: "All cases",
    noCases: "No cases yet",
    noCasesDescription: "Cases linked to your account will appear here.",
    appointments: "Appointments",
    allAppointments: "All appointments",
    noAppointments: "No upcoming appointments",
    noAppointmentsDescription: "Case and consultation appointments will appear after confirmation.",
    payments: "Payments and dues",
    allPayments: "All payments",
    noPayments: "No payments",
    noPaymentsDescription: "Invoices and manual receipts from the office will appear here."
  },
  cases: {
    title: "My cases",
    empty: "No cases are linked to your account yet.",
    detailsResponsibleLawyer: "Responsible lawyer",
    professionalEmail: "Professional email",
    fileCreated: "File created",
    sessions: "Sessions",
    followUpSession: "Follow-up session",
    noSessions: "No recorded sessions",
    noSessionsDescription: "Session updates will appear after the office adds them.",
    appointments: "Appointments",
    noAppointments: "No appointments",
    noAppointmentsDescription: "Appointments linked to the case will appear here.",
    visibleDocuments: "Visible documents",
    noDocuments: "No visible documents",
    noDocumentsDescription: "The office controls which documents are visible in the portal.",
    payments: "Payments",
    noPayments: "No payments",
    noPaymentsDescription: "Invoices linked to the case will appear here."
  },
  appointments: {
    title: "Case and consultation appointments",
    appointment: "Appointment",
    empty: "No appointments are linked to your account yet."
  },
  files: {
    title: "My files",
    file: "File",
    uploadedAt: "Uploaded",
    visibleTitle: "Visible documents",
    visibleDescription: "Documents shared by the office or uploaded from your account.",
    empty: "No documents are visible to your account yet."
  },
  upload: {
    noCase: "No specific case",
    failed: "The document could not be uploaded.",
    succeeded: "Document uploaded successfully.",
    networkError: "The server cannot be reached right now.",
    title: "Upload a new document",
    description: "Maximum 5 MB. Allowed types: PDF, DOC, DOCX, JPG, PNG.",
    caseLabel: "Link document to a case",
    categoryLabel: "Document category",
    fileLabel: "File",
    submit: "Upload document"
  },
  payments: {
    title: "Payments and dues",
    records: "All records",
    openDues: "Open dues",
    openDuesMeta: "Not paid or cancelled.",
    dueTotal: "Total due",
    dueTotalMeta: "Based on invoices visible to you.",
    allRecordsMeta: "Invoices and receipts linked to your account.",
    empty: "No invoices or receipts are linked to your account yet.",
    bookingAttempts: "Consultation booking payment attempts",
    bookingAttemptsDescription: "The appointment is confirmed only after a verified payment notice from the payment provider.",
    continuePayment: "Continue payment",
    followStatus: "Check status",
    paymentInvoice: "Invoice"
  },
  profile: {
    title: "Profile",
    formTitle: "Profile details",
    formDescription: "These details are used for contact and case appointment organization.",
    fullName: "Full name",
    phone: "Phone number",
    email: "Email",
    city: "City",
    save: "Save details",
    saveFailed: "The details could not be saved.",
    saved: "Profile details saved.",
    networkError: "The server cannot be reached right now.",
    accountTitle: "Account details",
    accountDescription: "Email and password are updated through the office.",
    loginEmail: "Sign-in email",
    responsibleLawyer: "Responsible lawyer",
    fileCreated: "File created"
  },
  assistant: {
    pageTitle: "Assistant",
    title: "Administrative assistant",
    assistantName: "KMT Client Assistant",
    description: "Ask only about administrative information shown in your account: appointments, sessions, cases, documents, and payments.",
    status: "Administrative only",
    scope: "Your account data only. No legal opinions.",
    placeholder: "Example: When is my next session?",
    inputLabel: "Your message",
    send: "Send",
    talkToTeam: "Talk to the team",
    typing: "The assistant is checking your account",
    noData: "No visible data is available for this question.",
    requestError: "The request could not be completed.",
    networkError: "The server cannot be reached right now.",
    intro: "I am an administrative assistant in the client portal. I can show appointments, case sessions, cases, visible documents, and payments in your account only. I do not provide legal opinions.",
    quickActions: [
      { label: "Upcoming appointments", message: "What are my upcoming appointments?", icon: "event" },
      { label: "Case sessions", message: "Which case sessions are visible to me?", icon: "gavel" },
      { label: "My cases", message: "Which cases are open in my account?", icon: "folder_open" },
      { label: "My documents", message: "Are there new documents visible to me?", icon: "description" },
      { label: "My payments", message: "Which payments are shown in my portal?", icon: "payments" }
    ],
    nextSession: "Next session",
    priority: "Priority",
    lawyer: "Lawyer"
  },
  teamChat: {
    title: "Contact the team",
    assistantName: "KMT Team Chat",
    description: "Direct messages between you and the secretary or office team. This conversation is retained as human communication inside the portal.",
    status: "Direct contact",
    scope: "The team replies inside the portal only.",
    placeholder: "Write a message to the team...",
    inputLabel: "Your message to the team",
    send: "Send",
    start: "Start a conversation with the team",
    back: "Back to assistant",
    loading: "Loading team messages...",
    empty: "Send the first message about an appointment, follow-up, or administrative request.",
    closed: "This conversation is closed. Sending a new message starts a new conversation.",
    requestError: "The request could not be completed.",
    refreshError: "The team conversation could not be refreshed.",
    networkError: "The server cannot be reached right now.",
    privacy: "Do not share sensitive documents here unless the team requests them through a secure channel.",
    you: "You",
    team: "Team"
  },
  guard: {
    staffTitle: "Client portal access is not allowed",
    staffDescription: "This area is for client accounts only. Staff use the office dashboard.",
    unlinkedTitle: "Client account setup is incomplete",
    unlinkedDescription: "This sign-in account is not linked to a client file. Contact the secretary to link your account before opening the portal."
  },
  errors: {
    fallback: "The request could not be completed. Please try again.",
    UNAUTHENTICATED: "Your session ended. Sign in again.",
    PERMISSION_DENIED: "You do not have permission to complete this action.",
    NOT_FOUND: "The requested information was not found.",
    VALIDATION_ERROR: "Review the entered information and try again.",
    RATE_LIMITED: "Too many requests were sent. Please try again shortly.",
    SERVER_ERROR: "An unexpected error occurred. Please try again later."
  },
  statuses: {
    case: {
      NEW: "New",
      UNDER_REVIEW: "Under review",
      ACTIVE: "Active",
      AWAITING_JUDGMENT: "Awaiting judgment",
      COMPLETED: "Completed",
      CLOSED: "Closed",
      ARCHIVED: "Archived"
    },
    priority: { LOW: "Low", NORMAL: "Normal", HIGH: "High", URGENT: "Urgent" },
    appointment: {
      SCHEDULED: "Scheduled",
      RESCHEDULED: "Rescheduled",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      NO_SHOW: "No show"
    },
    appointmentType: {
      CONSULTATION: "Consultation",
      COURT_SESSION: "Court session",
      INTERNAL_MEETING: "Internal meeting",
      CALL: "Call",
      ONLINE_MEETING: "Online meeting",
      CASE_FOLLOW_UP: "Case follow-up",
      INTERNAL: "Internal"
    },
    mode: { PHONE: "Phone", ONLINE: "Online", OFFICE: "Office", COURT: "Court" },
    documentCategory: {
      CONTRACT: "Contract",
      COURT_FILE: "Court file",
      IDENTITY: "Identity",
      EVIDENCE: "Evidence",
      PAYMENT: "Payment",
      OTHER: "Other"
    },
    document: {
      NEW: "New",
      UNDER_REVIEW: "Under review",
      NEEDS_CLARIFICATION: "Needs clarification",
      ACCEPTED: "Accepted",
      REJECTED: "Rejected",
      DELETED: "Deleted"
    },
    payment: {
      DRAFT: "Draft",
      ISSUED: "Issued",
      PENDING: "Pending",
      PAID: "Paid",
      OVERDUE: "Overdue",
      CANCELLED: "Cancelled"
    },
    paymentAttempt: {
      CREATED: "Created",
      PENDING: "Pending",
      PAID: "Paid",
      FAILED: "Failed",
      EXPIRED: "Expired",
      CANCELLED: "Cancelled",
      REFUNDED: "Refunded",
      DISPUTED: "Disputed"
    },
    conversation: {
      OPEN: "Open",
      WAITING_STAFF: "Waiting for team",
      WAITING_CLIENT: "Waiting for client",
      CLOSED: "Closed",
      ARCHIVED: "Archived"
    }
  }
} satisfies WidenStrings<typeof ar>;

export type ClientContent = WidenStrings<typeof ar>;

export const clientContent: Record<ClientLocale, ClientContent> = { ar, en };

export function getClientContent(locale: ClientLocale) {
  return clientContent[locale];
}

export function interpolateClientCopy(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

export function clientErrorMessage(
  locale: ClientLocale,
  code: string | null | undefined,
  fallback?: string
) {
  const copy = getClientContent(locale).errors;
  if (code && code in copy) {
    return copy[code as keyof typeof copy];
  }
  return fallback ?? copy.fallback;
}
