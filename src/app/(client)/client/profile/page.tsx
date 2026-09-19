import { ClientPortalDetailItem, ClientPortalPanel, ClientSiteShell } from "@/components/layout";
import { ClientMobileAccordion } from "@/features/client/client-mobile-accordion";
import { ProfileForm } from "@/features/portal/profile-form";
import { formatDateTime } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { getPortalProfile } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";
import { getClientContent, normalizeClientLocale } from "@/content/client-content";
import { clientPageMetadata } from "@/server/auth/client-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return clientPageMetadata("profileTitle");
}

export default async function ClientProfilePage() {
  const guard = await requirePortalPage("/client/profile");
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = getClientContent(locale);
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  }

  const profile = await getPortalProfile(guard.context.principal);

  return (
    <ClientSiteShell locale={locale} navItems={clientNavForPath("/client/profile", locale)} title={copy.profile.title} userLabel={guard.context.user.name}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ProfileForm
          locale={locale}
          profile={{
            fullName: profile.fullName,
            phone: profile.phone,
            email: profile.email,
            city: profile.city
          }}
        />
        <ClientPortalPanel className="hidden lg:block" description={copy.profile.accountDescription} title={copy.profile.accountTitle}>
          <div className="space-y-4 text-sm">
            <ClientPortalDetailItem label={copy.profile.loginEmail} value={profile.user?.email ?? copy.common.unknown} />
            <ClientPortalDetailItem label={copy.profile.responsibleLawyer} value={profile.assignedLawyer?.name ?? copy.common.unassigned} />
            <ClientPortalDetailItem label={copy.profile.fileCreated} value={formatDateTime(profile.createdAt, locale)} />
          </div>
        </ClientPortalPanel>
        <ClientMobileAccordion
          description={copy.profile.accountDescription}
          testId="client-profile-account-accordion"
          title={copy.profile.accountTitle}
          value="account"
        >
          <div className="space-y-4 text-sm">
            <ClientPortalDetailItem label={copy.profile.loginEmail} value={profile.user?.email ?? copy.common.unknown} />
            <ClientPortalDetailItem label={copy.profile.responsibleLawyer} value={profile.assignedLawyer?.name ?? copy.common.unassigned} />
            <ClientPortalDetailItem label={copy.profile.fileCreated} value={formatDateTime(profile.createdAt, locale)} />
          </div>
        </ClientMobileAccordion>
      </div>
    </ClientSiteShell>
  );
}
