import { redirect } from "next/navigation";
import { AdminPermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";

export default async function AdminContentSocialRedirect() {
  const guard = await requireAdminRoutePage("/admin/content/social");
  if (guard.status === "forbidden") {
    return <AdminPermissionBlocked description={guard.description} title={guard.title} />;
  }
  redirect("/admin/content?tab=social");
}
