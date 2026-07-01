import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ملفاتي | KMT Legal"
};

export default function PortalDocumentsPage() {
  redirect("/client/files");
}
