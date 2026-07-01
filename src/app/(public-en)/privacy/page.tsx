import { PrivacyPageView, privacyMetadata } from "@/features/public-site/public-pages";

export const metadata = privacyMetadata("en");

export default function PrivacyPage() {
  return <PrivacyPageView locale="en" />;
}
