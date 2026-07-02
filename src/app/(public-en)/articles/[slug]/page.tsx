import type { Metadata } from "next";
import { ArticleDetailPageView, articleDetailMetadata } from "@/features/public-site/public-pages";

type ArticleDetailPageProps = { params: Promise<{ slug: string }> };

export const revalidate = 900;

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return articleDetailMetadata("en", slug);
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  return <ArticleDetailPageView locale="en" slug={slug} />;
}
