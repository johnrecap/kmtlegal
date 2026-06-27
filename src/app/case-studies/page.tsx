import { CaseStudiesPageView, caseStudiesMetadata } from "@/features/public-site/public-pages";

export const metadata = caseStudiesMetadata("en");
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CaseStudiesPage() {
  return <CaseStudiesPageView locale="en" />;
}
