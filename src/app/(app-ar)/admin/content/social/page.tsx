import { redirect } from "next/navigation";

export default function AdminContentSocialRedirect() {
  redirect("/admin/content?tab=social");
}
