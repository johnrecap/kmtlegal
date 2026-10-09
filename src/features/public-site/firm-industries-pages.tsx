import { PublicShell } from "@/components/layout";
import { ButtonLink } from "@/components/ui";
import { getPublicContent, navForPath } from "@/content/public-content";
import { firmStatementsApproved, industryServiceSlugs, publicExpansion } from "@/content/public-expansion";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
import { PageHero, PublicSection, publicPanel, publicMutedText } from "./public-components";
import { cn } from "@/lib/cn";
import { BusinessDeskSection } from "./business-desk";

export function OurFirmPageView({ locale }: { locale: PublicLocale }) {
  const copy = publicExpansion[locale];
  const content = getPublicContent(locale);
  return <PublicShell locale={locale} currentPath={localizedPublicHref("/our-firm", locale)} navItems={navForPath("/our-firm", locale)}>
    <PageHero eyebrow="KMT Legal" title={copy.firm} description={copy.firmDescription} size="compact" image="/site-assets/b392b48a7cb6b561-9c0dd010dc.webp" />
    <PublicSection eyebrow={copy.firmIntro} title={copy.approachTitle} description={copy.firmBody}>
      <div className={cn("grid gap-8", firmStatementsApproved && "lg:grid-cols-[1fr_1.2fr]")}>
        {firmStatementsApproved ? <div className={cn(publicPanel, "space-y-8 p-6 sm:p-8")}>
          <section><h2 className="text-2xl font-semibold">{copy.visionTitle}</h2><p className={cn(publicMutedText, "mt-4 leading-8")}>{copy.vision}</p></section>
          <section className="border-t border-[var(--kmt-public-line)] pt-8"><h2 className="text-2xl font-semibold">{copy.missionTitle}</h2><p className={cn(publicMutedText, "mt-4 leading-8")}>{copy.mission}</p></section>
        </div> : null}
        <ol className="divide-y divide-[var(--kmt-public-line)]">
          {copy.approach.map((step, index) => <li key={step} className="flex gap-5 py-6"><span aria-hidden className="text-2xl font-semibold text-[var(--kmt-public-gold)]"><bdi>{String(index + 1).padStart(2, "0")}</bdi></span><p className="text-lg leading-8">{step}</p></li>)}
        </ol>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={localizedPublicHref("/services", locale)}>{copy.servicesLink}</ButtonLink>
        <ButtonLink href={localizedPublicHref("/team", locale)} variant="secondary">{copy.teamLink}</ButtonLink>
        <ButtonLink href={localizedPublicHref("/contact", locale)} variant="secondary">{copy.contact}</ButtonLink>
      </div>
      <p className={cn(publicMutedText, "mt-6 text-sm leading-7")}>{content.shared.noLegalAdvice}</p>
    </PublicSection>
  </PublicShell>;
}

export function IndustriesPageView({ locale }: { locale: PublicLocale }) {
  const copy = publicExpansion[locale];
  const content = getPublicContent(locale);
  return <PublicShell locale={locale} currentPath={localizedPublicHref("/industries", locale)} navItems={navForPath("/industries", locale)}>
    <PageHero eyebrow="KMT Legal" title={copy.industries} description={copy.industriesDescription} size="compact" image="/site-assets/b8b47a1dd8d5ce08-4332ade87c.webp" />
    <PublicSection title={content.home.industriesTitle} description={content.home.industriesDescription}>
      <div className="divide-y divide-[var(--kmt-public-line)]">
        {content.publicIndustries.map((industry, index) => <article key={industry.title} className="grid gap-5 py-8 lg:grid-cols-[1fr_1.2fr]">
          <div><h2 className="text-2xl font-semibold">{industry.title}</h2><p className={cn(publicMutedText, "mt-4 leading-8")}>{industry.summary}</p></div>
          <nav aria-label={`${copy.industryServices}: ${industry.title}`}>
            <p className="mb-3 text-sm font-semibold text-[var(--kmt-public-gold)]">{copy.industryServices}</p>
            <div className="flex flex-wrap gap-3">{industryServiceSlugs[index].map(slug => {
              const service = content.legalServices.find(item => item.slug === slug)!;
              return <ButtonLink key={slug} href={localizedPublicHref(`/services/${slug}`, locale)} variant="secondary" className="min-h-11 whitespace-normal text-start">{service.title}</ButtonLink>;
            })}</div>
          </nav>
        </article>)}
      </div>
    </PublicSection>
    <BusinessDeskSection locale={locale} />
  </PublicShell>;
}
