import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/animate-ui/components/radix/accordion";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import { FocusCards } from "@/components/ui/focus-cards";
import { canonicalPublicServiceSlug, findPublicService, getPublicContent, navForPath } from "@/content/public-content";
import { ConsultationBookingChatFromQuery } from "@/features/public-site/booking-query-client";
import { ContactForm } from "@/features/public-site/contact-form";
import { DirectoryFilter } from "@/features/public-site/directory-filter";
import { PolicyToc } from "@/features/public-site/policy-toc";
import {
  publicMotionArrow,
  publicMotionArrowTrail,
  publicMotionButton,
  publicMotionCardBeam,
  publicMotionCta,
  publicMotionIcon,
  publicMotionIconHalo
} from "@/features/public-site/public-motion";
import { HeroParallaxLayers } from "@/components/motion-ui/hero-parallax-layers";
import { ReadingProgress } from "@/components/motion-ui/reading-progress";
import { Reveal } from "@/components/motion-ui/reveal";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import {
  BookingFlowHeader,
  CapabilityRows,
  DetailCta,
  IndustryLedger,
  LuxuryFeaturePanel,
  MatterRows,
  PageHero,
  PublicBreadcrumbs,
  PublicSection,
  StatementBreak,
  TrustStrip,
  publicGoldChip,
  publicGoldText,
  publicMutedText,
  publicNeutralChip,
  publicPanel,
  publicPanelHover,
  publicPhotoTreatment
} from "@/features/public-site/public-components";
import { ProcessSteps } from "@/features/public-site/process-steps";
import { cn } from "@/lib/cn";
import { alternatePublicLanguages, availableAlternatePublicLanguages, localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
import {
  listPublishedArticleCards,
  listPublishedCaseStudyCards,
  getPublishedArticleBySlug,
  getPublishedCaseStudyBySlug
} from "@/server/public/content-service";
import { getPublicConsultationBookingMode } from "@/server/consultations/consultation-booking-settings";

export function publicPageMetadata(
  locale: PublicLocale,
  pathname: string,
  title: string,
  description: string,
  availableLocales: readonly PublicLocale[] = ["en", "ar"]
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: localizedPublicHref(pathname, locale),
      languages: availableLocales.length === 2 ? alternatePublicLanguages(pathname) : availableAlternatePublicLanguages(pathname, availableLocales)
    }
  };
}

export function homeMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/", content.home.metadataTitle, content.home.metadataDescription);
}

export function servicesMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/services", content.servicesPage.metadataTitle, content.servicesPage.metadataDescription);
}

export function serviceDetailMetadata(locale: PublicLocale, slug: string): Metadata {
  const service = findPublicService(locale, slug);
  if (!service) return {};

  return publicPageMetadata(locale, `/services/${service.slug}`, `${service.title} | KMT Legal`, service.description);
}

export function teamMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/team", content.teamPage.metadataTitle, content.teamPage.metadataDescription);
}

export function teamDetailMetadata(locale: PublicLocale, slug: string): Metadata {
  const content = getPublicContent(locale);
  const lawyer = content.lawyers.find((item) => item.slug === slug);
  if (!lawyer) return {};

  return publicPageMetadata(locale, `/team/${lawyer.slug}`, `${lawyer.name} | KMT Legal`, lawyer.bio);
}

export function articlesMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/articles", content.articlesPage.metadataTitle, content.articlesPage.metadataDescription);
}

export async function articleDetailMetadata(locale: PublicLocale, slug: string): Promise<Metadata> {
  const alternateLocale = locale === "ar" ? "en" : "ar";
  const [article, alternateArticle] = await Promise.all([loadArticle(locale, slug), loadArticle(alternateLocale, slug)]);
  if (!article) return {};

  return publicPageMetadata(
    locale,
    `/articles/${article.slug}`,
    `${article.title} | KMT Legal`,
    article.excerpt,
    alternateArticle ? ["en", "ar"] : [locale]
  );
}

export function caseStudiesMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/case-studies", content.caseStudiesPage.metadataTitle, content.caseStudiesPage.metadataDescription);
}

export async function caseStudyDetailMetadata(locale: PublicLocale, slug: string): Promise<Metadata> {
  const alternateLocale = locale === "ar" ? "en" : "ar";
  const [study, alternateStudy] = await Promise.all([loadCaseStudy(locale, slug), loadCaseStudy(alternateLocale, slug)]);
  if (!study) return {};

  return publicPageMetadata(
    locale,
    `/case-studies/${study.slug}`,
    `${study.title} | KMT Legal`,
    study.summary,
    alternateStudy ? ["en", "ar"] : [locale]
  );
}

export function contactMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/contact", content.contactPage.metadataTitle, content.contactPage.metadataDescription);
}

export function bookingMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/book-consultation", content.bookingPage.metadataTitle, content.bookingPage.metadataDescription);
}

export function privacyMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/privacy", content.privacyPage.metadataTitle, content.privacyPage.metadataDescription);
}

export function termsMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/terms", content.termsPage.metadataTitle, content.termsPage.metadataDescription);
}

export function publicServiceStaticParams(locale: PublicLocale) {
  return getPublicContent(locale).legalServices.map((service) => ({ slug: service.slug }));
}

export function publicLawyerStaticParams(locale: PublicLocale) {
  return getPublicContent(locale).lawyers.map((lawyer) => ({ slug: lawyer.slug }));
}

export async function metadataForPublicPath(locale: PublicLocale, path: string[] = []): Promise<Metadata> {
  const [section, slug] = path;
  if (!section) return homeMetadata(locale);
  if (section === "services" && !slug) return servicesMetadata(locale);
  if (section === "services" && slug && path.length === 2) return serviceDetailMetadata(locale, slug);
  if (section === "team" && !slug) return teamMetadata(locale);
  if (section === "team" && slug && path.length === 2) return teamDetailMetadata(locale, slug);
  // Phase 06 — Articles HIDE PUBLIC, Case Studies HIDE PUBLIC, Media DELETE:
  // no public metadata is emitted for these sections in any locale. The
  // emitter functions below stay defined (admin/backend untouched) but have
  // no public call site; article/case-study detail views stay exported for
  // the preserved management pipeline and its tests.
  if (section === "contact" && path.length === 1) return contactMetadata(locale);
  if (section === "book-consultation" && path.length === 1) return bookingMetadata(locale);
  if (section === "privacy" && path.length === 1) return privacyMetadata(locale);
  if (section === "terms" && path.length === 1) return termsMetadata(locale);
  return {};
}

export async function renderPublicPath(locale: PublicLocale, path: string[] = []) {
  const [section, slug] = path;
  if (!section) return <HomePageView locale={locale} />;
  if (section === "services" && !slug) return <ServicesPageView locale={locale} />;
  if (section === "services" && slug && path.length === 2) return <ServiceDetailPageView locale={locale} slug={slug} />;
  if (section === "team" && !slug) return <TeamPageView locale={locale} />;
  if (section === "team" && slug && path.length === 2) return <TeamDetailPageView locale={locale} slug={slug} />;
  // Phase 06 — deferred sections fall through to notFound() below: no public
  // rendering path remains for articles / case-studies / media in any locale.
  if (section === "contact" && path.length === 1) return <ContactPageView locale={locale} />;
  if (section === "book-consultation" && path.length === 1) return <BookConsultationPageView locale={locale} />;
  if (section === "privacy" && path.length === 1) return <PrivacyPageView locale={locale} />;
  if (section === "terms" && path.length === 1) return <TermsPageView locale={locale} />;
  notFound();
}

export function HomePageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.home;
  const focusService = content.legalServices.find((service) => service.slug === "corporate-business-services") ?? content.legalServices[0];
  const currentPath = localizedPublicHref("/", locale);

  return (
    <PublicShell currentPath={currentPath} locale={locale} navItems={navForPath("/", locale)}>
      <HeroParallaxLayers
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
        description={copy.heroDescription}
        descriptionHighlight={locale === "ar" ? "الوقائع والمستندات" : "reviews the facts and documents"}
        image="/stitch-assets/b392b48a7cb6b561.png"
        imagePosition="object-[center_55%]"
        pickerLabel={copy.heroPickerLabel}
        matters={content.practiceAreaMatrix.slice(0, 6)}
        docket={{
          title: copy.heroDocketTitle,
          matter: copy.heroDocketMatter,
          next: copy.heroDocketNext,
          empty: copy.heroDocketEmpty
        }}
        stats={copy.heroStats}
        nextStep={content.bookingPage.sectionDescription}
        bookLabel={content.shared.bookConsultation}
        browseLabel={content.shared.browsePracticeAreas}
        locale={locale}
      />
      <TrustStrip items={copy.trustItems} />

      <PublicSection align="center" accent="section" eyebrow={copy.practiceEyebrow} title={copy.practiceTitle} description={copy.practiceDescription} descriptionHighlight={locale === "ar" ? "طلب استشارة منظمًا" : "structured consultation request"} descriptionEmphasis="subtle">
        <CapabilityRows
          items={content.practiceAreaMatrix.map((area) => ({
            icon: area.icon,
            title: area.title,
            summary: area.summary,
            href: area.href
          }))}
          locale={locale}
        />
      </PublicSection>

      <StatementBreak
        text={content.shared.noLegalAdvice}
        highlight={locale === "ar" ? "لا يغني عن مراجعة محام" : "does not replace lawyer review"}
      />

      <PublicSection surface="muted" density="roomy" accent="section" eyebrow={copy.focusEyebrow} title={focusService.title} description={focusService.description}>
        <StickyScroll
          content={[
            {
              title: content.serviceDetail.includedTitle,
              description: focusService.subServices.join(" · "),
              content: (
                <div className="relative h-full min-h-[320px] w-full">
                  <Image alt="" className="object-cover opacity-80" fill sizes="(min-width: 1024px) 380px, 100vw" src="/stitch-assets/2484f68d86633ca8.png" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--kmt-public-scrim)/0.55)] via-transparent to-transparent" aria-hidden="true" />
                </div>
              )
            },
            {
              title: content.serviceDetail.documentsTitle,
              description: focusService.requiredDocuments.join(" · "),
              content: (
                <div className="relative h-full min-h-[320px] w-full">
                  <Image alt="" className="object-cover opacity-80" fill sizes="(min-width: 1024px) 380px, 100vw" src="/stitch-assets/2484f68d86633ca8.png" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--kmt-public-scrim)/0.55)] via-transparent to-transparent" aria-hidden="true" />
                </div>
              )
            },
            {
              title: content.serviceDetail.outcomesTitle,
              description: focusService.outcomes.join(" · "),
              content: (
                <div className="relative h-full min-h-[320px] w-full">
                  <Image alt="" className="object-cover opacity-80" fill sizes="(min-width: 1024px) 380px, 100vw" src="/stitch-assets/2484f68d86633ca8.png" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--kmt-public-scrim)/0.55)] via-transparent to-transparent" aria-hidden="true" />
                </div>
              )
            }
          ]}
        />
      </PublicSection>

      <PublicSection align="center" accent="section" eyebrow={copy.approachEyebrow} title={copy.approachTitle} description={copy.approachDescription} descriptionHighlight={locale === "ar" ? "بعد مراجعة المكتب" : "only after office review"}>
        <ProcessSteps steps={copy.approachSteps} />
      </PublicSection>

      <PublicSection surface="muted" density="roomy" align="center" accent="section" eyebrow={copy.representativeEyebrow} title={copy.representativeTitle} description={copy.representativeDescription} descriptionHighlight={locale === "ar" ? "دون كشف بيانات عملاء" : "without revealing client data"} descriptionEmphasis="subtle">
        <MatterRows matters={[...content.representativeMatters]} locale={locale} />
      </PublicSection>

      <PublicSection eyebrow={copy.industriesEyebrow} title={copy.industriesTitle} description={copy.industriesDescription}>
        <IndustryLedger industries={content.publicIndustries} />
      </PublicSection>

      <PublicSection surface="muted" accent="section" eyebrow={copy.teamEyebrow} title={copy.teamTitle} description={copy.teamDescription} descriptionHighlight={locale === "ar" ? "مسارات الخبرة" : "expertise paths"} descriptionEmphasis="subtle">
        <FocusCards
          cards={content.lawyers.map((lawyer) => ({
            title: lawyer.name,
            subtitle: lawyer.title,
            meta: lawyer.specialties.slice(0, 2).join(" · "),
            src: lawyer.image,
            href: localizedPublicHref(`/team/${lawyer.slug}`, locale)
          }))}
        />
      </PublicSection>

    </PublicShell>
  );
}

export function ServicesPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.servicesPage;
  const teamLabel = content.navItems.find((item) => item.href === "/team")?.label ?? "/team";

  return (
    <PublicShell currentPath={localizedPublicHref("/services", locale)} locale={locale} navItems={navForPath("/services", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/b8b47a1dd8d5ce08.png" imagePosition="object-[center_62%]" size="compact" texture="dots" title={copy.heroTitle} description={copy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={copy.sectionTitle} description={copy.sectionDescription}>
        <DirectoryFilter
          emptyTitle={copy.emptyTitle}
          layout="rows"
          locale={locale}
          items={content.legalServices.map((service) => ({
            title: service.title,
            description: service.description,
            href: `/services/${service.slug}`,
            category: service.category,
            categoryLabel: content.serviceCategories[service.category as keyof typeof content.serviceCategories] ?? service.category,
            chips: service.subServices,
            meta: `${service.subServices.length} ${copy.servicesCountLabel}`,
            searchText: service.subServices.join(" ")
          }))}
          searchLabel={copy.searchLabel}
        />
      </PublicSection>
      <PublicSection surface="muted" eyebrow={content.bookingPage.sectionEyebrow} title={content.bookingPage.sectionTitle} description={content.bookingPage.sectionDescription}>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={localizedPublicHref("/book-consultation", locale)}>
            {content.shared.bookConsultation}
          </ButtonLink>
          <ButtonLink href={localizedPublicHref("/team", locale)} variant="secondary">
            {teamLabel}
          </ButtonLink>
        </div>
      </PublicSection>
    </PublicShell>
  );
}

export function ServiceDetailPageView({ locale, slug }: { locale: PublicLocale; slug: string }) {
  const content = getPublicContent(locale);
  const service = findPublicService(locale, slug);
  if (!service) notFound();
  const copy = content.serviceDetail;
  const currentSlug = canonicalPublicServiceSlug(slug);
  const categoryLabel = content.serviceCategories[service.category as keyof typeof content.serviceCategories] ?? service.category;
  const breadcrumbItems = [
    { label: copy.breadcrumbServices, href: localizedPublicHref("/services", locale) },
    { label: categoryLabel },
    { label: service.title }
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.breadcrumbServices, item: localizedPublicHref("/services", locale) },
      { "@type": "ListItem", position: 2, name: categoryLabel },
      { "@type": "ListItem", position: 3, name: service.title }
    ]
  };

  return (
    <PublicShell currentPath={localizedPublicHref(`/services/${currentSlug}`, locale)} locale={locale} navItems={navForPath("/services", locale)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicSection
        breadcrumbs={<PublicBreadcrumbs ariaLabel={copy.breadcrumbAriaLabel} items={breadcrumbItems} />}
        eyebrow={categoryLabel}
        headingLevel="h1"
        title={service.title}
        description={service.description}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className={cn(publicPanel, "p-6")}>
            <MaterialSymbol className={cn("text-4xl", publicGoldText)} name={service.icon} />
            <p className={cn("mt-5 leading-8", publicMutedText)}>{service.content}</p>
            {/*
              Desktop dossier: static secondary sections (unchanged).
              Mobile: the same sections collapse into the Accordion below —
              CTA and breadcrumbs stay outside and always visible.
            */}
            <div className="mt-8 hidden border-t border-[var(--kmt-public-line)] pt-6 lg:block">
              <h2 className="text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.includedTitle}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {service.subServices.map((subService) => (
                  <Badge key={subService} className={publicGoldChip}>
                    {subService}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-8 hidden border-t border-[var(--kmt-public-line)] pt-6 lg:block">
              <h2 className="text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.documentsTitle}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {service.requiredDocuments.map((document) => (
                  <Badge key={document} className={publicGoldChip}>
                    {document}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-8 hidden border-t border-[var(--kmt-public-line)] pt-6 lg:block">
              <h2 className="text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.outcomesTitle}</h2>
              <ul className={cn("mt-4 space-y-3", publicMutedText)}>
                {service.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-2">
                    <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="check_circle" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Accordion
              className={cn(publicPanel, "mt-8 px-5 py-1 lg:hidden")}
              data-testid="service-detail-accordion"
              type="single"
              collapsible
            >
              <AccordionItem value="included">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.includedTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {service.subServices.map((subService) => (
                      <Badge key={subService} className={publicGoldChip}>
                        {subService}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="documents">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.documentsTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {service.requiredDocuments.map((document) => (
                      <Badge key={document} className={publicGoldChip}>
                        {document}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="outcomes">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.outcomesTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className={cn("space-y-3", publicMutedText)}>
                    {service.outcomes.map((outcome) => (
                      <li key={outcome} className="flex gap-2">
                        <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="check_circle" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-8 !border-kmt-gold/35 !text-[var(--kmt-public-text)] hover:!bg-kmt-gold hover:!text-primary-foreground")} href={localizedPublicHref("/services", locale)} variant="secondary">
              {copy.backToServices}
            </ButtonLink>
          </article>
          <DetailCta locale={locale} serviceTitle={service.title} />
        </div>
        <nav aria-label={copy.breadcrumbServices} className="mt-10 hidden lg:block">
          <h2 className="text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.breadcrumbServices}</h2>
          <ul className="mt-5 overflow-hidden rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)]">
            {content.legalServices
              .filter((related) => related.slug !== service.slug)
              .map((related, index) => (
                <li key={related.slug} className={cn(index > 0 && "border-t border-[var(--kmt-public-line)]")}>
                  <Link
                    className="group flex items-center justify-between gap-4 p-4 transition-colors duration-kmt-fast ease-kmt-out hover:bg-[var(--kmt-public-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-kmt-gold motion-reduce:transition-none sm:px-5"
                    href={localizedPublicHref(`/services/${related.slug}`, locale)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-semibold text-[var(--kmt-public-text)]">{related.title}</span>
                      <span className={cn("mt-1 block truncate text-sm", publicMutedText)}>{related.description}</span>
                    </span>
                    <MaterialSymbol className={cn("shrink-0 text-xl", publicGoldText, publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
        <Accordion
          className={cn(publicPanel, "mt-10 px-5 py-1 lg:hidden")}
          data-testid="service-related-accordion"
          type="single"
          collapsible
        >
          <AccordionItem value="related">
            <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
              {copy.breadcrumbServices}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {content.legalServices
                  .filter((related) => related.slug !== service.slug)
                  .map((related) => (
                    <li key={related.slug}>
                      <Link
                        className="group flex items-center justify-between gap-4 rounded-lg p-3 transition-colors duration-kmt-fast ease-kmt-out hover:bg-[var(--kmt-public-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold motion-reduce:transition-none"
                        href={localizedPublicHref(`/services/${related.slug}`, locale)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-base font-semibold text-[var(--kmt-public-text)]">{related.title}</span>
                          <span className={cn("mt-1 block truncate text-sm", publicMutedText)}>{related.description}</span>
                        </span>
                        <MaterialSymbol className={cn("shrink-0 text-xl", publicGoldText, publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />
                      </Link>
                    </li>
                  ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </PublicSection>
    </PublicShell>
  );
}

export function TeamPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.teamPage;

  return (
    <PublicShell currentPath={localizedPublicHref("/team", locale)} locale={locale} navItems={navForPath("/team", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/bd64f8e89da8f4f6.png" imagePosition="object-[center_38%]" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={copy.sectionTitle} description={copy.sectionDescription}>
        <DirectoryFilter
          cardVariant="focus"
          emptyTitle={copy.emptyTitle}
          locale={locale}
          items={content.lawyers.map((lawyer) => ({
            title: lawyer.name,
            subtitle: lawyer.title,
            description: `${lawyer.title}. ${lawyer.bio}`,
            href: `/team/${lawyer.slug}`,
            category: lawyer.specialties[0] ?? "team",
            categoryLabel: lawyer.specialties[0] ?? copy.sectionEyebrow,
            meta: lawyer.bookingEnabled ? copy.bookingAvailable : copy.officeReview,
            chips: lawyer.specialties,
            image: lawyer.image,
            imageAlt: lawyer.name
          }))}
          searchLabel={copy.searchLabel}
        />
      </PublicSection>
    </PublicShell>
  );
}

export function TeamDetailPageView({ locale, slug }: { locale: PublicLocale; slug: string }) {
  const content = getPublicContent(locale);
  const lawyer = content.lawyers.find((item) => item.slug === slug);
  if (!lawyer) notFound();
  const copy = content.teamDetail;
  const breadcrumbItems = [
    { label: copy.breadcrumbTeam, href: localizedPublicHref("/team", locale) },
    { label: lawyer.name }
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.breadcrumbTeam, item: localizedPublicHref("/team", locale) },
      { "@type": "ListItem", position: 2, name: lawyer.name }
    ]
  };

  return (
    <PublicShell currentPath={localizedPublicHref(`/team/${lawyer.slug}`, locale)} locale={locale} navItems={navForPath("/team", locale)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicSection
        breadcrumbs={<PublicBreadcrumbs ariaLabel={content.serviceDetail.breadcrumbAriaLabel} items={breadcrumbItems} />}
        eyebrow={lawyer.title}
        headingLevel="h1"
        title={lawyer.name}
        description={lawyer.bio}
      >
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-[var(--kmt-public-line)]">
            <Image alt={lawyer.name} className={publicPhotoTreatment} fill sizes="(min-width: 1024px) 360px, 100vw" src={lawyer.image} />
          </div>
          <div className={cn(publicPanel, "p-6")}>
            <h2 className="text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.specialtiesTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {lawyer.specialties.map((specialty) => (
                <Badge key={specialty} className={publicGoldChip}>
                  {specialty}
                </Badge>
              ))}
            </div>
            {/*
              Desktop profile: static secondary information (unchanged).
              Mobile: the same information collapses into the Accordion
              below — photo, specialties, notices, and primary CTA stay
              outside and always visible.
            */}
            <div className="hidden lg:block">
              <h2 className="mt-8 text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.languagesTitle}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {lawyer.languages.map((language) => (
                  <Badge key={language} className={publicNeutralChip}>
                    {language}
                  </Badge>
                ))}
              </div>
              <h2 className="mt-8 text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.credentialsTitle}</h2>
              <div className="mt-4 space-y-6">
                <div>
                  <p className={cn("text-sm font-semibold", publicGoldText)}>{copy.experienceTitle}</p>
                  <p className={cn("mt-1.5 text-sm leading-7", publicMutedText)}>{lawyer.experience}</p>
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", publicGoldText)}>{copy.educationTitle}</p>
                  <ul className="mt-2 space-y-2">
                    {lawyer.education.map((entry) => (
                      <li key={entry} className={cn("flex gap-2 text-sm leading-7", publicMutedText)}>
                        <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="history_edu" />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", publicGoldText)}>{copy.admissionsTitle}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lawyer.admissions.map((admission) => (
                      <Badge key={admission} className={publicGoldChip}>
                        {admission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Accordion
              className="mt-8 border-t border-[var(--kmt-public-line)] pt-2 lg:hidden"
              data-testid="team-detail-accordion"
              type="single"
              collapsible
            >
              <AccordionItem value="languages">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.languagesTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.languages.map((language) => (
                      <Badge key={language} className={publicNeutralChip}>
                        {language}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="experience">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.experienceTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <p className={cn("text-sm leading-7", publicMutedText)}>{lawyer.experience}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="education">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.educationTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {lawyer.education.map((entry) => (
                      <li key={entry} className={cn("flex gap-2 text-sm leading-7", publicMutedText)}>
                        <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="history_edu" />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="admissions">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.admissionsTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.admissions.map((admission) => (
                      <Badge key={admission} className={publicGoldChip}>
                        {admission}
                      </Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-8 rounded-lg border border-kmt-warning-border bg-kmt-warning-surface p-4 text-sm leading-7 text-kmt-warning-strong">{copy.bookingNotice}</div>
            <p className={cn("mt-5 text-sm leading-7", publicMutedText)}>{copy.relationshipNotice}</p>
            <ButtonLink
              className={cn(publicMotionButton, publicMotionCta, "mt-6")}
              href={localizedPublicHref(`/book-consultation?lawyer=${encodeURIComponent(lawyer.name)}`, locale)}
              trailingIcon={<MaterialSymbol className={cn("text-base", publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />}
            >
              {copy.requestConsultation}
            </ButtonLink>
          </div>
        </div>
      </PublicSection>
    </PublicShell>
  );
}

export async function ArticlesPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.articlesPage;
  const articles = await loadArticles(locale);

  return (
    <PublicShell currentPath={localizedPublicHref("/articles", locale)} locale={locale} navItems={navForPath("/articles", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/2c0d439a80ab607f.png" imagePosition="object-[center_50%]" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={copy.sectionTitle} description={copy.sectionDescription}>
        <DirectoryFilter
          emptyTitle={copy.emptyTitle}
          locale={locale}
          items={articles.map((article) => ({
            title: article.title,
            description: article.excerpt,
            href: `/articles/${article.slug}`,
            category: article.category,
            categoryLabel: article.category,
            meta: article.readTime
          }))}
          searchLabel={copy.searchLabel}
        />
      </PublicSection>
    </PublicShell>
  );
}

export async function ArticleDetailPageView({ locale, slug }: { locale: PublicLocale; slug: string }) {
  const content = getPublicContent(locale);
  const alternateLocale = locale === "ar" ? "en" : "ar";
  const [article, alternateArticle, articleCards] = await Promise.all([
    loadArticle(locale, slug),
    loadArticle(alternateLocale, slug),
    loadArticles(locale)
  ]);
  if (!article) notFound();
  const copy = content.articleDetail;
  const authorName = article.author ?? copy.defaultAuthor;
  const related = articleCards
    .filter((item) => item.slug !== article.slug && item.category === article.category)
    .slice(0, 3);
  const breadcrumbItems = [
    { label: copy.breadcrumbArticles, href: localizedPublicHref("/articles", locale) },
    { label: article.category },
    { label: article.title }
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.breadcrumbArticles, item: localizedPublicHref("/articles", locale) },
      { "@type": "ListItem", position: 2, name: article.category },
      { "@type": "ListItem", position: 3, name: article.title }
    ]
  };

  return (
    <PublicShell
      currentPath={localizedPublicHref(`/articles/${article.slug}`, locale)}
      languageHref={alternateArticle ? localizedPublicHref(`/articles/${alternateArticle.slug}`, alternateLocale) : null}
      locale={locale}
      navItems={navForPath("/articles", locale)}
    >
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicSection
        breadcrumbs={<PublicBreadcrumbs ariaLabel={content.serviceDetail.breadcrumbAriaLabel} items={breadcrumbItems} />}
        eyebrow={article.readTime}
        headingLevel="h1"
        title={article.title}
        description={article.excerpt}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className={cn(publicPanel, "p-6")}>
            <div className="flex flex-wrap gap-2">
              <Badge className={publicGoldChip}>{article.category}</Badge>
              {article.publishedAt ? (
                <Badge className={publicNeutralChip}>
                  <time dateTime={article.publishedAt}>
                    <bdi>{formatPublicPolicyDate(article.publishedAt, locale)}</bdi>
                  </time>
                </Badge>
              ) : null}
            </div>
            <p className={cn("mt-5 text-sm", publicMutedText)}>
              {copy.bylineBy} <span className="font-semibold text-[var(--kmt-public-text)]">{authorName}</span>
            </p>
            <ArticleBody content={article.content} />
            <div className="mt-8 rounded-lg border border-kmt-warning-border bg-kmt-warning-surface p-4 text-sm leading-7 text-kmt-warning-strong">{copy.disclaimer}</div>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-6 !border-kmt-gold/35 !text-[var(--kmt-public-text)] hover:!bg-kmt-gold hover:!text-primary-foreground")} href={localizedPublicHref("/articles", locale)} variant="secondary">
              {copy.backToArticles}
            </ButtonLink>
          </article>
          <DetailCta locale={locale} />
        </div>
        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.relatedTitle}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  className={cn(publicPanel, publicPanelHover, "block p-5")}
                  href={localizedPublicHref(`/articles/${item.slug}`, locale)}
                >
                  <p className={cn("text-sm font-semibold", publicGoldText)}>
                    <bdi>{item.readTime}</bdi>
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--kmt-public-text)]">{item.title}</h3>
                  <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </PublicSection>
    </PublicShell>
  );
}

export async function CaseStudiesPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.caseStudiesPage;
  const caseStudies = await loadCaseStudies(locale);

  return (
    <PublicShell currentPath={localizedPublicHref("/case-studies", locale)} locale={locale} navItems={navForPath("/case-studies", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/927e808522dfd86d.png" imagePosition="object-[center_50%]" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={copy.sectionTitle} description={copy.sectionDescription}>
        <DirectoryFilter
          emptyTitle={copy.emptyTitle}
          locale={locale}
          items={caseStudies.map((study) => ({
            title: study.title,
            description: study.summary,
            href: `/case-studies/${study.slug}`,
            category: study.category,
            categoryLabel: study.category,
            meta: study.publishedAt ? formatPublicYear(study.publishedAt, locale) : undefined
          }))}
          searchLabel={copy.searchLabel}
        />
      </PublicSection>
    </PublicShell>
  );
}

export async function CaseStudyDetailPageView({ locale, slug }: { locale: PublicLocale; slug: string }) {
  const content = getPublicContent(locale);
  const alternateLocale = locale === "ar" ? "en" : "ar";
  const [study, alternateStudy] = await Promise.all([loadCaseStudy(locale, slug), loadCaseStudy(alternateLocale, slug)]);
  if (!study) notFound();
  const copy = content.caseStudyDetail;
  const breadcrumbItems = [
    { label: copy.breadcrumbCaseStudies, href: localizedPublicHref("/case-studies", locale) },
    { label: study.title }
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.breadcrumbCaseStudies, item: localizedPublicHref("/case-studies", locale) },
      { "@type": "ListItem", position: 2, name: study.title }
    ]
  };
  const blocks = [
    { title: copy.challenge, body: study.challenge },
    { title: copy.approach, body: study.approach },
    { title: copy.generalOutcome, body: study.generalOutcome },
    { title: copy.lessons, body: study.lessons }
  ];

  return (
    <PublicShell
      currentPath={localizedPublicHref(`/case-studies/${study.slug}`, locale)}
      languageHref={alternateStudy ? localizedPublicHref(`/case-studies/${alternateStudy.slug}`, alternateLocale) : null}
      locale={locale}
      navItems={navForPath("/case-studies", locale)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PublicSection
        breadcrumbs={<PublicBreadcrumbs ariaLabel={content.serviceDetail.breadcrumbAriaLabel} items={breadcrumbItems} />}
        eyebrow={copy.eyebrow}
        headingLevel="h1"
        title={study.title}
        description={study.summary}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className={cn(publicPanel, "p-6")}>
            <div className="flex flex-wrap gap-2">
              <Badge className={publicGoldChip}>{study.category}</Badge>
              {study.publishedAt ? (
                <Badge className={publicNeutralChip}>
                  <bdi>{formatPublicPolicyDate(study.publishedAt, locale)}</bdi>
                </Badge>
              ) : null}
            </div>
            <div className="mt-6 grid gap-6">
              {blocks.map((block, index) => (
                <Reveal key={block.title} delay={index * 60}>
                  <CaseStudyBlock index={index} title={block.title} body={block.body} />
                </Reveal>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-kmt-warning-border bg-kmt-warning-surface p-4 text-sm leading-7 text-kmt-warning-strong">{study.disclaimer}</div>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-6 !border-kmt-gold/35 !text-[var(--kmt-public-text)] hover:!bg-kmt-gold hover:!text-primary-foreground")} href={localizedPublicHref("/case-studies", locale)} variant="secondary">
              {copy.backToCaseStudies}
            </ButtonLink>
          </article>
          <DetailCta locale={locale} />
        </div>
      </PublicSection>
    </PublicShell>
  );
}

/**
 * Branch contact rows (address, phone, hours, email) shared by the desktop
 * branch panels and the mobile branches Accordion — one markup source.
 */
function BranchDetails({
  branch,
  channels
}: {
  branch: { address: string; hours: string; email: string };
  channels: { phoneHref: string; phoneDisplay: string };
}) {
  return (
    <ul className="mt-4 space-y-3 text-sm">
      <li className="flex gap-3">
        <MaterialSymbol className={cn("mt-0.5 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="location_on" />
        <span className={cn("leading-6", publicMutedText)}>{branch.address}</span>
      </li>
      {channels.phoneHref && channels.phoneDisplay ? (
        <li className="flex gap-3">
          <MaterialSymbol className={cn("mt-0.5 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="call" />
          <a
            className="leading-6 text-[var(--kmt-public-text)] transition-colors hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
            dir="ltr"
            href={channels.phoneHref}
          >
            <bdi>{channels.phoneDisplay}</bdi>
          </a>
        </li>
      ) : null}
      <li className="flex gap-3">
        <MaterialSymbol className={cn("mt-0.5 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="schedule" />
        <span className={cn("leading-6", publicMutedText)}>{branch.hours}</span>
      </li>
      <li className="flex gap-3">
        <MaterialSymbol className={cn("mt-0.5 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="mail" />
        <a
          className="leading-6 text-[var(--kmt-public-text)] transition-colors hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
          dir="ltr"
          href={`mailto:${branch.email}`}
        >
          {branch.email}
        </a>
      </li>
    </ul>
  );
}

export function ContactPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.contactPage;
  const channels = content.contactChannels;

  return (
    <PublicShell currentPath={localizedPublicHref("/contact", locale)} locale={locale} navItems={navForPath("/contact", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/11c3bae2e63b7192.png" imagePosition="object-[center_48%]" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={copy.sectionTitle} description={copy.sectionDescription}>
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <ContactForm locale={locale} />
          <aside className="grid content-start gap-4">
            {content.branches.map((branch) => (
              <section key={branch.name} className={cn(publicPanel, publicMotionCardBeam, "hidden p-5 lg:block")}>
                <h2 className="text-xl font-semibold text-[var(--kmt-public-text)]">{branch.name}</h2>
                <BranchDetails branch={branch} channels={channels} />
              </section>
            ))}
            {/*
              Mobile branch/office details ride the Animate UI Accordion.
              The WhatsApp card is intentionally gone: WhatsApp stays
              available through the global Floating Dock only.
            */}
            <Accordion
              className={cn(publicPanel, "px-5 py-1 lg:hidden")}
              data-testid="contact-branches-accordion"
              type="single"
              collapsible
            >
              {content.branches.map((branch) => (
                <AccordionItem key={branch.name} value={branch.name}>
                  <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                    {branch.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <BranchDetails branch={branch} channels={channels} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </aside>
        </div>
      </PublicSection>
    </PublicShell>
  );
}

export async function BookConsultationPageView({ locale }: { locale: PublicLocale }) {
  noStore();
  const content = getPublicContent(locale);
  const copy = content.bookingPage;
  const chatCopy = content.bookingChat;
  await getPublicConsultationBookingMode();

  return (
    <PublicShell currentPath={localizedPublicHref("/book-consultation", locale)} locale={locale} navItems={navForPath("/book-consultation", locale)}>
      <BookingFlowHeader
        eyebrow={copy.heroEyebrow}
        title={chatCopy.heroTitle}
        description={chatCopy.heroDescription}
        locale={locale}
      />
      {/*
        One centered assistant console (64rem ≈ 1024px workspace): compact
        intro above, the Consultation Assistant, footer below. No side
        panels, no external progress, no after-submit rail — everything
        operational lives inside the assistant.
      */}
      <div className="mx-auto w-full max-w-[56rem] px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <Suspense fallback={<div aria-hidden="true" className={cn(publicPanel, "min-h-[32rem] rounded-[1.75rem] border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-shell)]")} />}>
          <ConsultationBookingChatFromQuery locale={locale} />
        </Suspense>
      </div>
    </PublicShell>
  );
}

export function PrivacyPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.privacyPage;
  const updatedAt = formatPublicPolicyDate(copy.lastUpdated, locale);

  return (
    <PublicShell currentPath={localizedPublicHref("/privacy", locale)} locale={locale} navItems={navForPath("/privacy", locale)}>
      <PublicSection eyebrow={copy.eyebrow} title={copy.title} description={copy.description} headingLevel="h1">
        {/*
          Magic UI Scroll Progress: fixed gold hairline, no layout shift,
          hidden under reduced motion, mirrored origin in RTL.
        */}
        <ScrollProgress
          aria-hidden="true"
          className="h-0.5 origin-left bg-none bg-[var(--kmt-public-gold)] motion-reduce:hidden rtl:origin-right"
          data-testid="policy-scroll-progress"
        />
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className={cn(publicPanel, "p-5 lg:sticky lg:top-28")}>
            <div className="hidden lg:block">
              <PolicyToc items={copy.sections} label={copy.contentsLabel} />
            </div>
            <Accordion
              className="lg:hidden"
              data-testid="policy-toc-accordion"
              type="single"
              collapsible
            >
              <AccordionItem value="toc">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.contentsLabel}
                </AccordionTrigger>
                <AccordionContent>
                  <PolicyToc hideHeading items={copy.sections} label={copy.contentsLabel} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </aside>

          <article className={cn(publicPanel, "p-5 text-sm leading-8 sm:p-8")} data-testid="privacy-policy">
            <div className="rounded-lg border border-kmt-gold/35 bg-kmt-gold/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-[var(--kmt-public-text)]">{copy.summaryTitle}</h2>
                <p className="text-xs text-[var(--kmt-public-muted)]">
                  {copy.lastUpdatedLabel}: <time dateTime={copy.lastUpdated}>{updatedAt}</time>
                </p>
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {copy.summaryItems.map((item) => (
                  <div key={item.label}>
                    <dt className={cn("text-xs font-semibold", publicGoldText)}>{item.label}</dt>
                    <dd className="mt-1 leading-7 text-[var(--kmt-public-muted)]">
                      <bdi>{item.value}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-8 space-y-10">
              {copy.sections.map((section) => (
                <section key={section.id} className="scroll-mt-28 border-t border-[var(--kmt-public-line)] pt-8" id={section.id}>
                  <h2 className="text-2xl font-semibold leading-tight text-[var(--kmt-public-text)]">{section.title}</h2>
                  <div className={cn("mt-4 max-w-[65ch] space-y-4", publicMutedText)}>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.bullets.length > 0 ? (
                      <ul className="list-disc space-y-2 ps-5 marker:text-[var(--kmt-public-gold)]">
                        {section.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {section.links.length > 0 ? (
                      <ul className="flex flex-wrap gap-3 pt-1">
                        {section.links.map((link) => {
                          const external = link.href.startsWith("http");

                          return (
                            <li key={link.href}>
                              <a
                                className="inline-flex min-h-11 items-center rounded-md border border-kmt-gold/35 px-3 py-2 font-semibold text-[var(--kmt-public-text)] transition-colors duration-kmt-normal ease-kmt-out motion-reduce:transition-none hover:border-kmt-gold hover:bg-kmt-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
                                href={link.href}
                                rel={external ? "noreferrer" : undefined}
                                target={external ? "_blank" : undefined}
                              >
                                <bdi>{link.label}</bdi>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </PublicSection>
    </PublicShell>
  );
}

export function TermsPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.termsPage;
  const updatedAt = formatPublicPolicyDate(copy.lastUpdated, locale);

  return (
    <PublicShell currentPath={localizedPublicHref("/terms", locale)} locale={locale} navItems={navForPath("/terms", locale)}>
      <PublicSection eyebrow={copy.eyebrow} title={copy.title} description={copy.description} headingLevel="h1">
        <ScrollProgress
          aria-hidden="true"
          className="h-0.5 origin-left bg-none bg-[var(--kmt-public-gold)] motion-reduce:hidden rtl:origin-right"
          data-testid="policy-scroll-progress"
        />
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className={cn(publicPanel, "p-5 lg:sticky lg:top-28")}>
            <div className="hidden lg:block">
              <PolicyToc items={copy.sections} label={copy.contentsLabel} />
            </div>
            <Accordion
              className="lg:hidden"
              data-testid="policy-toc-accordion"
              type="single"
              collapsible
            >
              <AccordionItem value="toc">
                <AccordionTrigger className="text-start text-base font-semibold text-[var(--kmt-public-text)] hover:no-underline">
                  {copy.contentsLabel}
                </AccordionTrigger>
                <AccordionContent>
                  <PolicyToc hideHeading items={copy.sections} label={copy.contentsLabel} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </aside>

          <article className={cn(publicPanel, "p-5 text-sm leading-8 sm:p-8")} data-testid="terms-policy">
            <div className="rounded-lg border border-kmt-gold/35 bg-kmt-gold/10 px-5 py-4">
              <p className="text-xs text-[var(--kmt-public-muted)]">
                {copy.lastUpdatedLabel}: <time dateTime={copy.lastUpdated}>{updatedAt}</time>
              </p>
            </div>

            <div className="mt-8 space-y-10">
              {copy.sections.map((section) => (
                <section key={section.id} className="scroll-mt-28 border-t border-[var(--kmt-public-line)] pt-8" id={section.id}>
                  <h2 className="text-2xl font-semibold leading-tight text-[var(--kmt-public-text)]">{section.title}</h2>
                  <div className={cn("mt-4 max-w-[65ch] space-y-4", publicMutedText)}>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </PublicSection>
    </PublicShell>
  );
}

async function loadArticles(locale: PublicLocale) {
  if (!shouldLoadDatabaseContent()) {
    return [];
  }

  try {
    return await listPublishedArticleCards(locale);
  } catch {
    return [];
  }
}

async function loadArticle(locale: PublicLocale, slug: string) {
  if (!shouldLoadDatabaseContent()) {
    return null;
  }

  try {
    return await getPublishedArticleBySlug(locale, slug);
  } catch {
    return null;
  }
}

async function loadCaseStudies(locale: PublicLocale) {
  if (!shouldLoadDatabaseContent()) {
    return [];
  }

  try {
    return await listPublishedCaseStudyCards(locale);
  } catch {
    return [];
  }
}

async function loadCaseStudy(locale: PublicLocale, slug: string) {
  if (!shouldLoadDatabaseContent()) {
    return null;
  }

  try {
    return await getPublishedCaseStudyBySlug(locale, slug);
  } catch {
    return null;
  }
}

function shouldLoadDatabaseContent() {
  return Boolean(process.env.DATABASE_URL);
}

function CaseStudyBlock({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <section className="border-t border-[var(--kmt-public-line)] pt-5">
      <div className="flex gap-4">
        <span aria-hidden="true" className={cn("mt-1 text-sm font-semibold tabular-nums", publicGoldText)}>
          <bdi>{String(index + 1).padStart(2, "0")}</bdi>
        </span>
        <div>
          <h2 className="text-xl font-semibold text-[var(--kmt-public-text)]">{title}</h2>
          <p className={cn("mt-2 leading-8", publicMutedText)}>{body}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Minimal rich-text renderer for article bodies: blocks are separated by a
 * blank line, `## ` lines become section headings, and blocks whose every
 * line starts with `- ` become bullet lists. Everything else is a paragraph.
 * Plain text only — no HTML is injected, so direction and escaping inherit
 * from the document safely.
 */
function ArticleBody({ content }: { content: string }) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="mt-6 grid max-w-[65ch] gap-6">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="pt-2 text-xl font-semibold text-[var(--kmt-public-text)] md:text-2xl">
              {block.slice(3).trim()}
            </h2>
          );
        }

        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={index} className="grid gap-2 ps-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="list-disc marker:text-[var(--kmt-public-gold)] leading-8 text-[var(--kmt-public-text)]">
                  {line.slice(2).trim()}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="leading-8 text-[var(--kmt-public-text)]">
            {block}
          </p>
        );
      })}
    </div>
  );
}

function formatPublicPolicyDate(value: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatPublicYear(value: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}
