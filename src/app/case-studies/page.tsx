import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";
import { DirectoryFilter } from "@/features/public-site/directory-filter";
import { PublicSection } from "@/features/public-site/public-components";
import { listPublishedCaseStudies } from "@/server/public/content-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "دراسات حالة مجهولة | KMT Legal",
  description: "دراسات حالة مجهولة ومبسطة بدون بيانات عملاء أو وعود بنتائج قانونية.",
  alternates: { canonical: "/case-studies" }
};

export default async function CaseStudiesPage() {
  const caseStudies = await listPublishedCaseStudies();

  return (
    <PublicShell navItems={navForPath("/case-studies")}>
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
