import type { Metadata } from "next";
import { ClientSiteShell } from "@/components/layout";
import { ClientAssistantPanel } from "@/features/client/client-assistant-panel";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { clientNavForPath } from "../client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مساعد العميل | KMT Legal"
};

export default async function ClientAssistantPage() {
  const guard = await requirePortalPage("/client/assistant");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  return (
    <ClientSiteShell navItems={clientNavForPath("/client/assistant")} title="المساعد" userLabel={guard.context.user.name}>
      <ClientAssistantPanel />
    </ClientSiteShell>
  );
}
