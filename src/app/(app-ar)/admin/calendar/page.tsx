import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FilterBar, Select, StateBlock, TextInput } from "@/components/ui";
import {
  AppointmentRescheduleForm,
  CalendarAppointmentForm
} from "@/features/admin/cases/case-action-forms";
import { appointmentStatusLabels, appointmentTypeLabels, formatDate, formatDateTime, labelFrom, modeLabels } from "@/lib/legal-format";
import {
  getAdminCaseFilterOptions,
  canManageCalendarAppointment,
  listAdminCalendarAppointments,
  listCalendarCaseOptions
} from "@/server/admin/case-operations-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { ApiError } from "@/server/http/errors";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تقويم المكتب | KMT Legal",
  description: "تقويم مواعيد القضايا والجلسات مع إنشاء وإعادة جدولة المواعيد."
};

type SearchParams = Record<string, string | string[] | undefined>;
type CalendarAppointment = Awaited<ReturnType<typeof listAdminCalendarAppointments>>["items"][number];
type CalendarCaseOption = Awaited<ReturnType<typeof listCalendarCaseOptions>>[number];
type CalendarLawyerOption = Awaited<ReturnType<typeof getAdminCaseFilterOptions>>["lawyers"][number];

const appointmentStatusOptions = ["SCHEDULED", "RESCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const appointmentModeOptions = ["COURT", "OFFICE", "ONLINE", "PHONE"];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function dateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function statusTone(status: string) {
  if (status === "COMPLETED") {
    return "active" as const;
  }
  if (status === "CANCELLED" || status === "NO_SHOW") {
    return "closed" as const;
  }
  return "pending" as const;
}

function calendarHref(filters: {
  from?: string;
  to?: string;
  status?: string;
  mode?: string;
  lawyerId?: string;
  pageSize?: string;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  return `/admin/calendar?${params.toString()}`;
}

function groupAppointmentsByDay(appointments: CalendarAppointment[]) {
  return appointments.reduce<Array<{ key: string; label: string; items: CalendarAppointment[] }>>((groups, appointment) => {
    const key = dateInput(appointment.startsAt);
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.items.push(appointment);
      return groups;
    }

    groups.push({ key, label: formatDate(appointment.startsAt), items: [appointment] });
    return groups;
  }, []);
}

export default async function AdminCalendarPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminPage("/admin/calendar");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  let result: Awaited<ReturnType<typeof listAdminCalendarAppointments>>;
  let caseOptions: Awaited<ReturnType<typeof listCalendarCaseOptions>>;
  let filterOptions: Awaited<ReturnType<typeof getAdminCaseFilterOptions>>;

  try {
    [result, caseOptions, filterOptions] = await Promise.all([
      listAdminCalendarAppointments({ actor: guard.context.principal, query }),
      listCalendarCaseOptions(guard.context.principal),
      getAdminCaseFilterOptions(guard.context.principal)
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <PermissionBlocked title="غير مسموح بفتح التقويم" description="هذا المسار يحتاج صلاحية قراءة أو إدارة مواعيد القضايا داخل نطاقك." />;
    }
    throw error;
  }

  const requestedCaseId = typeof query.caseId === "string" ? query.caseId : undefined;
  const defaultCaseId = caseOptions.some((legalCase: CalendarCaseOption) => legalCase.id === requestedCaseId) ? requestedCaseId : undefined;
  const groupedAppointments = groupAppointmentsByDay(result.items);

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/calendar")}
      title="تقويم المكتب"
      userLabel={guard.context.user.name}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <form action="/admin/calendar" method="get">
            <FilterBar>
              <TextInput className="min-w-40" defaultValue={dateInput(result.from)} label="من" name="from" type="date" />
              <TextInput className="min-w-40" defaultValue={dateInput(result.to)} label="إلى" name="to" type="date" />
              <Select className="min-w-44" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {appointmentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelFrom(appointmentStatusLabels, status)}
                  </option>
                ))}
              </Select>
              <Select className="min-w-40" defaultValue={result.filters.mode ?? ""} label="الطريقة" name="mode">
                <option value="">كل الطرق</option>
                {appointmentModeOptions.map((mode) => (
                  <option key={mode} value={mode}>
                    {labelFrom(modeLabels, mode)}
                  </option>
                ))}
              </Select>
              {filterOptions.lawyers.length ? (
                <Select className="min-w-44" defaultValue={result.filters.lawyerId ?? ""} label="المحامي" name="lawyerId">
                  <option value="">كل المحامين</option>
                  {filterOptions.lawyers.map((lawyer: CalendarLawyerOption) => (
                    <option key={lawyer.id} value={lawyer.id}>
                      {lawyer.name}
                    </option>
                  ))}
                </Select>
              ) : null}
              <Button type="submit" variant="secondary">
                تطبيق
              </Button>
            </FilterBar>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
            <p>{result.items.length} موعد داخل الفترة المعروضة</p>
            <Link className="font-semibold text-kmt-navy hover:underline" href="/admin/calendar">
              إعادة الضبط
            </Link>
          </div>

          {groupedAppointments.length ? (
            <div className="space-y-5">
              {groupedAppointments.map((group) => (
                <section key={group.key} className="space-y-3" aria-labelledby={`calendar-${group.key}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 id={`calendar-${group.key}`} className="text-base font-semibold text-kmt-ink">
                      {group.label}
                    </h2>
                    <Badge>{group.items.length} موعد</Badge>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((appointment) => (
                      <Card key={appointment.id}>
                        <CardHeader>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <CardTitle>{appointment.title}</CardTitle>
                              <CardDescription>
                                {formatDateTime(appointment.startsAt)} · {labelFrom(appointmentTypeLabels, appointment.type)} · {labelFrom(modeLabels, appointment.mode)}
                              </CardDescription>
                            </div>
                            <Badge tone={statusTone(appointment.status)}>{labelFrom(appointmentStatusLabels, appointment.status)}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3 text-sm leading-6 text-kmt-muted sm:grid-cols-2">
                            <p>
                              العميل: <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/clients/${appointment.client.id}`}>{appointment.client.fullName}</Link>
                            </p>
                            <p>المحامي: {appointment.lawyer?.name ?? "غير معين"}</p>
                            <p>
                              القضية:{" "}
                              {appointment.case ? (
                                <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/cases/${appointment.case.id}`}>
                                  {appointment.case.internalFileNumber}
                                </Link>
                              ) : (
                                "غير مرتبطة"
                              )}
                            </p>
                            <p>المكان: {appointment.location ?? "غير محدد"}</p>
                          </div>
                          {canManageCalendarAppointment(guard.context.principal, appointment) ? (
                            <AppointmentRescheduleForm
                              appointmentId={appointment.id}
                              location={appointment.location}
                              mode={appointment.mode}
                              startsAt={appointment.startsAt}
                              status={appointment.status}
                            />
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <StateBlock
              title="لا توجد مواعيد في هذه الفترة"
              description="غيّر الفلاتر أو أنشئ موعدًا جديدًا مرتبطًا بقضية مفتوحة داخل نطاقك."
              action={
                <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={calendarHref({})}>
                  عرض الفترة الافتراضية
                </Link>
              }
            />
          )}
        </div>

        <div className="space-y-4">
          <CalendarAppointmentForm cases={caseOptions} defaultCaseId={defaultCaseId} />
          <StateBlock
            title="حدود التقويم"
            description="التقويم هنا يغطي مواعيد القضايا والجلسات فقط. التذكيرات المتقدمة وإشعارات التقويم الخارجية مؤجلة لخطط لاحقة."
          />
        </div>
      </div>
    </DashboardShell>
  );
}
