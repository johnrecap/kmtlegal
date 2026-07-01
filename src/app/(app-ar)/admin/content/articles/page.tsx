import { redirect } from "next/navigation";

export default function AdminContentArticlesRedirect() {
  redirect("/admin/content?tab=articles");
}
