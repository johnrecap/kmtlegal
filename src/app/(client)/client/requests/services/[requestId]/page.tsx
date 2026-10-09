import { notFound } from "next/navigation";
import { ApiError } from "@/server/http/errors";
import { ClientSiteShell } from "@/components/layout";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { normalizeClientLocale } from "@/content/client-content";
import { serviceRequestCopy } from "@/content/service-request-copy";
import { ServiceRequestWorkspace, type ServiceRequestView } from "@/features/portal/service-request-workspace";
import { getServiceRequest } from "@/server/services/service-request-service";
import { uuidSchema } from "@/server/validation/schemas";
import { clientNavForPath } from "../../../client-navigation";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const id = uuidSchema.safeParse((await params).requestId); if (!id.success) notFound();
  const guard = await requirePortalPage(`/client/requests/services/${id.data}`);
  const locale = normalizeClientLocale(guard.context.user.locale);
  if (guard.status === "forbidden") return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  const value = await getServiceRequest(guard.context.principal, id.data).catch(error => { if (error instanceof ApiError && error.status === 404) notFound(); throw error; });
  return <ClientSiteShell locale={locale} navItems={clientNavForPath("/client/requests", locale)} title={serviceRequestCopy[locale].title} userLabel={guard.context.user.name}><ServiceRequestWorkspace key={value.revision} value={JSON.parse(JSON.stringify(value)) as ServiceRequestView} locale={locale} /></ClientSiteShell>;
}
