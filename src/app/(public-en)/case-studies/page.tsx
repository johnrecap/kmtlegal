import { CaseStudiesPageView, caseStudiesMetadata } from "@/features/public-site/public-pages";

export const metadata = caseStudiesMetadata("en");
export const revalidate = 900;

export default async function CaseStudiesPage() {
  return <CaseStudiesPageView locale="en" />;
}
