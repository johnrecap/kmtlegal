import type { Metadata } from "next";
import { TeamDetailPageView, publicLawyerStaticParams, teamDetailMetadata } from "@/features/public-site/public-pages";

type LawyerProfilePageProps = { params: { slug: string } };

export function generateStaticParams() {
  return publicLawyerStaticParams("en");
}

export function generateMetadata({ params }: LawyerProfilePageProps): Metadata {
  return teamDetailMetadata("en", params.slug);
}

export default function LawyerProfilePage({ params }: LawyerProfilePageProps) {
  return <TeamDetailPageView locale="en" slug={params.slug} />;
}
