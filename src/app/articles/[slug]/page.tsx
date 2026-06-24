import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink } from "@/components/ui";
import { navForPath } from "@/content/public-content";
import { DetailCta, PublicSection } from "@/features/public-site/public-components";
import { getPublishedArticleBySlug } from "@/server/public/content-service";

export const dynamic = "force-dynamic";

type ArticleDetailPageProps = { params: { slug: string } };

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} | KMT Legal`,
    description: article.excerpt,
    alternates: { canonical: `/articles/${article.slug}` }
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <PublicShell navItems={navForPath("/articles")}>
      <PublicSection eyebrow={article.readTime} title={article.title} description={article.excerpt}>
        <article className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-kmt-border bg-white p-6">
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge>{article.category}</Badge>
              <Badge>{article.publishedAt}</Badge>
            </div>
            <p className="text-lg leading-9 text-kmt-ink">{article.content}</p>
            <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              هذا المقال للتوعية العامة ولا يغني عن مراجعة محام بناءً على الوقائع والمستندات.
            </div>
            <ButtonLink className="mt-6" href="/articles" variant="secondary">
              العودة للمقالات
            </ButtonLink>
          </div>
          <DetailCta />
        </article>
      </PublicSection>
    </PublicShell>
  );
}
