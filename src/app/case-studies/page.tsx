import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";
import { DirectoryFilter } from "@/features/public-site/directory-filter";
import { PageHero, PublicSection } from "@/features/public-site/public-components";
import { listPublishedCaseStudies } from "@/server/public/content-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "دراسات حالة مجهولة | KMT Legal",
  description: "دراسات حالة مجهولة ومبسطة بدون بيانات عملاء أو وعود بنتائج قانونية.",
  alternates: { canonical: "/case-studies" }
};

async function loadCaseStudies() {
  noStore();

  if (!shouldLoadDatabaseContent()) {
    return [];
  }

  try {
    return await listPublishedCaseStudies();
  } catch {
    return [];
  }
}

function shouldLoadDatabaseContent() {
  return Boolean(process.env.DATABASE_URL) || process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
}

export default async function CaseStudiesPage() {
  const caseStudies = await loadCaseStudies();

  return (
    <PublicShell navItems={navForPath("/case-studies")}>
      <PageHero
        eyebrow="دراسات حالة"
        image="/stitch-assets/2484f68d86633ca8.png"
        size="compact"
        title="ملفات مجهولة بدون كشف بيانات"
        description="اقرأ أمثلة مبسطة من واقع الملفات القانونية مع حماية أسماء العملاء والمستندات وأرقام القضايا."
      />
      <PublicSection eyebrow="دراسات حالة" title="تعلم من ملفات مجهولة" description="كل دراسة حالة منشورة هنا مجهولة ومبسطة، ولا تعرض بيانات عملاء أو مستندات أو أرقام قضايا.">
        <DirectoryFilter
          emptyTitle="لا توجد دراسات مطابقة"
          items={caseStudies.map((study) => ({
            title: study.title,
            description: study.summary,
            href: `/case-studies/${study.slug}`,
            category: study.category,
            categoryLabel: study.category,
            meta: "مجهولة"
          }))}
          searchLabel="ابحث في دراسات الحالة"
        />
      </PublicSection>
    </PublicShell>
  );
}
