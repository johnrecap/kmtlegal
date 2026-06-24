import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import { findBySlug, lawyers, navForPath } from "@/content/public-content";
import { PublicSection } from "@/features/public-site/public-components";

type LawyerProfilePageProps = { params: { slug: string } };

export function generateStaticParams() {
  return lawyers.map((lawyer) => ({ slug: lawyer.slug }));
}

export function generateMetadata({ params }: LawyerProfilePageProps): Metadata {
  const lawyer = findBySlug(lawyers, params.slug);
  if (!lawyer) return {};
  return {
    title: `${lawyer.name} | KMT Legal`,
    description: lawyer.bio,
    alternates: { canonical: `/team/${lawyer.slug}` }
  };
}

export default function LawyerProfilePage({ params }: LawyerProfilePageProps) {
  const lawyer = findBySlug(lawyers, params.slug);
  if (!lawyer) notFound();

  return (
    <PublicShell navItems={navForPath("/team")}>
      <PublicSection eyebrow={lawyer.title} title={lawyer.name} description={lawyer.bio}>
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <img alt={lawyer.name} className="h-[460px] w-full rounded-lg border border-kmt-border object-cover" src={lawyer.image} />
          <div className="rounded-lg border border-kmt-border bg-white p-6">
            <h2 className="text-2xl font-semibold text-kmt-ink">التخصصات</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {lawyer.specialties.map((specialty) => (
                <Badge key={specialty}>{specialty}</Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-kmt-ink">اللغات</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {lawyer.languages.map((language) => (
                <Badge key={language}>{language}</Badge>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              يتم تأكيد المحامي والموعد بعد مراجعة الطلب، ولا يمثل الحجز قبولًا نهائيًا للملف.
            </div>
            <ButtonLink
              className="mt-6"
              href={`/book-consultation?lawyer=${encodeURIComponent(lawyer.name)}`}
              trailingIcon={<MaterialSymbol className="text-base rtl:rotate-180" name="arrow_forward" />}
            >
              طلب استشارة
            </ButtonLink>
          </div>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
