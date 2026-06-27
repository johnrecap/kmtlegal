import type { Metadata } from "next";
import { CaseStudyDetailPageView, caseStudyDetailMetadata } from "@/features/public-site/public-pages";

type CaseStudyDetailPageProps = { params: { slug: string } };

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function generateMetadata({ params }: CaseStudyDetailPageProps): Promise<Metadata> {
  return caseStudyDetailMetadata("en", params.slug);
}

export default async function CaseStudyDetailPage({ params }: CaseStudyDetailPageProps) {
  return <CaseStudyDetailPageView locale="en" slug={params.slug} />;
}
