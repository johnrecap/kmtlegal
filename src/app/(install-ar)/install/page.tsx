import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstallWizard } from "@/features/install/install-wizard";
import { isInstallerEnabled } from "@/server/install/installer-env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Install KMT Legal",
  description: "One-time VPS installer for KMT Legal."
};

type InstallPageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InstallPage({ searchParams }: InstallPageProps) {
  if (!isInstallerEnabled()) {
    notFound();
  }

  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <main className="min-h-screen bg-kmt-canvas">
      <InstallWizard initialToken={firstSearchParam(resolvedSearchParams.token) ?? ""} />
    </main>
  );
}
