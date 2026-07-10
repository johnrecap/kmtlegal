import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
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
  publicMotionHeroSpotlight,
  publicMotionIcon,
  publicMotionIconHalo,
  publicMotionImage,
  publicMotionImageCard,
  publicMotionPanelEnter
} from "@/features/public-site/public-motion";

export const publicSectionSurface = "bg-[var(--kmt-public-surface)] text-white";
export const publicSectionMutedSurface = "bg-[var(--kmt-public-surface-muted)] text-white";
export const publicBorder = "border-white/10";
export const publicPanel =
  "rounded-lg border border-white/10 bg-[var(--kmt-public-panel)] text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]";
export const publicPanelHover = cn(publicMotionCardBeam, "kmt-motion-card transition-colors hover:border-kmt-gold/70 hover:bg-white/[0.055]");
export const publicMutedText = "text-[var(--kmt-public-muted)]";
export const publicGoldText = "text-[var(--kmt-public-gold)]";

export function PublicSection({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "start",
  surface = "default",
  headingLevel = "h2"
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  align?: "start" | "center";
  surface?: "default" | "muted" | "transparent";
  headingLevel?: "h1" | "h2";
}) {
  const surfaceClass =
    surface === "transparent"
      ? "text-white"
      : surface === "muted"
        ? publicSectionMutedSurface
        : publicSectionSurface;
  const isCentered = align === "center";
  const Heading = headingLevel;

  return (
    <section className={cn(surfaceClass, className)}>
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className={cn("max-w-3xl", isCentered ? "mx-auto text-center" : undefined)}>
          {eyebrow ? <p className={cn("text-sm font-semibold", publicGoldText)}>{eyebrow}</p> : null}
          <Heading className="mt-2 text-3xl font-semibold leading-tight text-white md:text-4xl">{title}</Heading>
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
  const ambientOverlay = isCompact ? "bg-[#020403]/42" : "bg-[#020403]/38";

  return (
    <section className={cn("relative isolate overflow-hidden bg-kmt-navy text-white", heroHeight)}>
      <Image
        alt=""
        aria-hidden="true"
        className={cn("kmt-motion-hero-image object-cover", imageOpacity, imagePosition)}
        data-testid="public-page-hero-image"
        fill
        priority={!isCompact}
        sizes="100vw"
        src={image}
      />
      <div className={cn("absolute inset-0", ambientOverlay)} />
      <div className="absolute inset-y-0 w-[92%] from-[#050607]/95 via-[#050607]/76 to-transparent ltr:left-0 ltr:bg-gradient-to-r rtl:right-0 rtl:bg-gradient-to-l sm:w-[82%] lg:w-[74%]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#07090b]" />
      <div className={cn("relative mx-auto flex max-w-[1200px] items-center px-4 sm:px-6 lg:px-10", contentHeight)}>
        <div className="kmt-motion-reveal max-w-3xl">
          <p className={cn("text-sm font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.82)]", publicGoldText)}>{eyebrow}</p>
          <h1 className={cn("mt-4 max-w-3xl font-semibold leading-tight drop-shadow-[0_4px_22px_rgba(0,0,0,0.88)]", isCompact ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl")}>{title}</h1>
          <p className={cn("mt-5 max-w-2xl leading-9 text-slate-100 drop-shadow-[0_3px_16px_rgba(0,0,0,0.86)]", isCompact ? "text-base md:text-lg" : "text-lg")}>{description}</p>
          {actions ? <div className={cn("kmt-motion-reveal kmt-motion-reveal-delay mt-8 flex flex-wrap gap-3", publicMotionHeroSpotlight)}>{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function TrustStrip({ items }: { items: ReadonlyArray<{ icon: string; label: string }> }) {
  return (
    <div className="border-y border-white/10 bg-[#090d11]">
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-5 text-sm text-slate-300 sm:px-6 md:grid-cols-3 lg:px-10">
        {items.map((item) => (
          <div key={item.label} className={cn("group flex items-center gap-2", publicMotionPanelEnter)}>
            <MaterialSymbol className={cn(publicMotionIcon, publicMotionIconHalo, publicGoldText)} name={item.icon} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailCta({ serviceTitle, locale = "en" }: { serviceTitle?: string; locale?: PublicLocale }) {
  const content = getPublicContent(locale);
  const href = serviceTitle
    ? localizedPublicHref(`/book-consultation?service=${encodeURIComponent(serviceTitle)}`, locale)
    : localizedPublicHref("/book-consultation", locale);

  return (
    <div className={cn(publicPanel, "p-6")}>
      <h2 className="text-2xl font-semibold text-white">{content.bookingPage.sectionTitle}</h2>
      <p className={cn("mt-3 leading-7", publicMutedText)}>{content.bookingPage.sectionDescription}</p>
      <ButtonLink className={cn(publicMotionButton, publicMotionCta, "mt-5")} href={href} trailingIcon={<MaterialSymbol className={cn("text-base", publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />}>
        {content.shared.bookConsultation}
      </ButtonLink>
    </div>
  );
}

export function PracticeAreaCard({
  icon,
  title,
  summary,
  href,
  locale = "en"
}: {
  icon: string;
  title: string;
  summary: string;
  href: string;
  locale?: PublicLocale;
}) {
  return (
    <Link className={cn(publicPanel, publicPanelHover, "group flex min-h-[190px] flex-col p-5")} href={localizedPublicHref(href, locale)}>
      <MaterialSymbol className={cn("text-4xl", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name={icon} />
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{summary}</p>
      <MaterialSymbol className={cn("mt-auto pt-4 text-xl", publicGoldText, publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />
    </Link>
  );
}

export function ProcessSteps({ steps }: { steps: ReadonlyArray<{ number: string; title: string; summary: string; icon: string }> }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step) => (
        <li key={step.number} className={cn(publicMotionCardBeam, "group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] p-5")}>
          <div className="flex items-center justify-between gap-4">
            <MaterialSymbol className={cn("text-3xl", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name={step.icon} />
            <span className={cn("text-sm font-semibold", publicGoldText)}>{step.number}</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
          <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{step.summary}</p>
        </li>
      ))}
    </ol>
  );
}

export function IndustryGrid({ industries }: { industries: ReadonlyArray<{ title: string; summary: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {industries.map((industry) => (
        <article key={industry.title} className={cn(publicMotionCardBeam, "rounded-lg border border-white/10 bg-white/[0.025] p-5")}>
          <h3 className="text-lg font-semibold text-white">{industry.title}</h3>
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
      <h3 className="mt-3 text-xl font-semibold leading-8 text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">
        {region} · {year}
      </p>
      <p className={cn("mt-4 text-sm leading-7", publicMutedText)}>{summary}</p>
      <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-6 text-slate-400">{privacyNote}</p>
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
        <h3 className="mt-3 text-3xl font-semibold leading-tight text-white">{title}</h3>
        <p className={cn("mt-4 leading-8", publicMutedText)}>{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function FinalCtaBand({
  title,
  description,
  href = "/book-consultation",
  locale = "en"
}: {
  title: string;
  description: string;
  href?: string;
  locale?: PublicLocale;
}) {
  const content = getPublicContent(locale);

  return (
    <section className="border-y border-white/10 bg-[#0f1112] text-white">
      <div className="mx-auto grid max-w-[1200px] gap-5 px-4 py-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-10">
        <div>
          <h2 className="text-3xl font-semibold leading-tight">{title}</h2>
          <p className={cn("mt-3 max-w-2xl leading-8", publicMutedText)}>{description}</p>
        </div>
        <ButtonLink className={cn(publicMotionButton, publicMotionCta)} href={localizedPublicHref(href, locale)} size="lg" trailingIcon={<MaterialSymbol className={cn("text-base", publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />}>
          {content.shared.bookConsultation}
        </ButtonLink>
      </div>
    </section>
  );
}
