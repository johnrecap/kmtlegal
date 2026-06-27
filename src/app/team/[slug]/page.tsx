import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import { findBySlug, lawyers, navForPath } from "@/content/public-content";
import { PublicSection, publicMutedText, publicPanel } from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";

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
          <img alt={lawyer.name} className="h-[460px] w-full rounded-lg border border-kmt-gold/25 object-cover opacity-90" src={lawyer.image} />
          <div className={cn(publicPanel, "p-6")}>
            <h2 className="text-2xl font-semibold text-white">التخصصات</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {lawyer.specialties.map((specialty) => (
                <Badge key={specialty} className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">
                  {specialty}
                </Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-white">اللغات</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {lawyer.languages.map((language) => (
                <Badge key={language} className="border-white/15 bg-white/5 text-slate-200">
                  {language}
                </Badge>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-amber-300/35 bg-amber-950/35 p-4 text-sm leading-7 text-amber-100">
              يتم تأكيد المحامي والموعد بعد مراجعة الطلب، ولا يمثل الحجز قبولا نهائيا للملف.
            </div>
            <p className={cn("mt-5 text-sm leading-7", publicMutedText)}>
              بيانات الفريق هنا للتعريف بالتخصصات فقط، ولا تنشئ علاقة محاماة قبل قبول المكتب للملف.
            </p>
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
