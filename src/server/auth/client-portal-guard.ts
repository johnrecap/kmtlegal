import type { AuthContext } from "./session-store";
import { ROLES } from "./policy";

export type ClientPortalGuardIssue = {
  title: string;
  description: string;
};

export function clientPortalGuardIssue(context: AuthContext): ClientPortalGuardIssue | null {
  if (context.principal.roleName !== ROLES.client) {
    return {
      title: "غير مسموح بالدخول إلى بوابة العميل",
      description: "هذا المسار مخصص لحسابات العملاء فقط. فريق العمل يستخدم لوحة المكتب."
    };
  }

  if (!context.principal.clientId) {
    return {
      title: "حساب العميل غير مكتمل",
      description: "حساب الدخول غير مرتبط بملف عميل داخل المكتب. تواصل مع السكرتارية لتفعيل ربط الحساب بملفك قبل فتح البوابة."
    };
  }

  return null;
}
