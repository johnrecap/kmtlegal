import type { Metadata } from "next";
import { ArticleDetailPageView, articleDetailMetadata } from "@/features/public-site/public-pages";

type ArticleDetailPageProps = { params: { slug: string } };

export const revalidate = 900;

export function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  return articleDetailMetadata("en", params.slug);
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  return <ArticleDetailPageView locale="en" slug={params.slug} />;
}
