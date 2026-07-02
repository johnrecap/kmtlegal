import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل القضية | KMT Legal"
};

type PageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function PortalCaseDetailPage({ params }: PageProps) {
  const { caseId } = await params;
  redirect(`/client/cases/${caseId}`);
}
