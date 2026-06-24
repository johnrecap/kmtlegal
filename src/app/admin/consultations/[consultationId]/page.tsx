import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, StateBlock } from "@/components/ui";
import { ConsultationActionPanel } from "@/features/admin/consultations/consultation-action-panel";
import { consultationStatusLabels, formatDateTime, labelFrom, modeLabels, urgencyLabels } from "@/lib/legal-format";
import { getAdminConsultationDetail, listAssignableLawyers } from "@/server/admin/consultation-review-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل الاستشارة | KMT Legal"
};

type PageProps = {
  params: {
    consultationId: string;
  };
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

function JsonSummary({ value }: { value: unknown }) {
  if (!value) {
    return <p className="text-sm text-kmt-muted">لا توجد نتيجة AI محفوظة لهذا الطلب.</p>;
  }

  return (
    <pre className="max-h-80 overflow-auto rounded border border-kmt-border bg-slate-50 p-3 text-xs leading-6 text-kmt-ink">
      {JSON.stringify(value, null, 2)}
    </pre>
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

export default async function AdminConsultationDetailPage({ params }: PageProps) {
  const guard = await requireAdminPage(`/admin/consultations/${params.consultationId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const [consultation, lawyers] = await Promise.all([
    getAdminConsultationDetail({
      actor: guard.context.principal,
      consultationId: params.consultationId
    }),
    listAssignableLawyers()
  ]);

  return (
    <DashboardShell
      eyebrow="مراجعة الاستشارات"
      mode="admin"
      navItems={adminNavForPath("/admin/consultations")}
      title={consultation.fullName}
      userLabel={guard.context.user.name}
      action={
        <ButtonLink href="/admin/consultations" variant="secondary" size="sm">
          رجوع للقائمة
        </ButtonLink>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>بيانات الطلب</CardTitle>
                  <CardDescription>كل بيانات الاستشارة كما وصلت من نموذج الحجز العام.</CardDescription>
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
                <DetailItem label="نوع الخدمة" value={consultation.serviceCategory} />
                <DetailItem label="طريقة التواصل" value={labelFrom(modeLabels, consultation.preferredMode)} />
                <DetailItem label="تاريخ الطلب" value={formatDateTime(consultation.createdAt)} />
                <DetailItem label="المحامي المسؤول" value={consultation.assignedLawyer?.name} />
                <DetailItem label="العميل المرتبط" value={consultation.client?.fullName} />
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
              <CardTitle>ملخص العميل</CardTitle>
              <CardDescription>لا يتم عرض هذا النص للعميل تلقائياً؛ هو مخصص للمراجعة الداخلية قبل التحويل.</CardDescription>
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
              <CardTitle>نتيجة AI المنظمة</CardTitle>
              <CardDescription>نتيجة إرشادية للمكتب فقط وتحتاج مراجعة بشرية قبل أي إجراء قانوني.</CardDescription>
            </CardHeader>
            <CardContent>
              {consultation.aiSummary ? <p className="mb-4 text-sm leading-7 text-kmt-ink">{consultation.aiSummary}</p> : null}
              <JsonSummary value={consultation.aiClassification} />
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
          lawyers={lawyers}
        />
      </div>
    </DashboardShell>
  );
}
