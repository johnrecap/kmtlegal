import { redirect } from "next/navigation";
import { AdminPermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";

export default async function AdminContentCaseStudiesRedirect() {
  const guard = await requireAdminRoutePage("/admin/content/case-studies");
  if (guard.status === "forbidden") {
    return <AdminPermissionBlocked description={guard.description} title={guard.title} />;
  }
  redirect("/admin/content?tab=case-studies");
}
