import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "بوابة العميل | KMT Legal"
};

const portalRedirects: Record<string, string> = {
  appointments: "/client/court-dates",
  cases: "/client/cases",
  documents: "/client/files",
  payments: "/client/payments",
  profile: "/client/profile"
};

export default function PortalSectionRedirectPage({ params }: { params: { section: string[] } }) {
  const [section, id] = params.section;

  if (section === "cases" && id) {
    redirect(`/client/cases/${id}`);
  }

  redirect(portalRedirects[section] ?? "/client");
}
