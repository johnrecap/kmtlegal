import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import { CapabilityGlowGate } from "@/features/public-site/capability-glow-gate";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { KmtGoldUnderline, type KmtGoldUnderlineVariant } from "@/components/ui/kmt-gold-underline";
import { KmtTextUnderline, KmtUnderlinedText, type KmtTextUnderlineEmphasis } from "@/components/ui/kmt-text-underline";
import { Marquee } from "@/components/ui/marquee";
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
export const publicHairline = "border-t border-[var(--kmt-public-line)]";

export function PublicSection({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "start",
  surface = "default",
  headingLevel = "h2",
  breadcrumbs,
  density = "compact",
  accent,
  descriptionHighlight,
  descriptionEmphasis
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
  /** compact = ledger rhythm (py-12/lg:16); roomy = statement + feature moments (py-16/lg:24). */
  density?: "compact" | "roomy";
  /**
   * Optional KMT gold-underline accent rendered under the header block.
   * Undefined (default) renders nothing — all existing sections stay
   * byte-identical.
   */
  accent?: KmtGoldUnderlineVariant;
  /**
   * Optional single meaningful phrase inside `description` to emphasize with
   * the real Magic UI underline (`KmtTextUnderline`). Copy stays a plain
   * string; when the phrase is absent the sentence renders unchanged.
   */
  descriptionHighlight?: string;
  /** Editorial weight for `descriptionHighlight`. Defaults to "normal". */
  descriptionEmphasis?: KmtTextUnderlineEmphasis;
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
      <div className={cn("mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10", density === "roomy" ? "py-16 lg:py-24" : "py-12 lg:py-16")}>
        <div className={cn("max-w-3xl", isCentered ? "mx-auto text-center" : undefined)}>
          {breadcrumbs ? <div className="mb-5">{breadcrumbs}</div> : null}
          {eyebrow ? <p className={cn("text-sm font-semibold", publicGoldText)}>{eyebrow}</p> : null}
          <Heading className="mt-2 text-3xl font-semibold leading-tight text-[var(--kmt-public-text)] md:text-4xl">{title}</Heading>
          {description ? (
            <p className={cn("mt-4 text-base leading-8", publicMutedText)}>
              {descriptionHighlight ? (
                <KmtUnderlinedText text={description} highlight={descriptionHighlight} emphasis={descriptionEmphasis} />
              ) : (
                description
              )}
            </p>
          ) : null}
          {accent ? <KmtGoldUnderline variant={accent} align={isCentered ? "center" : "start"} className="mt-6" /> : null}
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
  size = "full",
  texture
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
  actions?: ReactNode;
  size?: "full" | "compact";
  /** Optional faint dot texture over the scrim for sub-hero identity. */
  texture?: "dots";
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
      {texture === "dots" ? (
        <div aria-hidden="true" className="kmt-dotgrid absolute inset-0 text-[var(--kmt-public-gold)] opacity-[0.08] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_40%,black,transparent)]" />
      ) : null}
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
    <div className="overflow-hidden border-y border-[var(--kmt-public-line)] bg-[var(--kmt-public-surface-muted)]">
      <span className="sr-only">{items.map((item) => item.label).join(" · ")}</span>
      {/* Travel direction is locale-driven in CSS: LTR lanes use kmt-marquee,
          RTL lanes use the mirrored kmt-marquee-rtl (see globals.css). Do NOT
          re-add Marquee's `reverse` prop — direction:reverse on the LTR
          keyframes breaks the RTL loop (strip renders empty most of the
          cycle). */}
      <Marquee
        aria-hidden="true"
        pauseOnHover
        repeat={2}
        className={cn("kmt-trust-marquee py-5 text-sm [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] [--duration:36s]", publicMutedText)}
      >
        {loop.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex shrink-0 items-center gap-2 pe-12">
            <MaterialSymbol className={cn(publicMotionIcon, publicMotionIconHalo, publicGoldText)} name={item.icon} />
            {item.label}
          </div>
        ))}
      </Marquee>
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

export function LuxuryFeaturePanel({  image,
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

export type CapabilityRowItem = {
  icon: string;
  title: string;
  summary: string;
  href: string;
  chips?: readonly string[];
  meta?: string;
};

/**
 * Premium legal capabilities matrix (2×2 editorial grid). The Aceternity
 * Glowing Effect is used ONLY as the interactive border layer (KMT-gold
 * variant, low opacity, narrow spread); the service panel composition itself
 * is custom-designed for KMT: numeral + icon / title + description / explore
 * link. All services share one treatment — no artificial hierarchy.
 * Hover: border glow follows the pointer, background lifts one black step,
 * title shifts 2–4px, arrow trails, icon halo. No scale/tilt/3D.
 */
export function CapabilityRows({ items, locale = "en" }: { items: ReadonlyArray<CapabilityRowItem>; locale?: PublicLocale }) {
  const content = getPublicContent(locale);
  return (
    <ol className="grid gap-4 md:grid-cols-2">
      {items.map((item, index) => (
        <li key={item.href} className="h-full">
          <BlurFade className="kmt-blur-fade h-full" delay={index * 0.08} direction="up">
            <div className="group relative h-full overflow-hidden rounded-lg border border-kmt-gold/25 bg-[var(--kmt-public-panel)] transition-colors duration-kmt-fast ease-kmt-out hover:border-kmt-gold/70 hover:bg-[var(--kmt-public-hover)] motion-reduce:transition-none dark:bg-[var(--kmt-black-1)] dark:hover:bg-[var(--kmt-black-2)]">
              <CapabilityGlowGate />
              <Link
                className="relative z-10 flex h-full flex-col p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-kmt-gold"
                href={localizedPublicHref(item.href, locale)}
              >
                <div className="flex items-start justify-between gap-4">
                  <span aria-hidden="true" className="text-3xl font-semibold tabular-nums tracking-widest text-[var(--kmt-public-gold)]/50 transition-colors duration-kmt-fast group-hover:text-[var(--kmt-public-gold)] motion-reduce:transition-none">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <MaterialSymbol className={cn("text-2xl", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name={item.icon} />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[var(--kmt-public-text)] transition-transform duration-kmt-fast ease-kmt-out group-hover:translate-x-1 motion-reduce:transform-none rtl:group-hover:-translate-x-1">{item.title}</h3>
                <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{item.summary}</p>
                {item.chips?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.chips.slice(0, 5).map((chip) => (
                      <span key={chip} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", publicGoldChip)}>
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className={cn("mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold", publicGoldText)}>
                  {content.shared.viewDetails}
                  <MaterialSymbol className={cn("text-xl", publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />
                </span>
              </Link>
            </div>
          </BlurFade>
        </li>
      ))}
    </ol>
  );
}

export type MatterRowItem = {
  label: string;
  title: string;
  region: string;
  year: string;
  summary: string;
  href: string;
  privacyNote: string;
};

/**
 * Representative matters as an Aceternity Hover Effect grid: all three
 * matters stay discoverable at once (no carousel). Hovering one matter moves
 * a restrained deep-black/gold background behind it. Numerals 01/02/03 stay
 * visible, each card keeps its region/year framing and its anonymization
 * footnote. No scale jump, tilt, or dramatic glow. Fully readable on touch
 * (no hover dependency).
 */
export function MatterRows({ matters, locale = "en" }: { matters: ReadonlyArray<MatterRowItem>; locale?: PublicLocale }) {
  return (
    <HoverEffect
      className="gap-4 py-0 md:gap-5"
      items={matters.map((matter, index) => ({
        title: matter.title,
        description: `${matter.label} · ${matter.region} · ${matter.year} — ${matter.summary}`,
        link: localizedPublicHref(matter.href, locale),
        numeral: String(index + 1).padStart(2, "0"),
        footnote: matter.privacyNote
      }))}
    />
  );
}

/** Coverage list without boxes: hairline rows with a gold marker. */
export function IndustryLedger({ industries }: { industries: ReadonlyArray<{ title: string; summary: string }> }) {
  return (
    <ul className="grid gap-x-10 md:grid-cols-2">
      {industries.map((industry, index) => (
        <li key={industry.title} className="group border-t border-[var(--kmt-public-line)] py-5">
          <BlurFade className="kmt-blur-fade" delay={index * 0.06} direction="up">
            <div className="flex gap-4">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--kmt-public-gold)] transition-transform duration-kmt-fast ease-kmt-out group-hover:scale-150 motion-reduce:transform-none" />
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-[var(--kmt-public-text)] transition-colors duration-kmt-fast ease-kmt-out group-hover:text-[var(--kmt-public-gold)] motion-reduce:transition-none">{industry.title}</h3>
                <p className={cn("mt-2 text-sm leading-7", publicMutedText)}>{industry.summary}</p>
              </div>
            </div>
          </BlurFade>
        </li>
      ))}
    </ul>
  );
}

export type InsightLedgerItem = {
  kicker: string;
  title: string;
  excerpt: string;
  href: string;
};

/** Editorial ledger: one lead story, the rest as dated compact rows. */
export function InsightsLedger({ items, locale = "en" }: { items: ReadonlyArray<InsightLedgerItem>; locale?: PublicLocale }) {
  const [lead, ...rest] = items;
  if (!lead) return null;
  return (
    <div>
      <BlurFade className="kmt-blur-fade" direction="up">
        <Link className="group block max-w-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kmt-gold" href={localizedPublicHref(lead.href, locale)}>
          <p className={cn("text-sm font-semibold", publicGoldText)}>{lead.kicker}</p>
          <h3 className="mt-3 text-2xl font-semibold leading-snug text-[var(--kmt-public-text)] transition-colors group-hover:text-[var(--kmt-public-gold)] md:text-3xl">
            {lead.title}
          </h3>
          <p className={cn("mt-4 leading-8", publicMutedText)}>{lead.excerpt}</p>
          <span className={cn("mt-4 inline-flex items-center gap-1 text-sm font-semibold", publicGoldText)}>
            <MaterialSymbol className={cn("text-xl", publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />
          </span>
        </Link>
      </BlurFade>
      {rest.length > 0 ? (
        <ul className="mt-8">
          {rest.map((item) => (
            <li key={item.href} className="border-t border-[var(--kmt-public-line)]">
              <Link className="group flex items-baseline justify-between gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-kmt-gold" href={localizedPublicHref(item.href, locale)}>
                <div className="min-w-0">
                  <p className={cn("text-xs font-semibold", publicGoldText)}>{item.kicker}</p>
                  <h4 className="mt-1 truncate text-lg font-semibold text-[var(--kmt-public-text)] transition-colors group-hover:text-[var(--kmt-public-gold)]">
                    {item.title}
                  </h4>
                </div>
                <MaterialSymbol className={cn("shrink-0 text-xl", publicGoldText, publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Intentional negative space: a rule, one quiet awareness sentence, nothing
 * else. The divider stays the shared KMT section-rule primitive; the single
 * emphasized phrase uses the REAL Magic UI Highlighter (`KmtTextUnderline`,
 * `action="underline"` in logo gold) — the reference implementation for the
 * phrase-underline family. No card.
 */
export function StatementBreak({ text, highlight }: { text: string; highlight?: string }) {
  const marker = highlight && text.includes(highlight) ? highlight : null;
  const [before, after] = marker ? text.split(marker) : [text, ""];
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <KmtGoldUnderline variant="short" align="center" />
        <p className="mt-6 text-xl font-medium leading-9 text-[var(--kmt-public-text)] md:text-2xl md:leading-10">
          {marker ? (
            <>
              {before}
              <KmtTextUnderline emphasis="strong">{marker}</KmtTextUnderline>
              {after}
            </>
          ) : (
            text
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * Booking flow header: a calm, compact tool header, not a photo hero. The
 * step legend mirrors the live BookingProgress labels inside the chat (which
 * owns state). The supporting sentence emphasizes the no-advice boundary
 * with the shared phrase-underline primitive.
 */
export function BookingFlowHeader({
  eyebrow,
  title,
  description,
  steps,
  locale = "en"
}: {
  eyebrow: string;
  title: string;
  description: string;
  steps: ReadonlyArray<string>;
  locale?: PublicLocale;
}) {
  return (
    <section className="border-b border-[var(--kmt-public-line)] bg-[var(--kmt-public-surface)] text-[var(--kmt-public-text)]">
      <div className="kmt-motion-reveal mx-auto max-w-[1200px] px-4 pb-8 pt-10 sm:px-6 md:pt-12 lg:px-10">
        <div className="max-w-3xl">
          <p className={cn("text-sm font-semibold", publicGoldText)}>{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">{title}</h1>
          <p className={cn("mt-5 max-w-2xl text-base leading-9 md:text-lg", publicMutedText)}>
            <KmtUnderlinedText
              text={description}
              highlight={locale === "ar" ? "لا يقدم أي رأي قانوني" : "does not provide legal advice"}
            />
          </p>
        </div>
        <ol className="mt-8 flex flex-wrap items-center gap-2" aria-label={steps.join(" · ")}>
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="h-px w-6 bg-[var(--kmt-public-line)] sm:w-10" />
              ) : null}
              <span
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
                  index === 0
                    ? "border-kmt-gold/70 bg-kmt-gold/15 text-[var(--kmt-public-text)]"
                    : "border-[var(--kmt-public-line)] text-[var(--kmt-public-muted)]"
                )}
              >
                <span aria-hidden="true" className="text-xs tabular-nums text-[var(--kmt-public-gold)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** What-happens-after strip: a compact connected 4-step rail, not cards. */
export function AfterSubmitStrip({ title, steps }: { title: string; steps: ReadonlyArray<string> }) {
  return (
    <section className={cn(publicPanel, "p-6 sm:p-8")}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-10 bg-gradient-to-r from-[var(--kmt-public-gold)] to-transparent rtl:bg-gradient-to-l" />
        <h2 className="text-xl font-semibold text-[var(--kmt-public-text)]">{title}</h2>
      </div>
      <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {steps.map((step, index) => (
          <li key={step} className="relative border-t border-[var(--kmt-public-line)] pt-4">
            <span aria-hidden="true" className="text-sm font-semibold tabular-nums text-[var(--kmt-public-gold)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className={cn("mt-2 text-sm leading-7", publicMutedText)}>{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

