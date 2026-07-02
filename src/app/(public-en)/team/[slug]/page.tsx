import type { Metadata } from "next";
import { TeamDetailPageView, publicLawyerStaticParams, teamDetailMetadata } from "@/features/public-site/public-pages";

type LawyerProfilePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publicLawyerStaticParams("en");
}

export async function generateMetadata({ params }: LawyerProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  return teamDetailMetadata("en", slug);
}

export default async function LawyerProfilePage({ params }: LawyerProfilePageProps) {
  const { slug } = await params;
  return <TeamDetailPageView locale="en" slug={slug} />;
}
