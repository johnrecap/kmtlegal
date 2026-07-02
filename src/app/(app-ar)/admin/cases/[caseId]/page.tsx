import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, MetricCard, StateBlock } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  appointmentStatusLabels,
  appointmentTypeLabels,
  caseStatusLabels,
  documentCategoryLabels,
  documentStatusLabels,
  documentVisibilityLabels,
  formatDateTime,
  labelFrom,
  modeLabels,
  partyTypeLabels,
  priorityLabels,
  taskPriorityLabels,
  taskStatusLabels
} from "@/lib/legal-format";
import { AppointmentRescheduleForm, CaseSessionForm, CaseStatusForm } from "@/features/admin/cases/case-action-forms";
import {
  AdminDocumentUploadForm,
  DocumentActionForm,
  DocumentDeleteForm,
  TaskCreateForm,
  TaskUpdateForm
} from "@/features/admin/task-documents/task-document-forms";
import { getAdminCaseDetail } from "@/server/admin/case-operations-service";
import { getAdminDocumentOptions, getCaseTaskDocumentTabs } from "@/server/admin/task-document-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { ApiError } from "@/server/http/errors";
import { adminNavForPath } from "../../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل القضية | KMT Legal"
};

type PageProps = {
  params: Promise<{
    caseId: string;
  }>;
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

type CaseDetail = Awaited<ReturnType<typeof getAdminCaseDetail>>;
type CaseTaskDocumentTabs = Awaited<ReturnType<typeof getCaseTaskDocumentTabs>>;
type DocumentOptions = Awaited<ReturnType<typeof getAdminDocumentOptions>>;

const tabs = [
  { value: "overview", label: "نظرة عامة" },
  { value: "sessions", label: "الجلسات" },
  { value: "appointments", label: "المواعيد" },
  { value: "tasks", label: "المهام" },
  { value: "documents", label: "المستندات" }
];

function activeTab(value?: string | string[]) {
  const tab = Array.isArray(value) ? value[0] : value;
  return tabs.some((item) => item.value === tab) ? tab ?? "overview" : "overview";
}

function tabHref(caseId: string, tab: string) {
  return tab === "overview" ? `/admin/cases/${caseId}` : `/admin/cases/${caseId}?tab=${tab}`;
}

function statusTone(status: string) {
  if (status === "ACTIVE") {
    return "active" as const;
  }
  if (status === "NEW" || status === "UNDER_REVIEW" || status === "AWAITING_JUDGMENT") {
    return "pending" as const;
  }
  return status === "ARCHIVED" || status === "CLOSED" ? ("closed" as const) : ("neutral" as const);
}

function taskStatusTone(status: string) {
  if (status === "COMPLETED") {
    return "active" as const;
  }
  if (status === "ARCHIVED") {
    return "closed" as const;
  }
  if (status === "OVERDUE") {
    return "danger" as const;
  }
  return "pending" as const;
}

function documentStatusTone(status: string) {
  if (status === "ACCEPTED") {
    return "active" as const;
  }
  if (status === "REJECTED" || status === "DELETED") {
    return "danger" as const;
  }
  return "pending" as const;
}

function documentVisibilityTone(visibility: string) {
  return visibility === "CLIENT_VISIBLE" ? ("active" as const) : ("neutral" as const);
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (value >= 1024) {
    return `${Math.ceil(value / 1024)} KB`;
  }
  return `${value} B`;
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-kmt-muted">{label}</p>
      <div className="mt-1 text-sm leading-6 text-kmt-ink">{value || "غير محدد"}</div>
    </div>
  );
}

function CaseTabs({ caseId, active }: { caseId: string; active: string }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-kmt-border" aria-label="تبويبات ملف القضية">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          className={cn(
            "mb-[-1px] inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
            active === tab.value ? "border-kmt-gold text-kmt-ink" : "border-transparent text-kmt-muted hover:text-kmt-ink"
          )}
          href={tabHref(caseId, tab.value)}
          aria-current={active === tab.value ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function OverviewTab({ legalCase }: { legalCase: CaseDetail }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>بيانات القضية</CardTitle>
          <CardDescription>بيانات تشغيلية للقضية مع تبويبات منفصلة للجلسات والمواعيد والمهام والمستندات.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="رقم الملف الداخلي" value={legalCase.internalFileNumber} />
            <DetailItem label="نوع القضية" value={legalCase.caseType} />
            <DetailItem label="الحالة" value={<Badge tone={statusTone(legalCase.status)}>{labelFrom(caseStatusLabels, legalCase.status)}</Badge>} />
            <DetailItem label="الأولوية" value={<Badge tone={legalCase.priority === "URGENT" || legalCase.priority === "HIGH" ? "pending" : "neutral"}>{labelFrom(priorityLabels, legalCase.priority)}</Badge>} />
            <DetailItem label="المحكمة" value={legalCase.courtName} />
            <DetailItem label="رقم القضية الخارجي" value={legalCase.externalCaseNumber} />
            <DetailItem label="العميل" value={<Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/clients/${legalCase.client.id}`}>{legalCase.client.fullName}</Link>} />
            <DetailItem label="المحامي المسؤول" value={legalCase.assignedLawyer.name} />
            <DetailItem label="الجلسة القادمة" value={formatDateTime(legalCase.nextSessionAt)} />
          </div>
          {legalCase.summary ? (
            <div className="mt-5 rounded border border-kmt-border bg-slate-50 p-4">
              <p className="text-xs font-semibold text-kmt-muted">ملخص القضية</p>
              <p className="mt-2 text-sm leading-7 text-kmt-ink">{legalCase.summary}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الأطراف</CardTitle>
          <CardDescription>أطراف القضية المسجلة من التحويل أو الإدخال السابق.</CardDescription>
        </CardHeader>
        <CardContent>
          {legalCase.parties.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {legalCase.parties.map((party) => (
                <div key={party.id} className="rounded border border-kmt-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-kmt-ink">{party.name}</p>
                    <Badge>{labelFrom(partyTypeLabels, party.partyType)}</Badge>
                  </div>
                  {party.notes ? <p className="mt-2 text-sm leading-6 text-kmt-muted">{party.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <StateBlock title="لا توجد أطراف مسجلة" description="إدارة أطراف القضية التفصيلية يمكن توسيعها في خطط لاحقة." />
          )}
        </CardContent>
      </Card>

      <StateBlock
        title="ما الذي لم يتم تضمينه هنا؟"
        description="الفواتير والمدفوعات تأتي في PLAN-19. المهام والمستندات الداخلية أصبحت تبويبات فعالة داخل ملف القضية."
      />
    </div>
  );
}

function SessionsTab({ legalCase }: { legalCase: CaseDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل الجلسات</CardTitle>
        <CardDescription>قرارات الجلسات والإجراءات القادمة مرتبطة بالقضية وتظهر بترتيب الأحدث أولاً.</CardDescription>
      </CardHeader>
      <CardContent>
        {legalCase.sessions.length ? (
          <div className="space-y-3">
            {legalCase.sessions.map((session) => (
              <div key={session.id} className="rounded border border-kmt-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-kmt-ink">{formatDateTime(session.sessionDate)}</p>
                    <p className="mt-1 text-sm text-kmt-muted">{session.courtName ?? legalCase.courtName ?? "غير محدد"} · بواسطة {session.createdBy.name}</p>
                  </div>
                  {session.nextSessionDate ? <Badge tone="pending">جلسة قادمة: {formatDateTime(session.nextSessionDate)}</Badge> : null}
                </div>
                {session.decision ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-kmt-muted">القرار</p>
                    <p className="mt-1 text-sm leading-7 text-kmt-ink">{session.decision}</p>
                  </div>
                ) : null}
                {session.nextAction ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-kmt-muted">الإجراء القادم</p>
                    <p className="mt-1 text-sm leading-7 text-kmt-ink">{session.nextAction}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <StateBlock title="لا توجد جلسات بعد" description="استخدم نموذج إضافة جلسة لتسجيل أول جلسة أو إجراء مرتبط بالقضية." />
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentsTab({ legalCase }: { legalCase: CaseDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>مواعيد القضية</CardTitle>
        <CardDescription>المواعيد المرتبطة بهذه القضية. يمكن إعادة جدولة الموعد من هنا أو من شاشة التقويم.</CardDescription>
      </CardHeader>
      <CardContent>
        {legalCase.appointments.length ? (
          <div className="space-y-4">
            {legalCase.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded border border-kmt-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-kmt-ink">{appointment.title}</p>
                    <p className="mt-1 text-sm text-kmt-muted">
                      {formatDateTime(appointment.startsAt)} · {labelFrom(appointmentTypeLabels, appointment.type)} · {labelFrom(modeLabels, appointment.mode)}
                    </p>
                    {appointment.location ? <p className="mt-1 text-sm text-kmt-muted">{appointment.location}</p> : null}
                  </div>
                  <Badge tone={appointment.status === "COMPLETED" ? "active" : appointment.status === "CANCELLED" ? "closed" : "pending"}>
                    {labelFrom(appointmentStatusLabels, appointment.status)}
                  </Badge>
                </div>
                {legalCase.access.canManageSessions ? (
                  <AppointmentRescheduleForm
                    appointmentId={appointment.id}
                    location={appointment.location}
                    mode={appointment.mode}
                    startsAt={appointment.startsAt}
                    status={appointment.status}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <StateBlock title="لا توجد مواعيد مرتبطة" description="يمكن إنشاء موعد مرتبط بالقضية من شاشة التقويم." />
        )}
      </CardContent>
    </Card>
  );
}

function TasksTab({ data }: { data: CaseTaskDocumentTabs }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>مهام القضية</CardTitle>
          <CardDescription>تكليفات داخلية مرتبطة بهذا الملف مع حالة وأولوية ومسؤول وتاريخ استحقاق.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.tasks.length ? (
            <div className="space-y-3">
              {data.tasks.map((task) => (
                <article key={task.id} className="rounded border border-kmt-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-kmt-ink">{task.title}</p>
                      <p className="mt-1 text-sm text-kmt-muted">
                        {task.assignedTo.name} · {formatDateTime(task.dueDate)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={taskStatusTone(task.status)}>{labelFrom(taskStatusLabels, task.status)}</Badge>
                      <Badge tone={task.priority === "URGENT" || task.priority === "HIGH" ? "pending" : "neutral"}>
                        {labelFrom(taskPriorityLabels, task.priority)}
                      </Badge>
                    </div>
                  </div>
                  {task.description ? <p className="mt-3 text-sm leading-7 text-kmt-muted">{task.description}</p> : null}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-kmt-navy">تعديل المهمة</summary>
                    <TaskUpdateForm
                      assignees={data.options.assignees}
                      cases={data.options.cases}
                      task={{
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        assignedToId: task.assignedToId,
                        caseId: task.caseId,
                        dueDate: task.dueDate
                      }}
                    />
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <StateBlock title="لا توجد مهام مرتبطة" description="أنشئ مهمة من النموذج الجانبي لتظهر داخل ملف القضية وصفحة المهام العامة." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مهمة جديدة</CardTitle>
          <CardDescription>المهمة سترتبط تلقائيًا بهذه القضية مع تسجيل audit لكل إنشاء أو تعديل.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.access.canCreateTask ? (
            <TaskCreateForm assignees={data.options.assignees} cases={data.options.cases} defaultCaseId={data.caseId} />
          ) : (
            <StateBlock tone="permission" title="إنشاء المهام غير متاح" description="حسابك يمكنه قراءة المهام داخل نطاقه فقط." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsTab({ data, documentOptions }: { data: CaseTaskDocumentTabs; documentOptions: DocumentOptions }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardHeader>
          <CardTitle>مستندات القضية</CardTitle>
          <CardDescription>كل تنزيل يمر عبر الخادم بعد فحص الصلاحيات، وكل تغيير يسجل في audit log.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.documents.length ? (
            <div className="space-y-3">
              {data.documents.map((document) => (
                <details key={document.id} className="rounded border border-kmt-border p-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link className="font-semibold text-kmt-navy hover:underline" href={`/api/files/${document.id}/download`}>
                          {document.fileName}
                        </Link>
                        <p className="mt-1 text-sm text-kmt-muted">
                          {formatBytes(document.fileSize)} · {labelFrom(documentCategoryLabels, document.category)} · {document.uploadedBy.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={documentStatusTone(document.status)}>{labelFrom(documentStatusLabels, document.status)}</Badge>
                        <Badge tone={documentVisibilityTone(document.visibility)}>
                          {labelFrom(documentVisibilityLabels, document.visibility)}
                        </Badge>
                      </div>
                    </div>
                  </summary>
                  <DocumentActionForm
                    canManage={data.access.canManageDocuments}
                    document={{
                      id: document.id,
                      status: document.status,
                      category: document.category,
                      visibility: document.visibility
                    }}
                  />
                  <DocumentDeleteForm canManage={data.access.canManageDocuments} documentId={document.id} />
                </details>
              ))}
            </div>
          ) : (
            <StateBlock title="لا توجد مستندات مرتبطة" description="ارفع مستندًا من النموذج الجانبي أو استخدم صفحة مستندات المكتب." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>رفع مستند</CardTitle>
          <CardDescription>الملف سيرتبط تلقائيًا بهذه القضية. الحد الأقصى 5MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminDocumentUploadForm
            canManage={data.access.canManageDocuments}
            cases={documentOptions.cases}
            clients={documentOptions.clients}
            defaultCaseId={data.caseId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AdminCaseDetailPage({ params, searchParams }: PageProps) {
  const { caseId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const guard = await requireAdminPage(`/admin/cases/${caseId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  let legalCase: CaseDetail;
  try {
    legalCase = await getAdminCaseDetail({
      actor: guard.context.principal,
      caseId
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return <PermissionBlocked title="غير مسموح بفتح ملف القضية" description="هذه القضية خارج نطاق صلاحيات حسابك." />;
    }
    throw error;
  }

  const tab = activeTab(resolvedSearchParams.tab);
  let taskDocumentData: CaseTaskDocumentTabs | null = null;
  let documentOptions: DocumentOptions | null = null;

  if (tab === "tasks" || tab === "documents") {
    try {
      if (tab === "documents") {
        [taskDocumentData, documentOptions] = await Promise.all([
          getCaseTaskDocumentTabs({ actor: guard.context.principal, caseId }),
          getAdminDocumentOptions(guard.context.principal)
        ]);
      } else {
        taskDocumentData = await getCaseTaskDocumentTabs({ actor: guard.context.principal, caseId });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        return (
          <PermissionBlocked
            title="غير مسموح بفتح تبويب التشغيل"
            description="هذا التبويب يحتاج صلاحية قراءة المهام أو المستندات داخل نطاق حسابك."
          />
        );
      }
      throw error;
    }
  }

  return (
    <DashboardShell
      eyebrow="إدارة القضايا"
      mode="admin"
      navItems={adminNavForPath("/admin/cases")}
      title={legalCase.internalFileNumber}
      userLabel={guard.context.user.name}
      action={
        <ButtonLink href="/admin/cases" size="sm" variant="secondary">
          رجوع للقضايا
        </ButtonLink>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{legalCase.title}</CardTitle>
                  <CardDescription>
                    {legalCase.client.fullName} · {legalCase.assignedLawyer.name} · {formatDateTime(legalCase.updatedAt)}
                  </CardDescription>
                </div>
                <Badge tone={statusTone(legalCase.status)}>{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="الجلسات" value={String(legalCase._count.sessions)} meta="سجل جلسات القضية." />
            <MetricCard label="المواعيد" value={String(legalCase._count.appointments)} meta="مواعيد مرتبطة بالقضية." />
            <MetricCard label="المهام" value={String(legalCase._count.tasks)} meta="مهام داخلية مرتبطة بالقضية." />
            <MetricCard label="المستندات" value={String(legalCase._count.documents)} meta="مستندات مرتبطة بالقضية." />
          </div>

          <CaseTabs active={tab} caseId={legalCase.id} />

          {tab === "overview" ? <OverviewTab legalCase={legalCase} /> : null}
          {tab === "sessions" ? <SessionsTab legalCase={legalCase} /> : null}
          {tab === "appointments" ? <AppointmentsTab legalCase={legalCase} /> : null}
          {tab === "tasks" && taskDocumentData ? <TasksTab data={taskDocumentData} /> : null}
          {tab === "documents" && taskDocumentData && documentOptions ? (
            <DocumentsTab data={taskDocumentData} documentOptions={documentOptions} />
          ) : null}
        </div>

        <div className="space-y-4">
          <CaseStatusForm caseId={legalCase.id} canUpdate={legalCase.access.canUpdate} currentStatus={legalCase.status} />
          <CaseSessionForm caseId={legalCase.id} canManage={legalCase.access.canManageSessions} defaultCourtName={legalCase.courtName} />
          <Card>
            <CardHeader>
              <CardTitle>التقويم</CardTitle>
              <CardDescription>لإنشاء موعد جديد مرتبط بالقضية استخدم شاشة التقويم.</CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink href={`/admin/calendar?caseId=${legalCase.id}`} variant="secondary">
                فتح التقويم
              </ButtonLink>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
