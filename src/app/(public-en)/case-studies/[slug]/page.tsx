import type { Metadata } from "next";
import { CaseStudyDetailPageView, caseStudyDetailMetadata } from "@/features/public-site/public-pages";

type CaseStudyDetailPageProps = { params: Promise<{ slug: string }> };

export const revalidate = 900;

export async function generateMetadata({ params }: CaseStudyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return caseStudyDetailMetadata("en", slug);
}

export default async function CaseStudyDetailPage({ params }: CaseStudyDetailPageProps) {
  const { slug } = await params;
  return <CaseStudyDetailPageView locale="en" slug={slug} />;
}
