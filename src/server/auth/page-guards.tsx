import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ButtonLink, StateBlock } from "@/components/ui";
import { signedInRedirectPath } from "@/lib/auth-routing";
import { getAuthContextFromCookieHeader, type AuthContext } from "./session-store";
import { isStaffRole, ROLES } from "./policy";

export type ProtectedPageResult =
  | { status: "authorized"; context: AuthContext }
  | {
      status: "forbidden";
      context: AuthContext;
      title: string;
      description: string;
    };

export function cookieHeaderForServerComponent() {
  return cookies()
    .getAll()
    .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`)
    .join("; ");
}

export async function getAuthContextForPage(options: { allowPendingTwoFactor?: boolean } = {}) {
  return getAuthContextFromCookieHeader(cookieHeaderForServerComponent(), options);
}

export async function redirectSignedInUser(requestedPath?: string | null) {
  const context = await getAuthContextForPage();
  if (!context) {
    return;
  }

  redirect(signedInRedirectPath(context.principal.roleName, requestedPath));
}

async function requireProtectedPageContext(nextPath: string) {
  const context = await getAuthContextForPage();
  if (!context) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return context;
}

export async function requireAdminPage(nextPath = "/admin"): Promise<ProtectedPageResult> {
  const context = await requireProtectedPageContext(nextPath);
  if (!isStaffRole(context.principal.roleName)) {
    return {
      status: "forbidden",
      context,
      title: "غير مسموح بالدخول إلى لوحة المكتب",
      description: "هذا المسار مخصص لفريق العمل فقط. حسابات العملاء تظل داخل بوابة العميل."
    };
  }

  return { status: "authorized", context };
}

export async function requirePortalPage(nextPath = "/portal"): Promise<ProtectedPageResult> {
  const context = await requireProtectedPageContext(nextPath);
  if (context.principal.roleName !== ROLES.client) {
    return {
      status: "forbidden",
      context,
      title: "غير مسموح بالدخول إلى بوابة العميل",
      description: "هذا المسار مخصص لحسابات العملاء فقط. فريق العمل يستخدم لوحة المكتب."
    };
  }

  return { status: "authorized", context };
}

export function PermissionBlocked({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <StateBlock
        tone="permission"
        title={title}
        description={description}
        action={
          <ButtonLink href="/" variant="secondary">
            الرجوع للصفحة الرئيسية
          </ButtonLink>
        }
      />
    </div>
  );
}
