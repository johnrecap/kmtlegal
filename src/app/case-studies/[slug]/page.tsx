import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink } from "@/components/ui";
import { navForPath } from "@/content/public-content";
import { DetailCta, PublicSection } from "@/features/public-site/public-components";
import { getPublishedCaseStudyBySlug } from "@/server/public/content-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type CaseStudyDetailPageProps = { params: { slug: string } };

export async function generateMetadata({ params }: CaseStudyDetailPageProps): Promise<Metadata> {
  noStore();
  const study = await getPublishedCaseStudyBySlug(params.slug);
  if (!study) return {};
  return {
    title: `${study.title} | KMT Legal`,
    description: study.summary,
    alternates: { canonical: `/case-studies/${study.slug}` }
  };
}

export default async function CaseStudyDetailPage({ params }: CaseStudyDetailPageProps) {
  noStore();
  const study = await getPublishedCaseStudyBySlug(params.slug);
  if (!study) notFound();

  return (
    <PublicShell navItems={navForPath("/case-studies")}>
      <PublicSection eyebrow="دراسة حالة مجهولة" title={study.title} description={study.summary}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-lg border border-kmt-border bg-white p-6">
            <Badge>{study.category}</Badge>
            <div className="mt-6 grid gap-5">
              <CaseStudyBlock title="التحدي" body={study.challenge} />
              <CaseStudyBlock title="طريقة التعامل" body={study.approach} />
              <CaseStudyBlock title="النتيجة العامة" body={study.generalOutcome} />
              <CaseStudyBlock title="الدروس" body={study.lessons} />
            </div>
            <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">{study.disclaimer}</div>
            <ButtonLink className="mt-6" href="/case-studies" variant="secondary">
              العودة لدراسات الحالة
            </ButtonLink>
          </article>
          <DetailCta />
        </div>
      </PublicSection>
    </PublicShell>
  );
}

function CaseStudyBlock({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-kmt-ink">{title}</h2>
      <p className="mt-2 leading-8 text-kmt-muted">{body}</p>
    </section>
  );
}
