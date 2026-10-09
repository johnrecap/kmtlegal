import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { StateBlock } from "@/components/ui";
import { ConsultationAvailabilityForm } from "@/features/admin/consultations/consultation-availability-form";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { getAdminConsultationAvailability } from "@/server/consultations/consultation-availability-service";
import { adminNavForPath } from "../admin-navigation";
import { prisma } from "@/server/db/prisma";
import { directBookingCopy } from "@/content/direct-booking-copy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "أوقات حجز الاستشارات | KMT Legal",
  description: "إدارة أوقات الحجز الأسبوعية التي تظهر في مساعد حجز الاستشارات."
};

export default async function AdminConsultationAvailabilityPage() {
  const guard = await requireAdminRoutePage("/admin/consultation-availability");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const result = await getAdminConsultationAvailability({ actor: guard.context.principal });
  const lawyers = await prisma.user.findMany({ where: { status: "ACTIVE", deletedAt: null, role: { name: "Lawyer", status: "ACTIVE" } }, select: { id: true, name: true }, orderBy: { name: "asc" } });

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/consultation-availability")}
      title="أوقات حجز الاستشارات"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="space-y-5">
        <StateBlock
          title="هذه الأوقات هي التي تظهر داخل شات الحجز العام"
          description={directBookingCopy.ar.adminNote}
        />
        <ConsultationAvailabilityForm initialValue={result.value} lawyers={lawyers} />
      </div>
    </DashboardShell>
  );
}
