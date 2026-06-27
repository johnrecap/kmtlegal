import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink } from "@/components/ui";
import { navForPath } from "@/content/public-content";
import { DetailCta, PublicSection, publicMutedText, publicPanel } from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";
import { getPublishedArticleBySlug } from "@/server/public/content-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ArticleDetailPageProps = { params: { slug: string } };

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  noStore();
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} | KMT Legal`,
    description: article.excerpt,
    alternates: { canonical: `/articles/${article.slug}` }
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  noStore();
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <PublicShell navItems={navForPath("/articles")}>
      <PublicSection eyebrow={article.readTime} title={article.title} description={article.excerpt}>
        <article className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className={cn(publicPanel, "p-6")}>
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">{article.category}</Badge>
              <Badge className="border-white/15 bg-white/5 text-slate-200">{article.publishedAt}</Badge>
            </div>
            <p className="text-lg leading-9 text-white">{article.content}</p>
            <div className="mt-8 rounded-lg border border-amber-300/35 bg-amber-950/35 p-4 text-sm leading-7 text-amber-100">
              هذا المقال للتوعية العامة ولا يغني عن مراجعة محام بناء على الوقائع والمستندات.
            </div>
            <ButtonLink className="mt-6 !border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white" href="/articles" variant="secondary">
              العودة للمقالات
            </ButtonLink>
          </div>
          <DetailCta />
        </article>
      </PublicSection>
    </PublicShell>
  );
}
