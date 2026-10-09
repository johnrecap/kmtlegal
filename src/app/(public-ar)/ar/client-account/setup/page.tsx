import { getPublicContent } from "@/content/public-content";
import { ClientAccountSetupPage } from "@/features/public-site/client-account-setup-page";

export const dynamic = "force-dynamic";
export const metadata = {
  title: getPublicContent("ar").clientAccountSetup.metadataTitle,
  description: getPublicContent("ar").clientAccountSetup.description,
  robots: { index: false, follow: false }
};

export default function ArabicClientAccountSetupPage({
  searchParams
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  return <ClientAccountSetupPage locale="ar" searchParams={searchParams} />;
}
