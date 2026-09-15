import type { ReactNode } from "react";
import Link from "next/link";
import { KmtBrandLogo } from "@/components/brand";
import { MaterialSymbol } from "@/components/ui";
import { getPublicContent } from "@/content/public-content";
import { publicMotionIcon, publicMotionIconHalo, publicMotionTextLink } from "@/features/public-site/public-motion";
import { cn } from "@/lib/cn";
import { localizedPublicHref, publicLocaleDirection, publicLocalePrefix, stripPublicLocalePrefix, type PublicLocale } from "@/lib/public-locale";
import { ConsultationLink, PublicHeader } from "./public-header";

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

  return (
    <div
      className={cn("min-h-screen bg-[var(--kmt-public-canvas)] text-[var(--kmt-public-text)] selection:bg-kmt-gold/30 selection:text-[var(--kmt-public-text)]", className)}
      data-testid="public-shell"
      dir={direction}
      lang={locale}
    >
      <PublicHeader languageHref={languageHref} locale={locale} navItems={navItems} />
      <main className="bg-[var(--kmt-public-canvas)]">{children}</main>
      <footer className="border-t border-kmt-gold/25 bg-[var(--kmt-public-header)] text-[var(--kmt-public-muted)]">
        <section className="border-b border-[var(--kmt-public-line)]">
          <div className="mx-auto grid max-w-[1200px] gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold leading-tight text-[var(--kmt-public-text)] md:text-3xl">{shell.footerCtaTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--kmt-public-muted)]">{shell.footerCtaDescription}</p>
            </div>
            <ConsultationLink className="w-full sm:w-auto" label={shell.consultationCta} locale={locale} />
          </div>
        </section>

        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 text-sm sm:px-6 md:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] lg:px-10">
          <div className="max-w-sm">
            <KmtBrandLogo
              className="max-w-[13rem]"
              href={localizedPublicHref("/", locale)}
              size="sm"
              variant="full"
            />
            <p className="mt-5 leading-7 text-[var(--kmt-public-muted)]">{content.footerContent.brandSummary}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--kmt-public-muted)]">
              <span className="border border-kmt-gold/35 px-3 py-2">{shell.confidentiality}</span>
              <span className="border border-kmt-gold/35 px-3 py-2">{shell.humanReview}</span>
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

        <div className="border-t border-[var(--kmt-public-line)]">
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
    </div>
  );
}
