import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل القضية | KMT Legal"
};

type PageProps = {
  params: {
    caseId: string;
  };
};

export default function PortalCaseDetailPage({ params }: PageProps) {
  redirect(`/client/cases/${params.caseId}`);
}
