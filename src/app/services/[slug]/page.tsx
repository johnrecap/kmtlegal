import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import { findBySlug, legalServices, navForPath, serviceCategories } from "@/content/public-content";
import { DetailCta, PublicSection } from "@/features/public-site/public-components";

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
          <article className="rounded-lg border border-kmt-border bg-white p-6">
            <MaterialSymbol className="text-4xl text-kmt-gold" name={service.icon} />
            <p className="mt-5 leading-8 text-kmt-muted">{service.content}</p>
            <h2 className="mt-8 text-2xl font-semibold text-kmt-ink">مستندات تساعد على المراجعة</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {service.requiredDocuments.map((document) => (
                <Badge key={document}>{document}</Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-kmt-ink">مخرجات متوقعة</h2>
            <ul className="mt-4 space-y-3 text-kmt-muted">
              {service.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2">
                  <MaterialSymbol className="mt-1 text-base text-kmt-gold" name="check_circle" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
            <ButtonLink className="mt-8" href="/services" variant="secondary">
              العودة للخدمات
            </ButtonLink>
          </article>
          <DetailCta serviceTitle={service.title} />
        </div>
      </PublicSection>
    </PublicShell>
  );
}
