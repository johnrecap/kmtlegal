import { redirect } from "next/navigation";

export default function AdminContentCaseStudiesRedirect() {
  redirect("/admin/content?tab=case-studies");
}
