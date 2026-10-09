export const serviceRequestCopy = {
  ar: {
    followup: "طلب معالجة بند من تقرير الفحص", source: "طلب الفحص المرتبط",
    client: "ملف العميل", awaitingOffice: "طلبات خدمات تنتظر المكتب", awaitingClient: "عروض تنتظر موافقة العميل", handoffs: "محادثات تنتظر الموظف", unavailable: "تعذر تحميل العدد. افتح القائمة لإعادة المحاولة.",
    title: "طلبات الخدمات", newRequest: "طلب خدمة جديد", create: "إنشاء مسودة", empty: "لا توجد طلبات خدمات حتى الآن.",
    kinds: { CONTRACT_DRAFT: "صياغة عقد", CONTRACT_REVIEW: "مراجعة عقد", HEALTH_CHECK: "الفحص القانوني للشركات" },
    statuses: { DRAFT: "مسودة", RECEIVED: "مستلم", NEEDS_INFORMATION: "يحتاج معلومات", AWAITING_ACCEPTANCE: "ينتظر الموافقة على العرض", IN_PROGRESS: "قيد العمل", READY: "جاهز للتسليم", COMPLETED: "مكتمل", CANCELLED: "ملغى" },
    name: "نوع العقد أو اسم الشركة", purpose: "الغرض ونطاق المساعدة المطلوبة", language: "لغة المستند", requestedDate: "التاريخ المطلوب (يخضع لمراجعة المكتب)", languages: { ar: "العربية", en: "الإنجليزية", both: "العربية والإنجليزية" },
    answers: { YES: "نعم", NO: "لا", UNSURE: "غير متأكد", NOT_APPLICABLE: "لا ينطبق" }, unanswered: "لم أجب بعد",
    save: "حفظ المسودة", submit: "إرسال للمكتب", saved: "تم الحفظ.", failed: "تعذر تنفيذ الإجراء. راجع البيانات وحدّث الصفحة ثم أعد المحاولة.",
    verify: "يلزم حساب ببريد موثّق لإنشاء الطلب ورفع المستندات. يمكنك تفعيله من مساعد KMT.", healthPending: "استبيان الفحص القانوني ينتظر اعتماد المكتب قبل إتاحته.",
    quote: "عرض المكتب", amount: "الأتعاب", currency: "العملة", scope: "نطاق العمل", duration: "المدة المقترحة بالأيام", accept: "أوافق على نطاق العمل والأتعاب والمدة", sendQuote: "إرسال العرض للعميل", invoice: "عرض الأتعاب والدفعات",
    files: "المستندات ونسخ التسليم", upload: "رفع مستند", delivery: "نسخة تسليم راجعها المكتب", fileHelp: "حتى 5 ميجابايت: PDF أو Word أو JPG أو PNG. يُفحص الملف قبل حفظه.", version: "نسخة", notes: "المراسلات", message: "الرسالة", internal: "ملاحظة داخلية لا تظهر للعميل", send: "إرسال", assign: "إسناد إلى محامٍ", lawyer: "المحامي", choose: "اختر", changeStatus: "تحديث الحالة", reason: "التفاصيل أو طلب التعديل", revision: "طلب تعديل على التسليم", complete: "اعتماد الاستلام وإغلاق الطلب", cancel: "إلغاء الطلب", back: "العودة للطلبات", healthHint: "عدم الإجابة أو عدم التأكد لا يعني وجود مخالفة. يراجع المكتب الإجابات والمستندات لتحديد النطاق والأولويات.",
    questionnaire: "اعتماد استبيان الفحص القانوني", questionAr: "السؤال بالعربية", questionEn: "السؤال بالإنجليزية", addQuestion: "إضافة سؤال", approve: "راجعت الأسئلة وأعتمد نشر هذه النسخة", publish: "نشر نسخة معتمدة", noAutomatedResult: "المكتب ينفذ المراجعة ويسلّم تقريرًا معتمدًا؛ لا يصدر الموقع تقييم امتثال تلقائيًا."
  },
  en: {
    followup: "Request work on a finding in the report", source: "Linked Health Check request",
    client: "Client profile", awaitingOffice: "Service requests awaiting the office", awaitingClient: "Proposals awaiting client acceptance", handoffs: "Conversations awaiting staff", unavailable: "The count could not be loaded. Open the list to try again.",
    title: "Service requests", newRequest: "New service request", create: "Create draft", empty: "No service requests yet.",
    kinds: { CONTRACT_DRAFT: "Contract drafting", CONTRACT_REVIEW: "Contract review", HEALTH_CHECK: "Legal Health Check" },
    statuses: { DRAFT: "Draft", RECEIVED: "Received", NEEDS_INFORMATION: "Information needed", AWAITING_ACCEPTANCE: "Awaiting quote acceptance", IN_PROGRESS: "In progress", READY: "Ready for delivery", COMPLETED: "Completed", CANCELLED: "Cancelled" },
    name: "Contract type or company name", purpose: "Purpose and assistance required", language: "Document language", requestedDate: "Requested date (subject to office review)", languages: { ar: "Arabic", en: "English", both: "Arabic and English" },
    answers: { YES: "Yes", NO: "No", UNSURE: "Unsure", NOT_APPLICABLE: "Not applicable" }, unanswered: "Not answered yet",
    save: "Save draft", submit: "Send to the office", saved: "Saved.", failed: "The action could not be completed. Check the details, refresh the page and try again.",
    verify: "A verified email account is required to create requests and upload documents. Activate it through the KMT assistant.", healthPending: "The Health Check questionnaire is awaiting office approval.",
    quote: "Office proposal", amount: "Fee", currency: "Currency", scope: "Scope of work", duration: "Proposed duration in days", accept: "I accept the scope, fee and duration", sendQuote: "Send proposal to client", invoice: "View fees and payments",
    files: "Documents and delivery versions", upload: "Upload document", delivery: "Delivery reviewed by the office", fileHelp: "Up to 5 MB: PDF, Word, JPG or PNG. Files are scanned before storage.", version: "Version", notes: "Messages", message: "Message", internal: "Internal note, hidden from the client", send: "Send", assign: "Assign lawyer", lawyer: "Lawyer", choose: "Choose", changeStatus: "Update status", reason: "Details or revision request", revision: "Request a delivery revision", complete: "Accept delivery and close request", cancel: "Cancel request", back: "Back to requests", healthHint: "Missing or uncertain answers do not establish a breach. The office reviews answers and documents to determine scope and priorities.",
    questionnaire: "Approve the Health Check questionnaire", questionAr: "Question in Arabic", questionEn: "Question in English", addQuestion: "Add question", approve: "I have reviewed and approve publication of these questions", publish: "Publish approved version", noAutomatedResult: "The office performs the review and delivers an approved report; the website does not generate a compliance score."
  }
} as const;
