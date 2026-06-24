import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { StateBlock } from "@/components/ui";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { portalNavForPath, portalSectionLabel } from "../portal-navigation";

export const metadata: Metadata = {
  title: "مسار بوابة عميل محمي | KMT Legal"
};

export default async function PortalSectionPlaceholderPage({ params }: { params: { section: string[] } }) {
  const pathname = `/portal/${params.section.join("/")}`;
  const guard = await requirePortalPage(pathname);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const sectionLabel = portalSectionLabel(params.section);

  return (
    <DashboardShell
      eyebrow="مسار بوابة محمي"
      mode="portal"
      navItems={portalNavForPath(pathname)}
      title={sectionLabel}
      userLabel={guard.context.user.name}
    >
      <StateBlock
        title={`${sectionLabel} ضمن خطة تنفيذ لاحقة`}
        description="هذا المسار محمي بالجلسة ونطاق الدور الآن. تنفيذ البيانات والتفاعلات الخاصة به سيتم داخل خطة الميزة المالكة له."
      />
    </DashboardShell>
  );
}
