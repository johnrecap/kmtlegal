import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { ButtonLink } from "@/components/ui";
import { ManualCaseCreateForm } from "@/features/admin/cases/manual-case-form";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { plan35ManualCaseUiCopy as copy } from "@/lib/ui-copy";
import { getManualCaseFormOptions } from "@/server/admin/manual-case-service";
import { AdminPermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${copy.createTitle} | KMT Legal`,
  description: copy.createDescription
};

type SearchParams = { clientId?: string | string[] };

export default async function AdminManualCaseCreatePage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const guard = await requireAdminRoutePage("/admin/cases/new");
  if (guard.status === "forbidden") {
    return <AdminPermissionBlocked description={guard.description} title={guard.title} />;
  }

  const options = await getManualCaseFormOptions({ actor: guard.context.principal });
  const requestedClientId = (await searchParams)?.clientId;
  const clientId = Array.isArray(requestedClientId) ? requestedClientId[0] : requestedClientId;
  const defaultClientId = options.clients.some((client) => client.id === clientId) ? clientId : undefined;

  return (
    <DashboardShell
      action={
        <ButtonLink href="/admin/cases" size="sm" variant="secondary">
          {copy.cancel}
        </ButtonLink>
      }
      actionRouteId="cases.list"
      eyebrow={copy.eyebrow}
      mode="admin"
      navItems={adminNavForPath("/admin/cases/new")}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
      principal={guard.context.principal}
      title={copy.createTitle}
      userLabel={guard.context.user.name}
    >
      <div className="mx-auto max-w-5xl">
        <ManualCaseCreateForm
          clients={options.clients}
          defaultClientId={defaultClientId}
          initialRequestToken={randomUUID()}
          lawyers={options.lawyers}
        />
      </div>
    </DashboardShell>
  );
}
