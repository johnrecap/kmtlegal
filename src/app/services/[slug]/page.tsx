import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import { findBySlug, legalServices, navForPath, serviceCategories } from "@/content/public-content";
import { DetailCta, PublicSection, publicGoldText, publicMutedText, publicPanel } from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";

type ServiceDetailPageProps = { params: { slug: string } };

export function generateStaticParams() {
  return legalServices.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: ServiceDetailPageProps): Metadata {
  const service = findBySlug(legalServices, params.slug);
  if (!service) return {};
  return {
    title: `${service.title} | KMT Legal`,
    description: service.description,
    alternates: { canonical: `/services/${service.slug}` }
  };
}

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const service = findBySlug(legalServices, params.slug);
  if (!service) notFound();

  return (
    <PublicShell navItems={navForPath("/services")}>
      <PublicSection eyebrow={serviceCategories[service.category]} title={service.title} description={service.description}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className={cn(publicPanel, "p-6")}>
            <MaterialSymbol className={cn("text-4xl", publicGoldText)} name={service.icon} />
            <p className={cn("mt-5 leading-8", publicMutedText)}>{service.content}</p>
            <h2 className="mt-8 text-2xl font-semibold text-white">مستندات تساعد على المراجعة</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {service.requiredDocuments.map((document) => (
                <Badge key={document} className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">
                  {document}
                </Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-white">مخرجات متوقعة</h2>
            <ul className={cn("mt-4 space-y-3", publicMutedText)}>
              {service.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2">
                  <MaterialSymbol className={cn("mt-1 text-base", publicGoldText)} name="check_circle" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
            <ButtonLink className="mt-8 !border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white" href="/services" variant="secondary">
              العودة لمجالات الخبرة
            </ButtonLink>
          </article>
          <DetailCta serviceTitle={service.title} />
        </div>
      </PublicSection>
    </PublicShell>
  );
}
