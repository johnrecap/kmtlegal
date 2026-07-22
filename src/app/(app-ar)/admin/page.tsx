import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FilterBar, MetricCard, SearchInput, StateBlock } from "@/components/ui";
import {
  appointmentStatusLabels,
  caseStatusLabels,
  clientStatusLabels,
  consultationStatusLabels,
  formatDateTime,
  labelFrom,
  modeLabels,
  serviceCategoryLabels
} from "@/lib/legal-format";
import { getAdminDashboard } from "@/server/admin/dashboard-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "./admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوحة المكتب | KMT Legal",
  description: "نظرة تشغيلية محمية لفريق عمل KMT Legal."
};

function metricValue(value: number | null) {
  return value === null ? "—" : String(value);
}

function PermissionState({ label }: { label: string }) {
  return (
    <StateBlock
      tone="permission"
      title={`${label} غير متاح`}
      description="لا توجد صلاحية كافية لعرض هذا الجزء من لوحة المكتب لهذا الحساب."
    />
  );
}

export default async function AdminHomePage() {
  const guard = await requireAdminRoutePage("/admin");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const dashboard = await getAdminDashboard(guard.context.principal);
  const metrics = Object.values(dashboard.metrics);

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin")}
      title="نظرة تشغيلية"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="min-w-0 space-y-6">
        <form action="/admin/clients" method="get">
          <FilterBar>
            <SearchInput className="min-w-0 flex-1 sm:min-w-96" name="q" placeholder="بحث سريع في العملاء بالاسم أو الهاتف أو البريد" />
            <Button type="submit" variant="secondary">
              بحث
            </Button>
          </FilterBar>
        </form>

        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((item) => (
            <MetricCard key={item.label} label={item.label} value={metricValue(item.value)} meta={item.definition} />
          ))}
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>أحدث العملاء</CardTitle>
                  <CardDescription>آخر ملفات CRM داخل نطاق صلاحياتك.</CardDescription>
                </div>
                <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/clients">
                  عرض الكل
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!dashboard.access.clients ? (
                <PermissionState label="العملاء" />
              ) : dashboard.latestClients.length ? (
                <div className="space-y-3">
                  {dashboard.latestClients.map((client) => (
                    <Link key={client.id} className="block min-w-0 rounded border border-kmt-border p-3 hover:bg-slate-50" href={`/admin/clients/${client.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-navy">{client.fullName}</p>
                        <Badge tone={client.status === "ACTIVE" ? "active" : client.status === "LEAD" ? "pending" : "neutral"}>
                          {labelFrom(clientStatusLabels, client.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 break-words text-sm text-kmt-muted">{client.assignedLawyer?.name ?? "غير معين"} · {formatDateTime(client.createdAt)}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد ملفات عملاء" description="ستظهر ملفات العملاء بعد التحويل من الاستشارات أو الإضافة اليدوية من CRM." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المواعيد القادمة</CardTitle>
              <CardDescription>أقرب مواعيد مجدولة أو معاد جدولتها داخل نطاق صلاحياتك.</CardDescription>
            </CardHeader>
            <CardContent>
              {!dashboard.access.appointments ? (
                <PermissionState label="المواعيد" />
              ) : dashboard.upcomingAppointments.length ? (
                <div className="space-y-3">
                  {dashboard.upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="min-w-0 rounded border border-kmt-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{appointment.title}</p>
                        <Badge tone="pending">{labelFrom(appointmentStatusLabels, appointment.status)}</Badge>
                      </div>
                      <p className="mt-1 break-words text-sm text-kmt-muted">
                        {formatDateTime(appointment.startsAt)} · {appointment.client.fullName} · {labelFrom(modeLabels, appointment.mode)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد مواعيد قادمة" description="أي موعد متابعة أو جلسة مجدولة ستظهر هنا." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>طلبات الاستشارة الأخيرة</CardTitle>
                  <CardDescription>طلبات تحتاج مراجعة أو متابعة من الفريق.</CardDescription>
                </div>
                <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/consultations">
                  عرض قائمة الاستشارات
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!dashboard.access.consultations ? (
                <PermissionState label="الاستشارات" />
              ) : dashboard.recentConsultations.length ? (
                <div className="space-y-3">
                  {dashboard.recentConsultations.map((consultation) => (
                    <Link key={consultation.id} className="block min-w-0 rounded border border-kmt-border p-3 hover:bg-slate-50" href={`/admin/consultations/${consultation.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-navy">{consultation.fullName}</p>
                        <Badge tone={consultation.status === "CONVERTED" ? "active" : consultation.status === "REJECTED" ? "danger" : "pending"}>
                          {labelFrom(consultationStatusLabels, consultation.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 break-words text-sm text-kmt-muted">{labelFrom(serviceCategoryLabels, consultation.serviceCategory)} · {formatDateTime(consultation.createdAt)}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد استشارات حديثة" description="طلبات الحجز الجديدة ستظهر هنا بعد إرسالها من الموقع العام." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>آخر القضايا المحدثة</CardTitle>
              <CardDescription>قراءة تشغيلية مختصرة مع ربط مباشر بملف القضية الكامل.</CardDescription>
            </CardHeader>
            <CardContent>
              {!dashboard.access.cases ? (
                <PermissionState label="القضايا" />
              ) : dashboard.recentCases.length ? (
                <div className="space-y-3">
                  {dashboard.recentCases.map((legalCase) => (
                    <Link key={legalCase.id} className="block min-w-0 rounded border border-kmt-border p-3 hover:bg-slate-50" href={`/admin/cases/${legalCase.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{legalCase.internalFileNumber}</p>
                        <Badge tone={legalCase.status === "ACTIVE" ? "active" : "neutral"}>{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
                      </div>
                      <p className="mt-1 break-words text-sm text-kmt-muted">
                        {legalCase.title} · {legalCase.client.fullName} · {formatDateTime(legalCase.updatedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد قضايا في النطاق" description="القضايا المرتبطة بصلاحياتك ستظهر هنا بعد إنشائها." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
