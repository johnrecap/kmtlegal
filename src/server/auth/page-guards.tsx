import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShellState } from "@/components/layout/admin-shell-state";
import { ButtonLink, StateBlock } from "@/components/ui";
import { signedInRedirectPath } from "@/lib/auth-routing";
import { canAccessAdminPath } from "@/lib/admin-route-policy";
import {
  plan35AdminRecoveryCopy,
  plan35AdminStateCopy,
  protectedRecoveryUiCopy
} from "@/lib/ui-copy";
import { clientPortalGuardIssue } from "./client-portal-guard";
import { isStaffRole } from "./policy";
import { getAuthContextFromCookieHeader, type AuthContext } from "./session-store";

export type ProtectedPageResult =
  | { status: "authorized"; context: AuthContext }
  | {
      status: "forbidden";
      context: AuthContext;
      title: string;
      description: string;
    };

export async function cookieHeaderForServerComponent() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`)
    .join("; ");
}

export async function getAuthContextForPage(options: { allowPendingTwoFactor?: boolean } = {}) {
  return getAuthContextFromCookieHeader(await cookieHeaderForServerComponent(), options);
}

export async function redirectSignedInUser(requestedPath?: string | null) {
  const context = await getAuthContextForPage();
  if (context) redirect(signedInRedirectPath(context.principal.roleName, requestedPath));
}

async function requireProtectedPageContext(nextPath: string) {
  const context = await getAuthContextForPage();
  if (!context) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return context;
}

export async function requireAdminPage(nextPath = "/admin"): Promise<ProtectedPageResult> {
  const context = await requireProtectedPageContext(nextPath);
  if (!isStaffRole(context.principal.roleName)) {
    return forbiddenPageResult(
      context,
      protectedRecoveryUiCopy.adminOnlyTitle,
      protectedRecoveryUiCopy.adminOnlyDescription
    );
  }
  return { status: "authorized", context };
}

export async function requireAdminRoutePage(nextPath: string): Promise<ProtectedPageResult> {
  const guard = await requireAdminPage(nextPath);
  if (guard.status === "forbidden") return guard;
  if (canAccessAdminPath(guard.context.principal, nextPath)) return guard;
  return forbiddenPageResult(
    guard.context,
    plan35AdminStateCopy.denied.title,
    plan35AdminStateCopy.denied.description
  );
}

export async function requirePortalPage(nextPath = "/portal"): Promise<ProtectedPageResult> {
  const context = await requireProtectedPageContext(nextPath);
  const issue = clientPortalGuardIssue(context);
  return issue
    ? forbiddenPageResult(context, issue.title, issue.description)
    : { status: "authorized", context };
}

function forbiddenPageResult(
  context: AuthContext,
  title: string,
  description: string
): ProtectedPageResult {
  return { status: "forbidden", context, title, description };
}

export function AdminPermissionBlocked({ title, description }: { title: string; description: string }) {
  return (
    <AdminShellState
      action={{ href: "/admin", label: plan35AdminRecoveryCopy.backToWorkspace }}
      description={description}
      testId="admin-permission-denied"
      title={title}
      tone="permission"
    />
  );
}

export function PermissionBlocked({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <StateBlock
        action={
          <ButtonLink href="/" variant="secondary">
            {protectedRecoveryUiCopy.backToDashboard}
          </ButtonLink>
        }
        description={description}
        title={title}
        tone="permission"
      />
    </div>
  );
}
