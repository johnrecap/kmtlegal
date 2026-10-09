import { ClientSiteShell } from "@/components/layout";
import { ClientConversationWorkspace } from "@/features/client/client-conversation-workspace";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { clientNavForPath } from "../client-navigation";
import { getClientContent, normalizeClientLocale } from "@/content/client-content";
import { clientPageMetadata } from "@/server/auth/client-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return clientPageMetadata("assistantTitle");
}

export default async function ClientAssistantPage() {
  const guard = await requirePortalPage("/client/assistant");
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = getClientContent(locale);
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  }

  return (
    <ClientSiteShell locale={locale} navItems={clientNavForPath("/client/assistant", locale)} title={copy.assistant.pageTitle} userLabel={guard.context.user.name}>
      <ClientConversationWorkspace locale={locale} />
    </ClientSiteShell>
  );
}
