import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "بوابة العميل | KMT Legal",
  description: "مدخل محمي لعملاء KMT Legal."
};

export default function PortalHomePage() {
  redirect("/client");
}
