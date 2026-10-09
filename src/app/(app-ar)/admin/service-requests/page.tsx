import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminPermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { hasPermission } from "@/server/auth/policy";
import { serviceRequestCopy } from "@/content/service-request-copy";
import { listServiceRequests } from "@/server/services/service-request-service";
import { QuestionnairePublisher } from "@/features/portal/service-request-workspace";
import { adminNavForPath } from "../admin-navigation";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const guard = await requireAdminRoutePage("/admin/service-requests");
  if (guard.status === "forbidden") return <AdminPermissionBlocked title={guard.title} description={guard.description} />;
  const status = (await searchParams)?.status;
  const actor = guard.context.principal; const items = await listServiceRequests(actor, status === "RECEIVED" || status === "AWAITING_ACCEPTANCE" ? status : undefined); const copy = serviceRequestCopy.ar;
  return <DashboardShell principal={actor} userLabel={guard.context.user.name} eyebrow="KMT Legal" title={copy.title} navItems={adminNavForPath("/admin/service-requests", actor)}><div className="grid gap-5">
    {!items.length && <p>{copy.empty}</p>}{items.map(item => <Link className="block min-w-0 rounded-xl border border-border bg-surface p-5" key={item.id} href={`/admin/service-requests/${item.id}`}><h2 className="font-semibold">{copy.kinds[item.kind as keyof typeof copy.kinds]} · {item.client.fullName}</h2><p>{copy.statuses[item.status as keyof typeof copy.statuses]}</p><p className="break-all" dir="ltr">{item.reference}</p></Link>)}
    {hasPermission(actor, "settings.manage.any") && <QuestionnairePublisher />}
  </div></DashboardShell>;
}
