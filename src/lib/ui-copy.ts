export const commonUiCopy = {
  unknown: "غير محدد",
  notAssigned: "غير معين",
  noData: "لا توجد بيانات",
  noResults: "لا توجد نتائج مطابقة.",
  saved: "تم الحفظ.",
  serverUnavailable: "لا يمكن الوصول إلى الخادم الآن. حاول مرة أخرى بعد قليل."
} as const;

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
  "Invalid request.": "الطلب غير صحيح.",
  "Request validation failed.": "البيانات المرسلة غير مكتملة أو غير صحيحة.",
  "Too many requests.": "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.",
  "Too many requests. Try again later.": "تم إرسال طلبات كثيرة. حاول مرة أخرى بعد قليل.",
  "Contact form data is incomplete.": "بيانات نموذج التواصل غير مكتملة.",
  "Consultation request data is incomplete.": "بيانات طلب الاستشارة غير مكتملة.",
  "An unexpected server error occurred.": "حدث خطأ غير متوقع في الخادم. حاول مرة أخرى لاحقًا.",
  "A recent consultation request already exists for the same phone number and area. Please wait for the team review or contact us.":
    "يوجد طلب استشارة قريب بنفس رقم الهاتف ونفس المجال. انتظر مراجعة الفريق أو تواصل معنا.",
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
