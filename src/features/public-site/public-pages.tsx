import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import { Tilt, TiltContent } from "@/components/animate-ui";
import { canonicalPublicServiceSlug, findPublicService, getPublicContent, navForPath } from "@/content/public-content";
import { ConsultationBookingChatFromQuery, RequestedLawyerQueryNotice } from "@/features/public-site/booking-query-client";
import { ContactForm } from "@/features/public-site/contact-form";
import { DirectoryFilter } from "@/features/public-site/directory-filter";
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
import { Reveal } from "@/components/motion-ui/reveal";
import {
  DetailCta,
  IndustryGrid,
  LuxuryFeaturePanel,
  PageHero,
  PracticeAreaCard,
  PublicBreadcrumbs,
  PublicSection,
  RepresentativeMatterCard,
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

type FeaturedArticle = Awaited<ReturnType<typeof listPublishedArticleCards>>[number];
type FeaturedCaseStudy = Awaited<ReturnType<typeof listPublishedCaseStudyCards>>[number];

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

export function mediaMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/media", content.mediaPage.metadataTitle, content.mediaPage.metadataDescription);
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
  if (section === "articles" && !slug) return articlesMetadata(locale);
  if (section === "articles" && slug && path.length === 2) return articleDetailMetadata(locale, slug);
  if (section === "case-studies" && !slug) return caseStudiesMetadata(locale);
  if (section === "case-studies" && slug && path.length === 2) return caseStudyDetailMetadata(locale, slug);
  if (section === "media" && path.length === 1) return mediaMetadata(locale);
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
  if (section === "articles" && !slug) return <ArticlesPageView locale={locale} />;
  if (section === "articles" && slug && path.length === 2) return <ArticleDetailPageView locale={locale} slug={slug} />;
  if (section === "case-studies" && !slug) return <CaseStudiesPageView locale={locale} />;
  if (section === "case-studies" && slug && path.length === 2) return <CaseStudyDetailPageView locale={locale} slug={slug} />;
  if (section === "media" && path.length === 1) return <MediaPageView locale={locale} />;
  if (section === "contact" && path.length === 1) return <ContactPageView locale={locale} />;
  if (section === "book-consultation" && path.length === 1) return <BookConsultationPageView locale={locale} />;
  if (section === "privacy" && path.length === 1) return <PrivacyPageView locale={locale} />;
  if (section === "terms" && path.length === 1) return <TermsPageView locale={locale} />;
  notFound();
}

export async function HomePageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.home;
  const featuredContent = await loadFeaturedContent(locale);
  const hasFeaturedContent = featuredContent.articles.length > 0 || featuredContent.caseStudies.length > 0;
  const focusService = content.legalServices.find((service) => service.slug === "corporate-business-services") ?? content.legalServices[0];
  const currentPath = localizedPublicHref("/", locale);

  return (
    <PublicShell currentPath={currentPath} locale={locale} navItems={navForPath("/", locale)}>
      <HeroParallaxLayers
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
        description={copy.heroDescription}
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

      <PublicSection align="center" eyebrow={copy.practiceEyebrow} title={copy.practiceTitle} description={copy.practiceDescription}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.practiceAreaMatrix.map((area, index) => (
            <Reveal
              key={area.key}
              className={cn("h-full", index === 0 && "sm:col-span-2 lg:col-span-2 lg:row-span-2")}
              delay={index * 80}
            >
              <Tilt className="h-full" maxTilt={5}>
                <TiltContent className="h-full">
                  <PracticeAreaCard featured={index === 0} href={area.href} icon={area.icon} locale={locale} summary={area.summary} title={area.title} />
                </TiltContent>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </PublicSection>

      <PublicSection surface="muted" eyebrow={copy.focusEyebrow} title={focusService.title} description={focusService.description}>
        <LuxuryFeaturePanel
          image="/stitch-assets/2484f68d86633ca8.png"
          eyebrow={content.serviceCategories[focusService.category as keyof typeof content.serviceCategories] ?? focusService.category}
          title={focusService.title}
          description={focusService.content}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className={cn("text-sm font-semibold", publicGoldText)}>{content.serviceDetail.outcomesTitle}</p>
              <div className="mt-3 space-y-2.5">
                {focusService.outcomes.slice(0, 4).map((item) => (
                  <div key={item} className="flex gap-2 text-sm leading-7 text-[var(--kmt-public-muted)]">
                    <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="check_circle" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className={cn("text-sm font-semibold", publicGoldText)}>{content.serviceDetail.documentsTitle}</p>
              <div className="mt-3 space-y-2.5">
                {focusService.requiredDocuments.slice(0, 4).map((item) => (
                  <div key={item} className="flex gap-2 text-sm leading-7 text-[var(--kmt-public-muted)]">
                    <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="description" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </LuxuryFeaturePanel>
      </PublicSection>

      <PublicSection align="center" eyebrow={copy.approachEyebrow} title={copy.approachTitle} description={copy.approachDescription}>
        <ProcessSteps steps={copy.approachSteps} />
      </PublicSection>

      <PublicSection surface="muted" align="center" eyebrow={copy.representativeEyebrow} title={copy.representativeTitle} description={copy.representativeDescription}>
        <div className="grid gap-4 md:grid-cols-3">
          {content.representativeMatters.map((matter) => (
            <RepresentativeMatterCard key={matter.title} {...matter} locale={locale} />
          ))}
        </div>
      </PublicSection>

      <PublicSection eyebrow={copy.industriesEyebrow} title={copy.industriesTitle} description={copy.industriesDescription}>
        <IndustryGrid industries={content.publicIndustries} />
      </PublicSection>

      <PublicSection surface="muted" eyebrow={copy.teamEyebrow} title={copy.teamTitle} description={copy.teamDescription}>
        <div className="grid gap-4 md:grid-cols-3">
          {content.lawyers.map((lawyer, index) => (
            <Reveal key={lawyer.slug} delay={index * 100} className="h-full">
            <Tilt className="h-full" maxTilt={5}>
              <TiltContent className="h-full">
                <Link className={cn(publicPanel, publicPanelHover, "group block h-full overflow-hidden")} href={localizedPublicHref(`/team/${lawyer.slug}`, locale)}>
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image alt={lawyer.name} className={publicPhotoTreatment} fill sizes="(min-width: 768px) 33vw, 100vw" src={lawyer.image} />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-[var(--kmt-public-text)]">{lawyer.name}</h3>
                    <p className={cn("mt-1 text-sm", publicMutedText)}>{lawyer.title}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lawyer.specialties.slice(0, 2).map((specialty) => (
                        <Badge key={specialty} className={publicGoldChip}>
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Link>
              </TiltContent>
            </Tilt>
            </Reveal>
          ))}
        </div>
      </PublicSection>

      <PublicSection eyebrow={copy.insightsEyebrow} title={copy.insightsTitle} description={copy.insightsDescription}>
        {hasFeaturedContent ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {featuredContent.articles.map((article) => (
              <Link key={article.slug} className={cn(publicPanel, publicPanelHover, "block p-5")} href={localizedPublicHref(`/articles/${article.slug}`, locale)}>
                <p className={cn("text-sm font-semibold", publicGoldText)}>{article.readTime}</p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--kmt-public-text)]">{article.title}</h3>
                <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{article.excerpt}</p>
              </Link>
            ))}
            {featuredContent.caseStudies.map((study) => (
              <Link key={study.slug} className={cn(publicPanel, publicPanelHover, "block p-5")} href={localizedPublicHref(`/case-studies/${study.slug}`, locale)}>
                <p className={cn("text-sm font-semibold", publicGoldText)}>{copy.caseStudyAnonymous}</p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--kmt-public-text)]">{study.title}</h3>
                <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{study.summary}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className={cn(publicPanel, "flex flex-wrap items-center justify-between gap-4 p-6")}>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[var(--kmt-public-text)]">{content.shared.insightsEmptyTitle}</p>
              <p className={cn("mt-2 max-w-2xl text-sm leading-7", publicMutedText)}>{content.shared.insightsEmptyDescription}</p>
            </div>
            <ButtonLink href={localizedPublicHref("/articles", locale)} variant="secondary">
              {content.shared.insightsEmptyCta}
            </ButtonLink>
          </div>
        )}
      </PublicSection>

    </PublicShell>
  );
}

export function ServicesPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.servicesPage;

  return (
    <PublicShell currentPath={localizedPublicHref("/services", locale)} locale={locale} navItems={navForPath("/services", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/b8b47a1dd8d5ce08.png" imagePosition="object-[center_62%]" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={copy.sectionTitle} description={copy.sectionDescription}>
        <DirectoryFilter
          emptyTitle={copy.emptyTitle}
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
            <h2 className="mt-8 text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.includedTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {service.subServices.map((subService) => (
                <Badge key={subService} className={publicGoldChip}>
                  {subService}
                </Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.documentsTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {service.requiredDocuments.map((document) => (
                <Badge key={document} className={publicGoldChip}>
                  {document}
                </Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-[var(--kmt-public-text)]">{copy.outcomesTitle}</h2>
            <ul className={cn("mt-4 space-y-3", publicMutedText)}>
              {service.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2">
                  <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="check_circle" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-8 !border-kmt-gold/35 !text-[var(--kmt-public-text)] hover:!bg-kmt-gold hover:!text-primary-foreground")} href={localizedPublicHref("/services", locale)} variant="secondary">
              {copy.backToServices}
            </ButtonLink>
          </article>
          <DetailCta locale={locale} serviceTitle={service.title} />
        </div>
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
          emptyTitle={copy.emptyTitle}
          locale={locale}
          items={content.lawyers.map((lawyer) => ({
            title: lawyer.name,
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
  const [article, alternateArticle] = await Promise.all([loadArticle(locale, slug), loadArticle(alternateLocale, slug)]);
  if (!article) notFound();
  const copy = content.articleDetail;

  return (
    <PublicShell
      currentPath={localizedPublicHref(`/articles/${article.slug}`, locale)}
      languageHref={alternateArticle ? localizedPublicHref(`/articles/${alternateArticle.slug}`, alternateLocale) : null}
      locale={locale}
      navItems={navForPath("/articles", locale)}
    >
      <PublicSection eyebrow={article.readTime} title={article.title} description={article.excerpt}>
        <article className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className={cn(publicPanel, "p-6")}>
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">{article.category}</Badge>
              <Badge className="border-white/15 bg-white/5 text-slate-200">{article.publishedAt}</Badge>
            </div>
            <p className="text-lg leading-9 text-white">{article.content}</p>
            <div className="mt-8 rounded-lg border border-amber-300/35 bg-amber-950/35 p-4 text-sm leading-7 text-amber-100">{copy.disclaimer}</div>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-6 !border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white")} href={localizedPublicHref("/articles", locale)} variant="secondary">
              {copy.backToArticles}
            </ButtonLink>
          </div>
          <DetailCta locale={locale} />
        </article>
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

export function MediaPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.mediaPage;

  return (
    <PublicShell currentPath={localizedPublicHref("/media", locale)} locale={locale} navItems={navForPath("/media", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/f9addb2d07ebf63d.png" imagePosition="object-[center_52%]" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={copy.sectionTitle} description={copy.sectionDescription}>
        <div className="grid gap-4 md:grid-cols-3">
          {content.mediaItems.map((item) => (
            <article key={item.title} className={cn(publicPanel, publicPanelHover, "p-5")}>
              <div className="flex items-center justify-between gap-3">
                <Badge className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">{item.type}</Badge>
                <span className="text-xs text-slate-400">{item.date}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">{item.title}</h2>
              <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{item.description}</p>
            </article>
          ))}
        </div>
      </PublicSection>
    </PublicShell>
  );
}

export function ContactPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.contactPage;

  return (
    <PublicShell currentPath={localizedPublicHref("/contact", locale)} locale={locale} navItems={navForPath("/contact", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/11c3bae2e63b7192.png" imagePosition="object-[center_48%]" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={copy.sectionTitle} description={copy.sectionDescription}>
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <ContactForm locale={locale} />
          <aside className="grid gap-4">
            {content.branches.map((branch) => (
              <section key={branch.name} className={cn(publicPanel, publicMotionCardBeam, "p-5")}>
                <h2 className="text-xl font-semibold text-white">{branch.name}</h2>
                <p className={cn("mt-3 flex gap-2 text-sm leading-7", publicMutedText)}>
                  <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="location_on" />
                  {branch.address}
                </p>
                <p className={cn("mt-2 text-sm", publicMutedText)}>{branch.phone}</p>
                <p className={cn("mt-1 text-sm", publicMutedText)}>{branch.email}</p>
              </section>
            ))}
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
      <PageHero
        eyebrow={copy.heroEyebrow}
        image="/stitch-assets/b8b47a1dd8d5ce08.png"
        imagePosition="object-[center_62%]"
        size="compact"
        title={chatCopy.heroTitle}
        description={chatCopy.heroDescription}
      />
      <PublicSection
        eyebrow={copy.sectionEyebrow}
        title={chatCopy.sectionTitle}
        description={chatCopy.sectionDescription}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Suspense fallback={<div aria-hidden="true" className={cn(publicPanel, "min-h-[36rem] rounded-[1.75rem] border-kmt-gold/35 bg-black/30")} />}>
            <ConsultationBookingChatFromQuery locale={locale} />
          </Suspense>
          <aside className="space-y-4 lg:pt-2">
            <section className={cn(publicPanel, publicMotionCardBeam, "p-5")}>
              <h2 className="text-lg font-semibold text-white">{chatCopy.trustTitle}</h2>
              <div className="mt-4 space-y-4">
                {chatCopy.trustItems.map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-kmt-gold/25 bg-kmt-gold/10 text-kmt-gold">
                      <MaterialSymbol className={cn("text-lg", publicMotionIcon, publicMotionIconHalo)} name={item.icon} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className={cn("mt-1 text-sm leading-6", publicMutedText)}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Suspense fallback={null}>
                <RequestedLawyerQueryNotice label={copy.requestedLawyer} />
              </Suspense>
            </section>
          </aside>
        </div>
      </PublicSection>
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
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className={cn(publicPanel, "p-5 lg:sticky lg:top-28")}>
            <nav aria-label={copy.contentsLabel}>
              <h2 className="text-lg font-semibold text-white">{copy.contentsLabel}</h2>
              <ol className="mt-4 space-y-2 text-sm">
                {copy.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      className={cn(
                        "flex min-h-10 items-center gap-2 rounded-md px-2 py-1.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
                      )}
                      href={`#${section.id}`}
                    >
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className={cn(publicPanel, "p-5 text-sm leading-8 sm:p-8")} data-testid="privacy-policy">
            <div className="rounded-lg border border-kmt-gold/30 bg-kmt-gold/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">{copy.summaryTitle}</h2>
                <p className="text-xs text-amber-100">
                  {copy.lastUpdatedLabel}: <time dateTime={copy.lastUpdated}>{updatedAt}</time>
                </p>
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {copy.summaryItems.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-semibold text-kmt-gold">{item.label}</dt>
                    <dd className="mt-1 leading-7 text-slate-200">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-8 space-y-10">
              {copy.sections.map((section) => (
                <section key={section.id} className="scroll-mt-28 border-t border-white/10 pt-8" id={section.id}>
                  <h2 className="text-2xl font-semibold leading-tight text-white">{section.title}</h2>
                  <div className={cn("mt-4 space-y-4", publicMutedText)}>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.bullets.length > 0 ? (
                      <ul className="list-disc space-y-2 ps-5 marker:text-kmt-gold">
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
                                className="inline-flex min-h-11 items-center rounded-md border border-kmt-gold/35 px-3 py-2 font-semibold text-amber-100 transition-colors hover:border-kmt-gold hover:bg-kmt-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
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

  return (
    <PublicShell currentPath={localizedPublicHref("/terms", locale)} locale={locale} navItems={navForPath("/terms", locale)}>
      <PublicSection eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
        <div className={cn(publicPanel, "space-y-8 p-6 text-sm leading-8")}>
          {copy.blocks.map((block) => (
            <PolicyBlock key={block.title} title={block.title}>
              {block.body}
            </PolicyBlock>
          ))}
        </div>
      </PublicSection>
    </PublicShell>
  );
}

async function loadFeaturedContent(locale: PublicLocale): Promise<{
  articles: FeaturedArticle[];
  caseStudies: FeaturedCaseStudy[];
}> {
  if (!shouldLoadDatabaseContent()) {
    return { articles: [], caseStudies: [] };
  }

  try {
    const [articles, caseStudies] = await Promise.all([listPublishedArticleCards(locale), listPublishedCaseStudyCards(locale)]);
    return {
      articles: articles.slice(0, 2),
      caseStudies: caseStudies.slice(0, 1)
    };
  } catch {
    return { articles: [], caseStudies: [] };
  }
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

function PolicyBlock({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className={cn("mt-3", publicMutedText)}>{children}</p>
    </section>
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
