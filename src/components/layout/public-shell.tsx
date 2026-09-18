import type { ReactNode } from "react";
import Link from "next/link";
import { KmtBrandLogo } from "@/components/brand";
import { MaterialSymbol } from "@/components/ui";
import { KmtGoldUnderline } from "@/components/ui/kmt-gold-underline";
import { KmtUnderlinedText } from "@/components/ui/kmt-text-underline";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerCtaLink } from "@/components/ui/shimmer-cta-link";
import { getPublicContent } from "@/content/public-content";
import { publicMotionIcon, publicMotionIconHalo, publicMotionTextLink } from "@/features/public-site/public-motion";
import { cn } from "@/lib/cn";
import { localizedPublicHref, publicLocaleDirection, publicLocalePrefix, stripPublicLocalePrefix, type PublicLocale } from "@/lib/public-locale";
import { PublicHeader } from "./public-header";
import { PublicFloatingDock } from "./public-floating-dock";

export type PublicNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export function PublicShell({
  navItems,
  children,
  className,
  locale = "en",
  currentPath = "/",
  languageHref: languageHrefOverride,
  languageSearch
}: {
  navItems: PublicNavItem[];
  children: ReactNode;
  className?: string;
  locale?: PublicLocale;
  currentPath?: string;
  languageHref?: string | null;
  /**
   * Canonical query string (without "?") preserved on the default language
   * switch href. Pages whose state lives in search params (tokens, payment
   * attempts) pass this so switching language keeps the query intact.
   */
  languageSearch?: string;
}) {
  const content = getPublicContent(locale);
  const shell = content.shell;
  const direction = publicLocaleDirection(locale);
  const searchSuffix = languageSearch ? `?${languageSearch}` : "";
  const defaultLanguageHref = locale === "ar"
    ? `${stripPublicLocalePrefix(currentPath)}${searchSuffix}`
    : `${publicLocalePrefix("ar")}${stripPublicLocalePrefix(currentPath) === "/" ? "" : stripPublicLocalePrefix(currentPath)}${searchSuffix}`;
  const languageHref = languageHrefOverride === undefined ? defaultLanguageHref : languageHrefOverride;
  // The dock steps aside on the consultation route itself: its primary
  // action IS that page, and a fixed overlay must never cover the
  // assistant composer (a persistent focused input). Every other public
  // route keeps the dock. Functional no-overlap wins over ubiquity here.
  const hideDock = stripPublicLocalePrefix(currentPath) === "/book-consultation";

  return (
    <div
      className={cn("min-h-screen bg-[var(--kmt-public-canvas)] text-[var(--kmt-public-text)] selection:bg-kmt-gold/30 selection:text-[var(--kmt-public-text)]", className)}
      data-testid="public-shell"
      dir={direction}
      lang={locale}
    >
      <PublicHeader languageHref={languageHref} locale={locale} navItems={navItems} />
      <main className="bg-[var(--kmt-public-canvas)]">{children}</main>
      {/* Footer body rides the theme-aware public canvas: deep black in dark
          (#050505, identical to the previous forced value), warm paper in
          light. No forced-dark surfaces here. */}
      <footer className="border-t border-kmt-gold/25 bg-[var(--kmt-public-canvas)] text-[var(--kmt-public-muted)]">
        <section className="border-b border-[var(--kmt-public-line)]">
          <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
            <div className="relative grid gap-8 overflow-hidden rounded-2xl border border-kmt-gold/25 bg-[var(--kmt-public-surface-muted)] p-8 text-center sm:p-12 lg:grid-cols-1 lg:items-center">
              <BorderBeam size={110} duration={8} colorFrom="#eac987" colorTo="#a87830" borderWidth={1} />
              <div className="mx-auto max-w-2xl">
                <KmtGoldUnderline variant="short" align="center" />
                <h2 className="mt-6 text-3xl font-semibold leading-tight text-[var(--kmt-public-text)] md:text-4xl">
                  <KmtUnderlinedText
                    text={shell.footerCtaTitle}
                    highlight={locale === "ar" ? "مسألة قانونية" : "a legal matter"}
                  />
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--kmt-public-muted)] md:text-base md:leading-8">{shell.footerCtaDescription}</p>
              </div>
              <div className="flex justify-center">
                <ShimmerCtaLink
                  borderRadius="8px"
                  shimmerDuration="3.4s"
                  className="min-h-12 w-full px-6 text-base font-semibold text-primary-foreground sm:w-auto sm:min-w-72"
                  href={localizedPublicHref("/book-consultation", locale)}
                >
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <span>{shell.consultationCta}</span>
                    <MaterialSymbol className="text-lg" name="event_available" />
                  </span>
                </ShimmerCtaLink>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 text-sm sm:px-6 md:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] lg:px-10">
          <div className="max-w-sm">
            {/* Brand plaque (Phase 7): the full-logo asset has a dark base,
                so it sits in a deliberate dark badge — low-alpha gold border,
                small radius, tight padding — in BOTH themes instead of an
                accidental black rectangle. */}
            <span className="inline-block rounded-[10px] border border-kmt-gold/30 bg-black p-2.5">
              <KmtBrandLogo
                className="max-w-[15rem]"
                href={localizedPublicHref("/", locale)}
                size="sm"
                variant="full"
              />
            </span>
            <p className="mt-6 max-w-xs leading-7 text-[var(--kmt-public-muted)]">{content.footerContent.brandSummary}</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[var(--kmt-public-muted)]">
              <span className="rounded-full border border-kmt-gold/35 px-3 py-2">{shell.confidentiality}</span>
              <span className="rounded-full border border-kmt-gold/35 px-3 py-2">{shell.humanReview}</span>
            </div>
          </div>

          <nav aria-label={shell.practiceLinksLabel}>
            <h2 className="font-semibold text-[var(--kmt-public-text)]">{shell.practiceLinksTitle}</h2>
            <ul className="mt-4 space-y-3">
              {content.footerContent.practiceLinks.slice(0, 4).map((item) => (
                <li key={item.href}>
                  <Link className={cn("inline-flex text-[var(--kmt-public-muted)] transition-colors hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)} href={localizedPublicHref(item.href, locale)}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link className={cn("inline-flex text-[var(--kmt-public-gold)] transition-colors hover:text-[var(--kmt-public-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)} href={localizedPublicHref("/services", locale)}>
                  {shell.viewAllPracticeAreas}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-semibold text-[var(--kmt-public-text)]">{shell.officesTitle}</h2>
            <ul className="mt-4 space-y-4">
              {content.footerContent.offices.map((office) => (
                <li key={office.name}>
                  <p className="font-semibold text-[var(--kmt-public-text)]">{office.name}</p>
                  <p className="mt-1 leading-6 text-[var(--kmt-public-muted)]">{office.address}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-[var(--kmt-public-text)]">{shell.contactTitle}</h2>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-2">
                <MaterialSymbol className={cn("mt-0.5 text-[var(--kmt-public-gold)]", publicMotionIcon, publicMotionIconHalo)} name="mail" />
                <span dir="ltr">contact@kmtlegal.com</span>
              </li>
              <li className="flex gap-2">
                <MaterialSymbol className={cn("mt-0.5 text-[var(--kmt-public-gold)]", publicMotionIcon, publicMotionIconHalo)} name="call" />
                <span>{content.footerContent.contact.phone}</span>
              </li>
              <li className="flex gap-2">
                <MaterialSymbol className={cn("mt-0.5 text-[var(--kmt-public-gold)]", publicMotionIcon, publicMotionIconHalo)} name="schedule" />
                <span>{shell.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal bar: warm secondary surface in light, transparent (deep
            black canvas) in dark — identity unchanged. */}
        <div className="border-t border-[var(--kmt-public-line)] bg-[var(--kmt-public-surface-muted)] dark:bg-transparent">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-5 text-xs text-[var(--kmt-public-muted)] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
            <p>{shell.copyright}</p>
            <div className="flex gap-5">
              <Link className={cn("hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)} href={localizedPublicHref("/privacy", locale)}>
                {shell.privacy}
              </Link>
              <Link className={cn("hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)} href={localizedPublicHref("/terms", locale)}>
                {shell.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>
      {/* Public floating dock (consultation + WhatsApp): fixed overlay with
          click-through surroundings, so it never blocks page content.
          Hidden on the consultation route (see above). */}
      {hideDock ? null : <PublicFloatingDock locale={locale} />}
    </div>
  );
}
