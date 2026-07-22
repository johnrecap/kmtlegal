import { redirect } from "next/navigation";
import { AdminPermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";

export default async function AdminContentArticlesRedirect() {
  const guard = await requireAdminRoutePage("/admin/content/articles");
  if (guard.status === "forbidden") {
    return <AdminPermissionBlocked description={guard.description} title={guard.title} />;
  }
  redirect("/admin/content?tab=articles");
}
