import { notFound } from "next/navigation";
import { ApiError } from "@/server/http/errors";
import { DashboardShell } from "@/components/layout";
import { AdminPermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { hasPermission } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { getServiceRequest } from "@/server/services/service-request-service";
import { ServiceRequestWorkspace, type ServiceRequestView } from "@/features/portal/service-request-workspace";
import { serviceRequestCopy } from "@/content/service-request-copy";
import { uuidSchema } from "@/server/validation/schemas";
import { adminNavForPath } from "../../admin-navigation";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const id = uuidSchema.safeParse((await params).requestId); if (!id.success) notFound();
  const guard = await requireAdminRoutePage(`/admin/service-requests/${id.data}`);
  if (guard.status === "forbidden") return <AdminPermissionBlocked title={guard.title} description={guard.description} />;
  const actor = guard.context.principal; const manager = hasPermission(actor, "case.update.any");
  const value = await getServiceRequest(actor, id.data).catch(error => { if (error instanceof ApiError && error.status === 404) notFound(); throw error; });
  const lawyers = manager ? await prisma.user.findMany({ where: { role: { name: "Lawyer", status: "ACTIVE" }, status: "ACTIVE", deletedAt: null }, select: { id: true, name: true } }) : [];
  return <DashboardShell principal={actor} userLabel={guard.context.user.name} eyebrow="KMT Legal" title={serviceRequestCopy.ar.title} navItems={adminNavForPath("/admin/service-requests", actor)}><ServiceRequestWorkspace key={value.revision} value={JSON.parse(JSON.stringify(value)) as ServiceRequestView} locale="ar" staff staffLinks={{ client: hasPermission(actor, "client.read.any"), conversation: hasPermission(actor, "conversation.read.any") || hasPermission(actor, "conversation.manage.any"), finance: hasPermission(actor, "finance.read.any") || hasPermission(actor, "finance.manage.any") }} manager={manager} canQuote={manager && hasPermission(actor, "finance.manage.any")} canWork={manager || (hasPermission(actor, "case.update.assigned") && value.assignedLawyerId === actor.id)} lawyers={lawyers} /></DashboardShell>;
}
