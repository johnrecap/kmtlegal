import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion-ui/reveal";
import { ButtonLink, MaterialSymbol } from "@/components/ui";
import { getPublicContent } from "@/content/public-content";
import { cn } from "@/lib/cn";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
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

export const publicSectionSurface = "bg-[var(--kmt-public-surface)] text-[var(--kmt-public-text)]";
export const publicSectionMutedSurface = "bg-[var(--kmt-public-surface-muted)] text-[var(--kmt-public-text)]";
export const publicBorder = "border-[var(--kmt-public-line)]";
export const publicPanel =
  "rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] text-[var(--kmt-public-text)]";
export const publicPanelHover = cn(publicMotionCardBeam, "kmt-motion-card transition-colors hover:border-kmt-gold/70 hover:bg-[var(--kmt-public-hover)]");
export const publicMutedText = "text-[var(--kmt-public-muted)]";
export const publicGoldText = "text-[var(--kmt-public-gold)]";
export const publicGoldChip = "border-kmt-gold/35 bg-kmt-gold/10 text-[var(--kmt-public-text)]";
export const publicNeutralChip = "border-[var(--kmt-public-line)] bg-[var(--kmt-public-surface-muted)] text-[var(--kmt-public-muted)]";
export const publicPhotoTreatment =
  "object-cover opacity-90 grayscale-[35%] transition-all duration-500 ease-kmt-out motion-reduce:transition-none group-hover:scale-[1.03] group-hover:grayscale-0 group-hover:opacity-100";

export function PublicSection({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "start",
  surface = "default",
  headingLevel = "h2",
  breadcrumbs
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  align?: "start" | "center";
  surface?: "default" | "muted" | "transparent";
  headingLevel?: "h1" | "h2";
  breadcrumbs?: ReactNode;
}) {
  const surfaceClass =
    surface === "transparent"
      ? "text-[var(--kmt-public-text)]"
      : surface === "muted"
        ? publicSectionMutedSurface
        : publicSectionSurface;
  const isCentered = align === "center";
  const Heading = headingLevel;

  return (
    <section className={cn(surfaceClass, className)}>
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className={cn("max-w-3xl", isCentered ? "mx-auto text-center" : undefined)}>
          {breadcrumbs ? <div className="mb-5">{breadcrumbs}</div> : null}
          {eyebrow ? <p className={cn("text-sm font-semibold", publicGoldText)}>{eyebrow}</p> : null}
          <Heading className="mt-2 text-3xl font-semibold leading-tight text-[var(--kmt-public-text)] md:text-4xl">{title}</Heading>
          {description ? <p className={cn("mt-4 text-base leading-8", publicMutedText)}>{description}</p> : null}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imagePosition = "object-center",
  actions,
  size = "full"
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
  actions?: ReactNode;
  size?: "full" | "compact";
}) {
  const isCompact = size === "compact";
  const imageOpacity = "opacity-95";
  const heroHeight = isCompact ? "min-h-[360px] md:min-h-[420px]" : "min-h-[560px]";
  const contentHeight = isCompact ? "min-h-[360px] py-14 md:min-h-[420px]" : "min-h-[560px] py-16";
  const ambientOverlay = isCompact ? "bg-[rgb(var(--kmt-public-scrim)/0.42)]" : "bg-[rgb(var(--kmt-public-scrim)/0.38)]";

  return (
    <section className={cn("relative isolate overflow-hidden bg-[var(--kmt-public-surface)] text-[var(--kmt-public-text)]", heroHeight)}>
      <Image
        alt=""
        aria-hidden="true"
        className={cn("kmt-motion-hero-image object-cover", imageOpacity, imagePosition)}
        data-testid="public-page-hero-image"
        fetchPriority="high"
        fill
        priority
        sizes="100vw"
        src={image}
      />
      <div className={cn("absolute inset-0", ambientOverlay)} />
      <div className="absolute inset-y-0 w-[92%] from-[rgb(var(--kmt-public-scrim)/0.95)] via-[rgb(var(--kmt-public-scrim)/0.76)] to-transparent ltr:left-0 ltr:bg-gradient-to-r rtl:right-0 rtl:bg-gradient-to-l sm:w-[82%] lg:w-[74%]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[var(--kmt-public-surface)]" />
      <div className={cn("relative mx-auto flex max-w-[1200px] items-center px-4 sm:px-6 lg:px-10", contentHeight)}>
        <div className="kmt-motion-reveal max-w-3xl">
          <p className={cn("text-sm font-semibold drop-shadow-[var(--kmt-public-text-shadow)]", publicGoldText)}>{eyebrow}</p>
          <h1 className={cn("mt-4 max-w-3xl font-semibold leading-tight drop-shadow-[var(--kmt-public-text-shadow)]", isCompact ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl")}>{title}</h1>
          <p className={cn("mt-5 max-w-2xl leading-9 text-[var(--kmt-public-muted)] drop-shadow-[var(--kmt-public-text-shadow)]", isCompact ? "text-base md:text-lg" : "text-lg")}>{description}</p>
          {actions ? <div className="kmt-motion-reveal kmt-motion-reveal-delay mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function TrustStrip({ items }: { items: ReadonlyArray<{ icon: string; label: string }> }) {
  const loop = [...items, ...items];

  return (
    <div className="kmt-marquee overflow-hidden border-y border-[var(--kmt-public-line)] bg-[var(--kmt-public-surface-muted)]">
      <div className={cn("kmt-marquee-track flex w-max items-center py-5 text-sm [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]", publicMutedText)}>
        {loop.map((item, index) => (
          <div key={`${item.label}-${index}`} aria-hidden={index >= items.length} className="flex shrink-0 items-center gap-2 pe-12">
            <MaterialSymbol className={cn(publicMotionIcon, publicMotionIconHalo, publicGoldText)} name={item.icon} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicBreadcrumbs({
  ariaLabel,
  items
}: {
  ariaLabel: string;
  items: ReadonlyArray<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label={ariaLabel} className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  className="rounded font-medium text-[var(--kmt-public-muted)] transition-colors hover:text-[var(--kmt-public-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-semibold text-[var(--kmt-public-text)]" : "text-[var(--kmt-public-muted)]"}
                >
                  {item.label}
                </span>
              )}
              {isLast ? null : (
                <MaterialSymbol aria-hidden={true} className="text-sm text-[var(--kmt-public-muted)] rtl:rotate-180" name="chevron_right" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function DetailCta({ serviceTitle, locale = "en" }: { serviceTitle?: string; locale?: PublicLocale }) {
  const content = getPublicContent(locale);
  const href = serviceTitle
    ? localizedPublicHref(`/book-consultation?service=${encodeURIComponent(serviceTitle)}`, locale)
    : localizedPublicHref("/book-consultation", locale);

  return (
    <aside className={cn(publicPanel, "p-6 backdrop-blur-md lg:sticky lg:top-24 lg:self-start")}>
      <h2 className="text-2xl font-semibold text-[var(--kmt-public-text)]">{content.bookingPage.sectionTitle}</h2>
      <p className={cn("mt-3 leading-7", publicMutedText)}>{content.bookingPage.sectionDescription}</p>
      <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-5")} href={href} trailingIcon={<MaterialSymbol className={cn("text-base", publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />}>
        {content.shared.bookConsultation}
      </ButtonLink>
    </aside>
  );
}

export function PracticeAreaCard({
  icon,
  title,
  summary,
  href,
  locale = "en",
  featured = false
}: {
  icon: string;
  title: string;
  summary: string;
  href: string;
  locale?: PublicLocale;
  featured?: boolean;
}) {
  return (
    <Link
      className={cn(
        publicPanel,
        publicPanelHover,
        "group flex h-full min-h-[190px] flex-col p-5",
        featured && "lg:min-h-[420px] lg:p-7"
      )}
      href={localizedPublicHref(href, locale)}
    >
      <div className={cn("flex items-start justify-between gap-3", featured && "lg:flex-none")}>
        <MaterialSymbol className={cn(publicGoldText, publicMotionIcon, publicMotionIconHalo, featured ? "text-5xl lg:text-6xl" : "text-4xl")} name={icon} />
        <MaterialSymbol className={cn("mt-1 text-xl", publicGoldText, publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />
      </div>
      <h3 className={cn("mt-4 text-xl font-semibold text-[var(--kmt-public-text)]", featured && "lg:mt-6 lg:text-2xl")}>{title}</h3>
      <p className={cn("mt-3 text-sm leading-7", publicMutedText, featured && "lg:mt-4 lg:text-base lg:leading-8")}>{summary}</p>
    </Link>
  );
}

export function IndustryGrid({ industries }: { industries: ReadonlyArray<{ title: string; summary: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {industries.map((industry) => (
        <article key={industry.title} className={cn(publicMotionCardBeam, "rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] p-5")}>
          <h3 className="text-lg font-semibold text-[var(--kmt-public-text)]">{industry.title}</h3>
          <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{industry.summary}</p>
        </article>
      ))}
    </div>
  );
}

export function RepresentativeMatterCard({
  label,
  title,
  region,
  year,
  summary,
  href,
  privacyNote,
  locale = "en"
}: {
  label: string;
  title: string;
  region: string;
  year: string;
  summary: string;
  href: string;
  privacyNote: string;
  locale?: PublicLocale;
}) {
  return (
    <Link className={cn(publicPanel, publicPanelHover, "group block p-5")} href={localizedPublicHref(href, locale)}>
      <p className={cn("text-xs font-semibold", publicGoldText)}>{label}</p>
      <h3 className="mt-3 text-xl font-semibold leading-8 text-[var(--kmt-public-text)]">{title}</h3>
      <p className={cn("mt-1 text-xs", publicMutedText)}>
        {region} · {year}
      </p>
      <p className={cn("mt-4 text-sm leading-7", publicMutedText)}>{summary}</p>
      <p className={cn("mt-4 border-t border-[var(--kmt-public-line)] pt-3 text-xs leading-6", publicMutedText)}>{privacyNote}</p>
    </Link>
  );
}

export function LuxuryFeaturePanel({
  image,
  eyebrow,
  title,
  description,
  children
}: {
  image: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(publicPanel, publicMotionCardBeam, "grid overflow-hidden lg:grid-cols-[0.8fr_1.2fr]")}>
      <div className={cn("relative h-full min-h-[320px] overflow-hidden", publicMotionImageCard)}>
        <Image alt="" className={cn("object-cover opacity-80", publicMotionImage)} fill sizes="(min-width: 1024px) 40vw, 100vw" src={image} unoptimized />
      </div>
      <div className="p-6 lg:p-8">
        <p className={cn("text-sm font-semibold", publicGoldText)}>{eyebrow}</p>
        <h3 className="mt-3 text-3xl font-semibold leading-tight text-[var(--kmt-public-text)]">{title}</h3>
        <p className={cn("mt-4 leading-8", publicMutedText)}>{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

