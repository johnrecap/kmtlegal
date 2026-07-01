import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { StateBlock } from "@/components/ui";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath, adminSectionLabel } from "../admin-navigation";

export const metadata: Metadata = {
  title: "مسار إداري محمي | KMT Legal"
};

export default async function AdminSectionPlaceholderPage({ params }: { params: { section: string[] } }) {
  const pathname = `/admin/${params.section.join("/")}`;
  const guard = await requireAdminPage(pathname);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const sectionLabel = adminSectionLabel(params.section);

  return (
    <DashboardShell
      eyebrow="مسار إداري محمي"
      mode="admin"
      navItems={adminNavForPath(pathname)}
      title={sectionLabel}
      userLabel={guard.context.user.name}
    >
      <StateBlock
        title={`${sectionLabel} ضمن خطة تنفيذ لاحقة`}
        description="هذا المسار محمي بالجلسة والصلاحيات الآن. تنفيذ البيانات والإجراءات الخاصة به سيتم داخل خطة الميزة المالكة له."
      />
    </DashboardShell>
  );
}
