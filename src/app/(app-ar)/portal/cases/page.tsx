import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "قضاياي | KMT Legal"
};

export default function PortalCasesPage() {
  redirect("/client/cases");
}
