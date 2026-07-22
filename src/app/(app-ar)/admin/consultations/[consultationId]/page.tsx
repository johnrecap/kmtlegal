import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { Badge, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, StateBlock } from "@/components/ui";
import { ConsultationActionPanel } from "@/features/admin/consultations/consultation-action-panel";
import { consultationServiceCategoryLabel, consultationStatusLabels, formatDateTime, labelFrom, modeLabels, urgencyLabels } from "@/lib/legal-format";
import { consultationOutcomeReasonLabel, plan36ConsultationOutcomeCopy } from "@/lib/ui-copy";
import { getAdminConsultationDetail, listAssignableLawyers } from "@/server/admin/consultation-review-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { publicConsultationReference } from "@/server/consultations/consultation-service";
import { adminNavForPath } from "../../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل الاستشارة | KMT Legal"
};

type PageProps = {
  params: Promise<{
    consultationId: string;
  }>;
};

function statusTone(status: string) {
  if (status === "CONVERTED") {
    return "active" as const;
  }
  if (status === "REJECTED") {
    return "danger" as const;
  }
  if (status === "REVIEWING" || status === "SCHEDULED") {
    return "pending" as const;
  }
  return "neutral" as const;
}

function outcomeTone(status: string) {
  if (status === "SUCCESSFUL") return "active" as const;
  if (status === "MISSED") return "danger" as const;
  if (status === "NO_SHOW" || status === "CANCELLED") return "closed" as const;
  if (status === "AWAITING_RESULT") return "pending" as const;
  return "neutral" as const;
}

const hiddenAiTextPatterns = [/mock/i, /placeholder/i, /structured intake/i, /draft only/i, /internal review/i, /review required/i, /not legal advice/i];
const genericBookingSummaryPatterns = [
  /collected through the public booking chat/i,
  /تم جمع طلب الاستشارة من شات الحجز العام/
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeAiText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  if (!text || hiddenAiTextPatterns.some((pattern) => pattern.test(text))) {
    return null;
  }

  return text;
}

function safeAiList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => safeAiText(item)).filter((item): item is string => Boolean(item));
}

function safeConfidence(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const percentage = value <= 1 ? value * 100 : value;
  return `${Math.round(percentage)}%`;
}

function AiClassificationSummary({ value }: { value: unknown }) {
  if (!value) {
    return <p className="text-sm text-kmt-muted">لا توجد نتيجة AI محفوظة لهذا الطلب.</p>;
  }

  if (!isRecord(value)) {
    return <StateBlock title="تصنيف يحتاج مراجعة" description="تم حفظ نتيجة غير منظمة من مزود AI، لذلك يتم عرضها كتصنيف مبدئي يحتاج مراجعة الفريق." />;
  }

  const category = safeAiText(value.category) ?? safeAiText(value.serviceCategory);
  const urgency = safeAiText(value.urgency);
  const preferredMode = safeAiText(value.preferredMode) ?? safeAiText(value.mode);
  const confidence = safeConfidence(value.confidence);
  const reasons = safeAiList(value.reasons);
  const notes = [
    safeAiText(value.reviewNote),
    safeAiText(value.intakeSummary),
    safeAiText(value.summary)
  ].filter((item): item is string => Boolean(item));
  const hasStructuredContent = Boolean(category || urgency || preferredMode || confidence || reasons.length || notes.length);

  if (!hasStructuredContent) {
    return <StateBlock title="تصنيف مبدئي يحتاج مراجعة" description="تم إخفاء نصوص AI القديمة أو التجريبية من الواجهة. راجع بيانات الطلب الأصلية قبل اتخاذ أي إجراء." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {category ? <DetailItem label="تصنيف AI مساعد" value={consultationServiceCategoryLabel(category)} /> : null}
        {urgency ? <DetailItem label="الأولوية المقترحة" value={labelFrom(urgencyLabels, urgency)} /> : null}
        {preferredMode ? <DetailItem label="طريقة التواصل" value={labelFrom(modeLabels, preferredMode)} /> : null}
        {confidence ? <DetailItem label="درجة الثقة" value={confidence} /> : null}
      </div>
      {reasons.length ? (
        <div>
          <p className="text-xs font-semibold text-kmt-muted">ملاحظات التصنيف</p>
          <ul className="mt-2 list-disc space-y-1 pr-5 text-sm leading-6 text-kmt-ink">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {notes.length ? (
        <div className="rounded border border-kmt-border bg-slate-50 px-3 py-2 text-sm leading-7 text-kmt-ink">
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-kmt-muted">{label}</p>
      <div className="mt-1 text-sm leading-6 text-kmt-ink">{value || "غير محدد"}</div>
    </div>
  );
}

function shouldReplaceGenericAiSummary(value?: string | null) {
  const text = value?.trim();
  return !text || genericBookingSummaryPatterns.some((pattern) => pattern.test(text));
}

function adminConsultationOfficeBrief(consultation: Awaited<ReturnType<typeof getAdminConsultationDetail>>) {
  if (!shouldReplaceGenericAiSummary(consultation.aiSummary)) {
    return consultation.aiSummary;
  }

  const consultationAppointment = consultation.appointments.find((appointment) => appointment.type === "CONSULTATION") ?? consultation.appointments[0];
  const contactParts = [
    `الهاتف: ${consultation.phone}`,
    consultation.email ? `البريد: ${consultation.email}` : "",
    consultation.city ? `المدينة: ${consultation.city}` : ""
  ].filter(Boolean);
  const appointmentText = consultationAppointment
    ? `${formatDateTime(consultationAppointment.startsAt)} - ${labelFrom(modeLabels, consultationAppointment.mode)}`
    : "لم يتم العثور على موعد مرتبط";

  return [
    `ملخص للفريق: ${consultation.fullName} طلب استشارة من خلال شات الحجز العام. التصنيف الداخلي المبدئي: ${consultationServiceCategoryLabel(consultation.serviceCategory)}.`,
    `طلب العميل كما وصل: ${consultation.summary}`,
    `بيانات التواصل: ${contactParts.join("، ")}.`,
    `التفضيلات: ${labelFrom(modeLabels, consultation.preferredMode)}، أولوية ${labelFrom(urgencyLabels, consultation.urgency)}، الموعد ${appointmentText}.`,
    "الإجراء المطلوب: مراجعة الطلب، تأكيد الملاءمة مع العميل، ثم تعيين محامي مناسب قبل أي إجراء أو توجيه قانوني."
  ].join("\n");
}

export default async function AdminConsultationDetailPage({ params }: PageProps) {
  const { consultationId } = await params;
  const guard = await requireAdminRoutePage(`/admin/consultations/${consultationId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const [consultation, lawyers] = await Promise.all([
    getAdminConsultationDetail({
      actor: guard.context.principal,
      consultationId
    }),
    listAssignableLawyers()
  ]);
  const officeAiSummary = adminConsultationOfficeBrief(consultation);

  return (
    <DashboardShell
      eyebrow="مراجعة الاستشارات"
      mode="admin"
      navItems={adminNavForPath("/admin/consultations")}
      title={consultation.fullName}
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      actionRouteId="consultations.list"
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
      action={
        <ButtonLink href="/admin/consultations" variant="secondary" size="sm">
          رجوع للقائمة
        </ButtonLink>
      }
    >
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{plan36ConsultationOutcomeCopy.detail.outcomeTitle}</CardTitle>
                  <CardDescription>{plan36ConsultationOutcomeCopy.detail.outcomeDescription}</CardDescription>
                </div>
                <Badge tone={outcomeTone(consultation.outcomeStatus)}>
                  {plan36ConsultationOutcomeCopy.statuses[consultation.outcomeStatus]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label={plan36ConsultationOutcomeCopy.detail.status}
                  value={plan36ConsultationOutcomeCopy.statuses[consultation.outcomeStatus]}
                />
                <DetailItem
                  label={plan36ConsultationOutcomeCopy.detail.changedAt}
                  value={consultation.outcomeAt ? formatDateTime(consultation.outcomeAt) : null}
                />
                <DetailItem
                  label={plan36ConsultationOutcomeCopy.detail.changedBy}
                  value={consultation.outcomeBy?.name ?? (consultation.outcomeAt ? plan36ConsultationOutcomeCopy.detail.systemActor : null)}
                />
                <DetailItem
                  label={plan36ConsultationOutcomeCopy.detail.reason}
                  value={consultationOutcomeReasonLabel(consultation.outcomeReasonCode)}
                />
                <DetailItem
                  label={plan36ConsultationOutcomeCopy.detail.version}
                  value={<span dir="ltr">{consultation.outcomeVersion}</span>}
                />
                <DetailItem
                  label={plan36ConsultationOutcomeCopy.detail.primaryStart}
                  value={consultation.primaryAppointment ? formatDateTime(consultation.primaryAppointment.startsAt) : null}
                />
                <DetailItem
                  label={plan36ConsultationOutcomeCopy.detail.primaryEnd}
                  value={consultation.primaryAppointment ? formatDateTime(consultation.primaryAppointment.endsAt) : null}
                />
              </div>
              {consultation.outcomeNote ? (
                <div className="mt-4 rounded border border-kmt-border bg-kmt-canvas p-3">
                  <p className="text-xs font-semibold text-kmt-muted">{plan36ConsultationOutcomeCopy.detail.note}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-kmt-ink">{consultation.outcomeNote}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>بيانات الطلب</CardTitle>
                  <CardDescription>كل بيانات الاستشارة كما وصلت من شات الحجز العام.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(consultation.status)}>{labelFrom(consultationStatusLabels, consultation.status)}</Badge>
                  <Badge tone={consultation.urgency === "URGENT" || consultation.urgency === "HIGH" ? "pending" : "neutral"}>
                    {labelFrom(urgencyLabels, consultation.urgency)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="الهاتف" value={consultation.phone} />
                <DetailItem label="البريد الإلكتروني" value={consultation.email} />
                <DetailItem label="المدينة" value={consultation.city} />
                <DetailItem label="تصنيف داخلي مبدئي" value={consultationServiceCategoryLabel(consultation.serviceCategory)} />
                <DetailItem label="طريقة التواصل" value={labelFrom(modeLabels, consultation.preferredMode)} />
                <DetailItem label="رقم المرجع" value={<span dir="ltr">{publicConsultationReference(consultation.id)}</span>} />
                <DetailItem label="تاريخ الطلب" value={formatDateTime(consultation.createdAt)} />
                <DetailItem label="المحامي المسؤول" value={consultation.assignedLawyer?.name} />
                <DetailItem label="العميل المرتبط" value={consultation.client?.fullName} />
                <DetailItem
                  label="مراجعة السكرتيرة"
                  value={
                    consultation.secretaryReviewedAt
                      ? `${formatDateTime(consultation.secretaryReviewedAt)}${consultation.secretaryReviewedBy?.name ? ` - ${consultation.secretaryReviewedBy.name}` : ""}`
                      : "لم تتم المراجعة بعد"
                  }
                />
                <DetailItem
                  label="القضية المحولة"
                  value={
                    consultation.convertedCase ? (
                      <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/cases/${consultation.convertedCase.id}`}>
                        {consultation.convertedCase.internalFileNumber}
                      </Link>
                    ) : null
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>نص طلب العميل كما وصل</CardTitle>
              <CardDescription>هذا هو النص الذي كتبه العميل في الشات، والسكرتيرة تستخدمه لتحديد المجال الداخلي والمحامي المسؤول.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-kmt-ink">{consultation.summary}</p>
              {consultation.opposingPartyName ? (
                <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  الطرف المقابل: {consultation.opposingPartyName}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ملخص AI للفريق</CardTitle>
              <CardDescription>سياق تنظيمي مستخرج من شات الحجز ليساعد السكرتيرة والفريق على مراجعة الطلب وتعيين المحامي المناسب.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 whitespace-pre-wrap text-sm leading-7 text-kmt-ink">{officeAiSummary}</p>
              <AiClassificationSummary value={consultation.aiClassification} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المواعيد المرتبطة</CardTitle>
            </CardHeader>
            <CardContent>
              {consultation.appointments.length ? (
                <div className="space-y-3">
                  {consultation.appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded border border-kmt-border p-3">
                      <p className="font-semibold text-kmt-ink">{appointment.title}</p>
                      <p className="mt-1 text-sm text-kmt-muted">
                        {formatDateTime(appointment.startsAt)} - {labelFrom(modeLabels, appointment.mode)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد مواعيد" description="يمكن إنشاء موعد متابعة أثناء تحويل الاستشارة إلى قضية." />
              )}
            </CardContent>
          </Card>
        </div>

        <ConsultationActionPanel
          consultationId={consultation.id}
          status={consultation.status}
          assignedLawyerId={consultation.assignedLawyerId}
          secretaryReviewedAt={consultation.secretaryReviewedAt?.toISOString() ?? null}
          secretaryReviewedByName={consultation.secretaryReviewedBy?.name ?? null}
          secretaryReviewNote={consultation.secretaryReviewNote}
          outcomeStatus={consultation.outcomeStatus}
          outcomeVersion={consultation.outcomeVersion}
          canAssign={consultation.canAssign}
          canManageOutcome={consultation.canManageOutcome}
          canReopen={consultation.canReopen}
          lawyers={lawyers}
        />
      </div>
    </DashboardShell>
  );
}
