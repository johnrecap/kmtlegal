import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
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
  publicMotionIconHalo,
  publicMotionImage,
  publicMotionImageCard
} from "@/features/public-site/public-motion";
import {
  DetailCta,
  IndustryGrid,
  LuxuryFeaturePanel,
  PageHero,
  PracticeAreaCard,
  ProcessSteps,
  PublicSection,
  RepresentativeMatterCard,
  TrustStrip,
  publicGoldText,
  publicMutedText,
  publicPanel,
  publicPanelHover
} from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";
import { alternatePublicLanguages, localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
import {
  listPublishedArticleCards,
  listPublishedCaseStudyCards,
  getPublishedArticleBySlug,
  getPublishedCaseStudyBySlug
} from "@/server/public/content-service";

type FeaturedArticle = Awaited<ReturnType<typeof listPublishedArticleCards>>[number];
type FeaturedCaseStudy = Awaited<ReturnType<typeof listPublishedCaseStudyCards>>[number];

export function publicPageMetadata(locale: PublicLocale, pathname: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: localizedPublicHref(pathname, locale),
      languages: alternatePublicLanguages(pathname)
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
  const article = await loadArticle(locale, slug);
  if (!article) return {};

  return publicPageMetadata(locale, `/articles/${article.slug}`, `${article.title} | KMT Legal`, article.excerpt);
}

export function caseStudiesMetadata(locale: PublicLocale) {
  const content = getPublicContent(locale);
  return publicPageMetadata(locale, "/case-studies", content.caseStudiesPage.metadataTitle, content.caseStudiesPage.metadataDescription);
}

export async function caseStudyDetailMetadata(locale: PublicLocale, slug: string): Promise<Metadata> {
  const study = await loadCaseStudy(locale, slug);
  if (!study) return {};

  return publicPageMetadata(locale, `/case-studies/${study.slug}`, `${study.title} | KMT Legal`, study.summary);
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
      <PageHero
        eyebrow={copy.heroEyebrow}
        image="/stitch-assets/6764cfecee488659.png"
        title={copy.heroTitle}
        description={copy.heroDescription}
        actions={
          <>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta)} href={localizedPublicHref("/book-consultation", locale)} size="lg" trailingIcon={<MaterialSymbol className={cn(publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />}>
              {content.shared.bookConsultation}
            </ButtonLink>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta, "!border-white/35 !text-white hover:!bg-white hover:!text-kmt-navy")} href={localizedPublicHref("/services", locale)} size="lg" variant="secondary">
              {content.shared.browsePracticeAreas}
            </ButtonLink>
          </>
        }
      />
      <TrustStrip items={copy.trustItems} />

      <PublicSection align="center" eyebrow={copy.practiceEyebrow} title={copy.practiceTitle} description={copy.practiceDescription}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {content.practiceAreaMatrix.map((area) => (
            <PracticeAreaCard key={area.key} href={area.href} icon={area.icon} locale={locale} summary={area.summary} title={area.title} />
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
          <div className="grid gap-3 md:grid-cols-2">
            {[...focusService.outcomes, ...focusService.requiredDocuments].slice(0, 8).map((item) => (
              <div key={item} className="flex gap-2 text-sm leading-7 text-slate-300">
                <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="check_circle" />
                <span>{item}</span>
              </div>
            ))}
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
          {content.lawyers.map((lawyer) => (
            <Link key={lawyer.slug} className={cn(publicPanel, publicPanelHover, publicMotionImageCard, "block overflow-hidden")} href={localizedPublicHref(`/team/${lawyer.slug}`, locale)}>
              <img alt={lawyer.name} className={cn("h-56 w-full object-cover opacity-90", publicMotionImage)} src={lawyer.image} />
              <div className="p-5">
                <h3 className="text-xl font-semibold text-white">{lawyer.name}</h3>
                <p className={cn("mt-1 text-sm", publicMutedText)}>{lawyer.title}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lawyer.specialties.slice(0, 2).map((specialty) => (
                    <Badge key={specialty} className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PublicSection>

      {hasFeaturedContent ? (
        <PublicSection eyebrow={copy.insightsEyebrow} title={copy.insightsTitle} description={copy.insightsDescription}>
          <div className="grid gap-4 lg:grid-cols-2">
            {featuredContent.articles.map((article) => (
              <Link key={article.slug} className={cn(publicPanel, publicPanelHover, "block p-5")} href={localizedPublicHref(`/articles/${article.slug}`, locale)}>
                <p className={cn("text-sm font-semibold", publicGoldText)}>{article.readTime}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{article.title}</h3>
                <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{article.excerpt}</p>
              </Link>
            ))}
            {featuredContent.caseStudies.map((study) => (
              <Link key={study.slug} className={cn(publicPanel, publicPanelHover, "block p-5")} href={localizedPublicHref(`/case-studies/${study.slug}`, locale)}>
                <p className={cn("text-sm font-semibold", publicGoldText)}>{copy.caseStudyAnonymous}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{study.title}</h3>
                <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{study.summary}</p>
              </Link>
            ))}
          </div>
        </PublicSection>
      ) : null}

    </PublicShell>
  );
}

export function ServicesPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.servicesPage;

  return (
    <PublicShell currentPath={localizedPublicHref("/services", locale)} locale={locale} navItems={navForPath("/services", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/b8b47a1dd8d5ce08.png" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
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

  return (
    <PublicShell currentPath={localizedPublicHref(`/services/${currentSlug}`, locale)} locale={locale} navItems={navForPath("/services", locale)}>
      <PublicSection
        eyebrow={content.serviceCategories[service.category as keyof typeof content.serviceCategories] ?? service.category}
        title={service.title}
        description={service.description}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className={cn(publicPanel, "p-6")}>
            <MaterialSymbol className={cn("text-4xl", publicGoldText)} name={service.icon} />
            <p className={cn("mt-5 leading-8", publicMutedText)}>{service.content}</p>
            <h2 className="mt-8 text-2xl font-semibold text-white">{copy.includedTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {service.subServices.map((subService) => (
                <Badge key={subService} className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">
                  {subService}
                </Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-white">{copy.documentsTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {service.requiredDocuments.map((document) => (
                <Badge key={document} className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">
                  {document}
                </Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-white">{copy.outcomesTitle}</h2>
            <ul className={cn("mt-4 space-y-3", publicMutedText)}>
              {service.outcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2">
                  <MaterialSymbol className={cn("mt-1 text-base", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name="check_circle" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-8 !border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white")} href={localizedPublicHref("/services", locale)} variant="secondary">
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
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/bd64f8e89da8f4f6.png" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
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
            meta: lawyer.bookingEnabled ? copy.bookingAvailable : copy.officeReview
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

  return (
    <PublicShell currentPath={localizedPublicHref(`/team/${lawyer.slug}`, locale)} locale={locale} navItems={navForPath("/team", locale)}>
      <PublicSection eyebrow={lawyer.title} title={lawyer.name} description={lawyer.bio}>
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <img alt={lawyer.name} className="h-[460px] w-full rounded-lg border border-kmt-gold/25 object-cover opacity-90" src={lawyer.image} />
          <div className={cn(publicPanel, "p-6")}>
            <h2 className="text-2xl font-semibold text-white">{copy.specialtiesTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {lawyer.specialties.map((specialty) => (
                <Badge key={specialty} className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">
                  {specialty}
                </Badge>
              ))}
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-white">{copy.languagesTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {lawyer.languages.map((language) => (
                <Badge key={language} className="border-white/15 bg-white/5 text-slate-200">
                  {language}
                </Badge>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-amber-300/35 bg-amber-950/35 p-4 text-sm leading-7 text-amber-100">{copy.bookingNotice}</div>
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
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/b392b48a7cb6b561.png" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
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
  const article = await loadArticle(locale, slug);
  if (!article) notFound();
  const copy = content.articleDetail;

  return (
    <PublicShell currentPath={localizedPublicHref(`/articles/${article.slug}`, locale)} locale={locale} navItems={navForPath("/articles", locale)}>
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
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/2484f68d86633ca8.png" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
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
            meta: copy.anonymousMeta
          }))}
          searchLabel={copy.searchLabel}
        />
      </PublicSection>
    </PublicShell>
  );
}

export async function CaseStudyDetailPageView({ locale, slug }: { locale: PublicLocale; slug: string }) {
  const content = getPublicContent(locale);
  const study = await loadCaseStudy(locale, slug);
  if (!study) notFound();
  const copy = content.caseStudyDetail;

  return (
    <PublicShell currentPath={localizedPublicHref(`/case-studies/${study.slug}`, locale)} locale={locale} navItems={navForPath("/case-studies", locale)}>
      <PublicSection eyebrow={copy.eyebrow} title={study.title} description={study.summary}>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className={cn(publicPanel, "p-6")}>
            <Badge className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">{study.category}</Badge>
            <div className="mt-6 grid gap-5">
              <CaseStudyBlock title={copy.challenge} body={study.challenge} />
              <CaseStudyBlock title={copy.approach} body={study.approach} />
              <CaseStudyBlock title={copy.generalOutcome} body={study.generalOutcome} />
              <CaseStudyBlock title={copy.lessons} body={study.lessons} />
            </div>
            <div className="mt-8 rounded-lg border border-amber-300/35 bg-amber-950/35 p-4 text-sm leading-7 text-amber-100">{study.disclaimer}</div>
            <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-6 !border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white")} href={localizedPublicHref("/case-studies", locale)} variant="secondary">
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
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/f9addb2d07ebf63d.png" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
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
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/11c3bae2e63b7192.png" size="compact" title={copy.heroTitle} description={copy.heroDescription} />
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

export function BookConsultationPageView({ locale }: { locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.bookingPage;
  const chatCopy = content.bookingChat;

  return (
    <PublicShell currentPath={localizedPublicHref("/book-consultation", locale)} locale={locale} navItems={navForPath("/book-consultation", locale)}>
      <PageHero eyebrow={copy.heroEyebrow} image="/stitch-assets/b8b47a1dd8d5ce08.png" size="compact" title={chatCopy.heroTitle} description={chatCopy.heroDescription} />
      <PublicSection eyebrow={copy.sectionEyebrow} title={chatCopy.sectionTitle} description={chatCopy.sectionDescription}>
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

  return (
    <PublicShell currentPath={localizedPublicHref("/privacy", locale)} locale={locale} navItems={navForPath("/privacy", locale)}>
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

function CaseStudyBlock({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className={cn("mt-2 leading-8", publicMutedText)}>{body}</p>
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
