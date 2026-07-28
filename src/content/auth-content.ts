import type { ClientLocale } from "@/content/client-content";

const authContentAr = {
  metadata: {
    title: "تسجيل الدخول | KMT Legal",
    description: "تسجيل الدخول الآمن إلى بوابة العميل أو لوحة فريق مكتب KMT Legal."
  },
  login: {
    eyebrow: "وصول آمن",
    title: "بوابة واحدة للعميل وفريق المكتب",
    description:
      "تُحمى جلسات العمل وبيانات القضايا بصلاحيات واضحة ومراجعة داخلية لعمليات الدخول.",
    securityNote:
      "استخدم بيانات الحساب التي أرسلها لك فريق KMT Legal فقط. إذا تعذر الدخول، تواصل مع المكتب للتحقق من الحساب.",
    languageSwitch: "English",
    languageSwitchLabel: "عرض صفحة الدخول بالإنجليزية",
    backHome: "العودة إلى الموقع",
    formTitle: "تسجيل الدخول",
    formDescription: "أدخل بيانات حسابك للوصول إلى بوابة العميل أو لوحة المكتب.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    submit: "دخول",
    twoFactorExpired:
      "انتهت جلسة التحقق الثنائي. سجل الدخول مرة أخرى ثم اطلب رمزًا جديدًا.",
    emailRequired: "اكتب البريد الإلكتروني.",
    emailInvalid: "اكتب بريدًا إلكترونيًا صحيحًا.",
    passwordRequired: "اكتب كلمة المرور.",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    tooManyRequests: "تمت محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.",
    invalidRequest: "تحقق من بيانات الدخول ثم حاول مرة أخرى.",
    twoFactorUnavailable:
      "التحقق الثنائي لفريق المكتب غير متاح حاليًا. تواصل مع مسؤول النظام.",
    incompleteResponse: "لم يكتمل تسجيل الدخول. حاول مرة أخرى.",
    requestFailed: "تعذر تنفيذ الطلب الآن. حاول مرة أخرى.",
    serverUnavailable: "لا يمكن الوصول إلى الخدمة الآن. حاول مرة أخرى بعد قليل."
  },
  readiness: {
    eyebrow: "جاهزية KMT Legal",
    title: "الخدمة لم تكتمل جاهزيتها بعد",
    description:
      "تم إيقاف تسجيل الدخول مؤقتًا لأن فحوص التشغيل الأساسية لم تكتمل. راجع إعداد الخدمة وقاعدة البيانات ثم أعد المحاولة.",
    unknown: "لم يرجع فحص الجاهزية سببًا محددًا. راجع سجل الخدمة وفحص الصحة."
  }
} as const;

type WidenStrings<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? readonly WidenStrings<Item>[]
    : T extends object
      ? { [Key in keyof T]: WidenStrings<T[Key]> }
      : T;

const authContentEn = {
  metadata: {
    title: "Sign in | KMT Legal",
    description: "Secure sign-in to the KMT Legal client portal or staff workspace."
  },
  login: {
    eyebrow: "Secure access",
    title: "One gateway for clients and the office team",
    description:
      "Work sessions and case information are protected by clear permissions and internal sign-in review.",
    securityNote:
      "Use only the account details sent to you by KMT Legal. If you cannot sign in, contact the office so the account can be verified.",
    languageSwitch: "العربية",
    languageSwitchLabel: "Show the sign-in page in Arabic",
    backHome: "Back to website",
    formTitle: "Sign in",
    formDescription: "Enter your account details to open the client portal or staff workspace.",
    email: "Email address",
    password: "Password",
    submit: "Sign in",
    twoFactorExpired:
      "Your two-factor verification session expired. Sign in again, then request a new code.",
    emailRequired: "Enter your email address.",
    emailInvalid: "Enter a valid email address.",
    passwordRequired: "Enter your password.",
    invalidCredentials: "The email address or password is incorrect.",
    tooManyRequests: "There have been too many attempts. Wait a moment and try again.",
    invalidRequest: "Check your sign-in details and try again.",
    twoFactorUnavailable:
      "Two-factor verification for office staff is currently unavailable. Contact the system administrator.",
    incompleteResponse: "Sign-in did not complete. Try again.",
    requestFailed: "The request could not be completed. Try again.",
    serverUnavailable: "The service cannot be reached right now. Try again shortly."
  },
  readiness: {
    eyebrow: "KMT Legal readiness",
    title: "The service is not ready yet",
    description:
      "Sign-in is temporarily unavailable because essential runtime checks have not completed. Review the service and database configuration, then try again.",
    unknown: "The readiness check did not return a specific reason. Review the service log and health check."
  }
} as const satisfies WidenStrings<typeof authContentAr>;

export type AuthContent = WidenStrings<typeof authContentAr>;

const authContentByLocale: Record<ClientLocale, AuthContent> = {
  ar: authContentAr,
  en: authContentEn
};

export function getAuthContent(locale: ClientLocale): AuthContent {
  return authContentByLocale[locale];
}
