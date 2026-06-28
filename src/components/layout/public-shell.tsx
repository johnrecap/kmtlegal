import type { ReactNode } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui";
import { getPublicContent } from "@/content/public-content";
import { publicMotionButton, publicMotionCta, publicMotionIcon, publicMotionIconHalo, publicMotionNavLink, publicMotionTextLink } from "@/features/public-site/public-motion";
import { cn } from "@/lib/cn";
import { localizedPublicHref, publicLocaleDirection, publicLocalePrefix, stripPublicLocalePrefix, type PublicLocale } from "@/lib/public-locale";

export type PublicNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

function publicNavLabel(item: PublicNavItem) {
  return item.label;
}

function ConsultationLink({ className, locale, label }: { className?: string; locale: PublicLocale; label: string }) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 border border-kmt-gold bg-kmt-gold px-4 text-sm font-semibold text-[#120d07] shadow-[0_10px_24px_rgba(153,123,68,0.22)] transition-colors hover:border-[#c7a363] hover:bg-[#c7a363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
        publicMotionButton,
        publicMotionCta,
        className
      )}
      href={localizedPublicHref("/book-consultation", locale)}
    >
      <span>{label}</span>
      <MaterialSymbol className={cn("text-lg", publicMotionIcon, publicMotionIconHalo)} name="event_available" />
    </Link>
  );
}

function ClientLoginLink({ className, label }: { className?: string; label: string }) {
  return (
    <Link
      aria-label={label}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-white/15 px-3 text-sm font-semibold text-stone-200 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
        publicMotionButton,
        publicMotionCta,
        className
      )}
      href="/login?next=/client"
    >
      <MaterialSymbol className={cn("text-lg", publicMotionIcon, publicMotionIconHalo)} name="account_circle" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function PublicBrand({ condensed = false, locale }: { condensed?: boolean; locale: PublicLocale }) {
  return (
    <Link
      className="group inline-flex min-w-0 items-center gap-3 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kmt-gold"
      href={localizedPublicHref("/", locale)}
    >
      <span className={cn("grid place-items-center border border-kmt-gold/70 bg-kmt-gold/10 text-kmt-gold", condensed ? "h-10 w-10" : "h-11 w-11")}>
        <MaterialSymbol className={cn(condensed ? "text-xl" : "text-2xl", publicMotionIcon, publicMotionIconHalo)} name="balance" />
      </span>
      <span className="min-w-0">
        <span className="block font-label-sm text-[11px] font-semibold uppercase leading-none tracking-[0.22em] text-kmt-gold">KMT</span>
        <span className={cn("block font-semibold leading-tight text-[#f8f3ea]", condensed ? "text-base" : "text-xl")}>Legal</span>
      </span>
    </Link>
  );
}

export function PublicShell({
  navItems,
  children,
  className,
  locale = "en",
  currentPath = "/"
}: {
  navItems: PublicNavItem[];
  children: ReactNode;
  className?: string;
  locale?: PublicLocale;
  currentPath?: string;
}) {
  const content = getPublicContent(locale);
  const shell = content.shell;
  const direction = publicLocaleDirection(locale);
  const languageHref = locale === "ar" ? stripPublicLocalePrefix(currentPath) : `${publicLocalePrefix("ar")}${stripPublicLocalePrefix(currentPath) === "/" ? "" : stripPublicLocalePrefix(currentPath)}`;

  return (
    <div
      className={cn("min-h-screen bg-[#060504] text-[#f8f3ea] selection:bg-kmt-gold/30 selection:text-white", className)}
      data-testid="public-shell"
      dir={direction}
      lang={locale}
    >
      <header className="sticky top-0 z-50 border-b border-kmt-gold/20 bg-[#070604]/95 shadow-[0_12px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <PublicBrand locale={locale} />
          <nav aria-label={shell.mainNavLabel} className="hidden items-stretch gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-[76px] items-center px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-kmt-gold",
                  publicMotionNavLink,
                  item.active ? "text-white" : "text-stone-300 hover:text-white"
                )}
                href={localizedPublicHref(item.href, locale)}
              >
                {publicNavLabel(item)}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <a
              className={cn("hidden min-h-10 items-center border border-white/15 px-3 text-xs font-semibold text-stone-200 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold sm:inline-flex", publicMotionButton, publicMotionCta)}
              data-testid="public-language-switch"
              href={languageHref}
              hrefLang={locale === "ar" ? "en" : "ar"}
            >
              {shell.languageSwitchLabel}
            </a>
            <ClientLoginLink label={shell.clientLoginCta} />
            <ConsultationLink className="px-3 sm:px-4" label={shell.consultationCta} locale={locale} />
          </div>
        </div>
        <nav aria-label={shell.compactNavLabel} className="border-t border-white/10 bg-[#090806]/95 lg:hidden">
          <div className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
                  item.active ? "border-kmt-gold bg-kmt-gold/15 text-white" : "border-transparent text-stone-300 hover:border-kmt-gold/40 hover:text-white"
                )}
                href={localizedPublicHref(item.href, locale)}
              >
                {publicNavLabel(item)}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="bg-[#060504]">{children}</main>
      <footer className="border-t border-kmt-gold/20 bg-[#070604] text-stone-300">
        <section className="border-b border-white/10 bg-[linear-gradient(90deg,rgba(153,123,68,0.20),rgba(153,123,68,0.05)_38%,rgba(0,0,0,0)_72%)]">
          <div className="mx-auto grid max-w-[1200px] gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold leading-tight text-[#f8f3ea] md:text-3xl">{shell.footerCtaTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-300">{shell.footerCtaDescription}</p>
            </div>
            <ConsultationLink className="w-full sm:w-auto" label={shell.consultationCta} locale={locale} />
          </div>
        </section>

        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 text-sm sm:px-6 md:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] lg:px-10">
          <div className="max-w-sm">
            <PublicBrand condensed locale={locale} />
            <p className="mt-5 leading-7 text-stone-300">{content.footerContent.brandSummary}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-stone-400">
              <span className="border border-kmt-gold/30 px-3 py-2">{shell.confidentiality}</span>
              <span className="border border-kmt-gold/30 px-3 py-2">{shell.humanReview}</span>
            </div>
          </div>

          <nav aria-label={shell.practiceLinksLabel}>
            <h2 className="font-semibold text-[#f8f3ea]">{shell.practiceLinksTitle}</h2>
            <ul className="mt-4 space-y-3">
              {content.footerContent.practiceLinks.slice(0, 4).map((item) => (
                <li key={item.href}>
                  <Link className={cn("inline-flex text-stone-300 transition-colors hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)} href={localizedPublicHref(item.href, locale)}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link className={cn("inline-flex text-kmt-gold transition-colors hover:text-[#f8f3ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)} href={localizedPublicHref("/services", locale)}>
                  {shell.viewAllPracticeAreas}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-semibold text-[#f8f3ea]">{shell.officesTitle}</h2>
            <ul className="mt-4 space-y-4">
              {content.footerContent.offices.map((office) => (
                <li key={office.name}>
                  <p className="font-semibold text-stone-100">{office.name}</p>
                  <p className="mt-1 leading-6 text-stone-400">{office.address}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-[#f8f3ea]">{shell.contactTitle}</h2>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-2">
                <MaterialSymbol className={cn("mt-0.5 text-kmt-gold", publicMotionIcon, publicMotionIconHalo)} name="mail" />
                <span>contact@kmtlegal.com</span>
              </li>
              <li className="flex gap-2">
                <MaterialSymbol className={cn("mt-0.5 text-kmt-gold", publicMotionIcon, publicMotionIconHalo)} name="call" />
                <span dir="ltr">+20 100 000 0001</span>
              </li>
              <li className="flex gap-2">
                <MaterialSymbol className={cn("mt-0.5 text-kmt-gold", publicMotionIcon, publicMotionIconHalo)} name="schedule" />
                <span>{shell.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-5 text-xs text-stone-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
            <p>{shell.copyright}</p>
            <div className="flex gap-5">
              <Link className={cn("hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)} href={localizedPublicHref("/privacy", locale)}>
                {shell.privacy}
              </Link>
              <Link className={cn("hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)} href={localizedPublicHref("/terms", locale)}>
                {shell.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
