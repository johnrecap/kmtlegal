import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, MetricCard, StateBlock } from "@/components/ui";
import { ClientActionPanel } from "@/features/admin/clients/client-crm-forms";
import {
  appointmentStatusLabels,
  appointmentTypeLabels,
  caseStatusLabels,
  clientStatusLabels,
  consultationStatusLabels,
  formatDateTime,
  labelFrom,
  modeLabels,
  priorityLabels,
  serviceCategoryLabels,
  urgencyLabels
} from "@/lib/legal-format";
import {
  canManageAdminClients,
  canManageClientAccounts,
  getAdminClientDetail,
  listAssignableClientLawyers
} from "@/server/admin/client-crm-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { ApiError } from "@/server/http/errors";
import { adminNavForPath } from "../../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل العميل | KMT Legal"
};

type PageProps = {
  params: {
    clientId: string;
  };
};

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-kmt-muted">{label}</p>
      <div className="mt-1 text-sm leading-6 text-kmt-ink">{value || "غير محدد"}</div>
    </div>
  );
}

export default async function AdminClientDetailPage({ params }: PageProps) {
  const guard = await requireAdminPage(`/admin/clients/${params.clientId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  let client: Awaited<ReturnType<typeof getAdminClientDetail>>;
  try {
    client = await getAdminClientDetail({
      actor: guard.context.principal,
      clientId: params.clientId
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <PermissionBlocked title="غير مسموح بفتح ملف العميل" description="هذا العميل خارج نطاق صلاحيات حسابك." />;
    }
    throw error;
  }

  const lawyers = canManageAdminClients(guard.context.principal) ? await listAssignableClientLawyers() : [];

  return (
    <DashboardShell
      eyebrow="CRM العملاء"
      mode="admin"
      navItems={adminNavForPath("/admin/clients")}
      title={client.fullName}
      userLabel={guard.context.user.name}
      action={
        <ButtonLink href="/admin/clients" size="sm" variant="secondary">
          رجوع للعملاء
        </ButtonLink>
      }
    >
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>بيانات العميل</CardTitle>
                  <CardDescription>ملف CRM أساسي بدون عرض بيانات مالية أو ملاحظات داخلية.</CardDescription>
                </div>
                <Badge tone={client.status === "ACTIVE" ? "active" : client.status === "LEAD" ? "pending" : "closed"}>
                  {labelFrom(clientStatusLabels, client.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="الهاتف" value={client.phone} />
                <DetailItem label="البريد الإلكتروني" value={client.email} />
                <DetailItem label="المدينة" value={client.city} />
                <DetailItem label="المصدر" value={client.source} />
                <DetailItem label="المحامي المسؤول" value={client.assignedLawyer?.name} />
                <DetailItem label="تاريخ الإنشاء" value={formatDateTime(client.createdAt)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid min-w-0 gap-4 md:grid-cols-4">
            <MetricCard label="القضايا" value={String(client._count.cases)} meta="كل القضايا المرتبطة بهذا العميل." />
            <MetricCard label="الاستشارات" value={String(client._count.consultationRequests)} meta="طلبات الاستشارة المرتبطة." />
            <MetricCard label="المواعيد" value={String(client._count.appointments)} meta="كل المواعيد المرتبطة." />
            <MetricCard label="المستندات" value={String(client._count.documents)} meta="عدد مستندات العميل فقط؛ الإدارة في PLAN-17." />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>القضايا المرتبطة</CardTitle>
              <CardDescription>عرض مختصر للقضايا المرتبطة مع رابط مباشر لملف القضية الكامل.</CardDescription>
            </CardHeader>
            <CardContent>
              {client.cases.length ? (
                <div className="space-y-3">
                  {client.cases.map((legalCase) => (
                    <Link key={legalCase.id} className="block rounded border border-kmt-border p-3 hover:bg-slate-50" href={`/admin/cases/${legalCase.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{legalCase.internalFileNumber}</p>
                        <Badge tone={legalCase.status === "ACTIVE" ? "active" : "neutral"}>{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-kmt-muted">
                        {legalCase.title} · {labelFrom(priorityLabels, legalCase.priority)} · {formatDateTime(legalCase.nextSessionAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد قضايا" description="القضايا ستظهر بعد تحويل استشارة أو إنشاء قضية في خطة إدارة القضايا." />
              )}
            </CardContent>
          </Card>

          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>الاستشارات</CardTitle>
              </CardHeader>
              <CardContent>
                {client.consultationRequests.length ? (
                  <div className="space-y-3">
                    {client.consultationRequests.map((consultation) => (
                      <Link key={consultation.id} className="block rounded border border-kmt-border p-3 hover:bg-slate-50" href={`/admin/consultations/${consultation.id}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="break-words font-semibold text-kmt-navy">{labelFrom(serviceCategoryLabels, consultation.serviceCategory)}</p>
                          <Badge tone={consultation.status === "CONVERTED" ? "active" : consultation.status === "REJECTED" ? "danger" : "pending"}>
                            {labelFrom(consultationStatusLabels, consultation.status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-kmt-muted">
                          {labelFrom(urgencyLabels, consultation.urgency)} · {formatDateTime(consultation.createdAt)}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <StateBlock title="لا توجد استشارات" description="أي طلب استشارة مرتبط بهذا العميل سيظهر هنا." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المواعيد</CardTitle>
              </CardHeader>
              <CardContent>
                {client.appointments.length ? (
                  <div className="space-y-3">
                    {client.appointments.map((appointment) => (
                      <div key={appointment.id} className="rounded border border-kmt-border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-kmt-ink">{appointment.title}</p>
                          <Badge tone={appointment.status === "COMPLETED" ? "active" : "pending"}>{labelFrom(appointmentStatusLabels, appointment.status)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-kmt-muted">
                          {formatDateTime(appointment.startsAt)} · {labelFrom(appointmentTypeLabels, appointment.type)} · {labelFrom(modeLabels, appointment.mode)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <StateBlock title="لا توجد مواعيد" description="المواعيد المرتبطة بهذا العميل ستظهر هنا." />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <ClientActionPanel
          canManage={canManageAdminClients(guard.context.principal)}
          canManageAccount={canManageClientAccounts(guard.context.principal)}
          client={{
            id: client.id,
            fullName: client.fullName,
            phone: client.phone,
            email: client.email,
            city: client.city,
            source: client.source,
            status: client.status,
            assignedLawyerId: client.assignedLawyerId,
            user: client.user
          }}
          lawyers={lawyers}
        />
      </div>
    </DashboardShell>
  );
}
