import type { Metadata } from "next";
import { ArticleDetailPageView, articleDetailMetadata } from "@/features/public-site/public-pages";

type ArticleDetailPageProps = { params: { slug: string } };

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  return articleDetailMetadata("en", params.slug);
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  return <ArticleDetailPageView locale="en" slug={params.slug} />;
}
