import type { ReactNode } from "react";
import { AdminAccessProvider } from "@/features/admin/shell/admin-access-context";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "./admin-navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const guard = await requireAdminPage("/admin");
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} title={guard.title} />;
  }

  const snapshot = {
    navItems: adminNavForPath("/admin", guard.context.principal),
    userLabel: guard.context.user.name || plan35AdminShellCopy.fallbackUser
  };
  return <AdminAccessProvider snapshot={snapshot}>{children}</AdminAccessProvider>;
}
