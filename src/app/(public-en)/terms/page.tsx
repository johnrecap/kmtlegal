import { TermsPageView, termsMetadata } from "@/features/public-site/public-pages";

export const metadata = termsMetadata("en");

export default function TermsPage() {
  return <TermsPageView locale="en" />;
}
