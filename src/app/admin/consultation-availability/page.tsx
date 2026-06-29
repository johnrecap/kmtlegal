import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { StateBlock } from "@/components/ui";
import { ConsultationAvailabilityForm } from "@/features/admin/consultations/consultation-availability-form";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import {
  canManageConsultationAvailability,
  getAdminConsultationAvailability
} from "@/server/consultations/consultation-availability-service";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Consultation Availability | KMT Legal",
  description: "Manage weekly consultation booking availability for the public booking assistant."
};

export default async function AdminConsultationAvailabilityPage() {
  const guard = await requireAdminPage("/admin/consultation-availability");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canManageConsultationAvailability(guard.context.principal)) {
    return (
      <PermissionBlocked
        title="غير مسموح بإدارة مواعيد الاستشارات"
        description="هذه الشاشة تحتاج صلاحية إدارة مواعيد المكتب حتى يتم ضبط أوقات الحجز العامة."
      />
    );
  }

  const result = await getAdminConsultationAvailability({ actor: guard.context.principal });

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/consultation-availability")}
      title="أوقات حجز الاستشارات"
      userLabel={guard.context.user.name}
    >
      <div className="space-y-5">
        <StateBlock
          title="هذه الأوقات هي التي تظهر داخل شات الحجز العام"
          description="العميل يختار الموعد من داخل المحادثة فقط. عند اكتمال الحجز يصل الطلب إلى مراجعة الاستشارات بدون محام معين، ثم تعين السكرتيرة المحامي من شاشة الطلب."
        />
        <ConsultationAvailabilityForm initialValue={result.value} />
      </div>
    </DashboardShell>
  );
}
