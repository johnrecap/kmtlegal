import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";
import { DirectoryFilter } from "@/features/public-site/directory-filter";
import { PageHero, PublicSection } from "@/features/public-site/public-components";
import { listPublishedArticles } from "@/server/public/content-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مقالات قانونية | KMT Legal",
  description: "مقالات توعوية تساعدك على تجهيز الأسئلة والمستندات قبل مراجعة المحامي.",
  alternates: { canonical: "/articles" }
};

async function loadArticles() {
  if (!shouldLoadDatabaseContent()) {
    return [];
  }

  try {
    return await listPublishedArticles();
  } catch {
    return [];
  }
}

function shouldLoadDatabaseContent() {
  return Boolean(process.env.DATABASE_URL) || process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
}

export default async function ArticlesPage() {
  const articles = await loadArticles();

  return (
    <PublicShell navItems={navForPath("/articles")}>
      <PageHero
        eyebrow="المقالات"
        image="/stitch-assets/b392b48a7cb6b561.png"
        size="compact"
        title="قراءة قانونية عملية"
        description="مقالات توعوية تساعدك على تجهيز أسئلتك ومستنداتك قبل التواصل مع المكتب."
      />
      <PublicSection eyebrow="المقالات" title="قراءة قانونية عملية" description="المحتوى توعوي ولا يمثل استشارة قانونية نهائية.">
        <DirectoryFilter
          emptyTitle="لا توجد مقالات مطابقة"
          items={articles.map((article) => ({
            title: article.title,
            description: article.excerpt,
            href: `/articles/${article.slug}`,
            category: article.category,
            categoryLabel: article.category,
            meta: article.readTime
          }))}
          searchLabel="ابحث في المقالات"
        />
      </PublicSection>
    </PublicShell>
  );
}
