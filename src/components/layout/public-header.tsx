"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { MaterialSymbol } from "@/components/ui";
import { getPublicContent } from "@/content/public-content";
import { publicMotionButton, publicMotionCta, publicMotionIcon, publicMotionIconHalo, publicMotionNavLink, publicMotionTextLink } from "@/features/public-site/public-motion";
import { cn } from "@/lib/cn";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
import type { PublicNavItem } from "./public-shell";

export function ConsultationLink({ className, locale, label }: { className?: string; locale: PublicLocale; label: string }) {
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

function ClientLoginLink({ className, label, locale }: { className?: string; label: string; locale: PublicLocale }) {
  return (
    <Link
      aria-label={label}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 text-stone-200 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
        publicMotionButton,
        publicMotionCta,
        className
      )}
      href={`/login?next=/client&locale=${locale}`}
      title={label}
    >
      <MaterialSymbol className={cn("text-lg", publicMotionIcon, publicMotionIconHalo)} name="account_circle" />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export function PublicHeader({
  navItems,
  locale = "en",
  languageHref
}: {
  navItems: PublicNavItem[];
  locale?: PublicLocale;
  languageHref?: string | null;
}) {
  const content = getPublicContent(locale);
  const shell = content.shell;
  const [scrolled, setScrolled] = useState(false);
  const [concealed, setConcealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);

  const insightHrefs = ["/articles", "/case-studies", "/media"];
  const insightItems = navItems.filter((item) => insightHrefs.includes(item.href));
  const articlesItem = insightItems.find((item) => item.href === "/articles");
  const insightChildren = insightItems.filter((item) => item !== articlesItem);
  const insightsHref = articlesItem?.href ?? "/articles";
  const servicesItem = navItems.find((item) => item.href === "/services");
  const practiceLinks = content.footerContent.practiceLinks.slice(0, 6);
  const insightsGroupLabel = content.home.insightsEyebrow;
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    if (servicesItem?.active) return "services";
    if (insightItems.some((item) => item.active)) return "insights";
    return null;
  });

  const closeMobile = () => {
    setMobileOpen(false);
    setMenuOpen(false);
  };

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      setConcealed(y > lastY.current && y > 320);
      lastY.current = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const headerVisible = !concealed || menuOpen || mobileOpen;

  return (
    <header className={cn("sticky top-0 z-50 transition-all duration-300", headerVisible ? "translate-y-0" : "-translate-y-full")}>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 border-b transition-all duration-300",
          scrolled || menuOpen || mobileOpen
            ? "border-kmt-gold/20 bg-[color:var(--kmt-public-header)] shadow-[0_12px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        )}
      />
      <div className="relative mx-auto flex min-h-[76px] max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-controls="public-mobile-menu"
            aria-expanded={mobileOpen}
            aria-label={shell.compactNavLabel}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 text-stone-200 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold lg:hidden"
          >
            <MaterialSymbol className="text-2xl" name={mobileOpen ? "close" : "menu"} />
          </button>
          <KmtBrandLogo href={localizedPublicHref("/", locale)} size="md" surface="dark" variant="lockup" />
        </div>
        <nav aria-label={shell.mainNavLabel} className="hidden items-stretch gap-1 self-stretch lg:flex">
          {navItems.map((item) =>
            item.href === "/services" && servicesItem ? (
              <div
                key={item.href}
                className="flex items-stretch"
                onMouseEnter={() => setMenuOpen(true)}
                onMouseLeave={() => setMenuOpen(false)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenuOpen(false);
                }}
              >
                <Link
                  aria-current={item.active ? "page" : undefined}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                  className={cn(
                    "inline-flex items-center gap-1 px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-kmt-gold",
                    publicMotionNavLink,
                    item.active || menuOpen ? "text-white" : "text-stone-300 hover:text-white"
                  )}
                  href={localizedPublicHref(item.href, locale)}
                  onClick={() => setMenuOpen(false)}
                  onFocus={() => setMenuOpen(true)}
                >
                  {item.label}
                  <MaterialSymbol className={cn("text-lg transition-transform duration-300", menuOpen && "rotate-180")} name="expand_more" />
                </Link>
              </div>
            ) : (
              <Link
                key={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-kmt-gold",
                  publicMotionNavLink,
                  item.active ? "text-white" : "text-stone-300 hover:text-white"
                )}
                href={localizedPublicHref(item.href, locale)}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {languageHref ? (
            <a
              aria-label={shell.languageSwitchLabel}
              className={cn("inline-flex h-11 w-11 items-center justify-center border border-white/15 text-xs font-semibold text-stone-200 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold sm:h-10 sm:w-auto sm:px-3", publicMotionButton, publicMotionCta)}
              data-testid="public-language-switch"
              href={languageHref}
              hrefLang={locale === "ar" ? "en" : "ar"}
            >
              <MaterialSymbol className="text-lg sm:hidden" name="translate" />
              <span className="sr-only sm:not-sr-only">{shell.languageSwitchLabel}</span>
            </a>
          ) : null}
          <ClientLoginLink label={shell.clientLoginCta} locale={locale} />
          <ConsultationLink className="px-3 max-sm:hidden sm:px-4" label={shell.consultationCta} locale={locale} />
        </div>
      </div>

      {servicesItem ? (
        <div
          className={cn(
            "absolute inset-x-0 top-full hidden transition-all duration-300 lg:block",
            menuOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"
          )}
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenuOpen(false);
          }}
        >
          <div className="border-b border-kmt-gold/20 bg-[color:var(--kmt-public-header)] shadow-[0_32px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-10">
              <nav aria-label={shell.practiceLinksLabel}>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {practiceLinks.map((item, index) => (
                    <li key={item.href}>
                      <Link
                        className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
                        href={localizedPublicHref(item.href, locale)}
                        onClick={() => setMenuOpen(false)}
                        tabIndex={menuOpen ? undefined : -1}
                      >
                        <span className="text-xs font-semibold tracking-widest text-kmt-gold/70" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-semibold text-stone-200 transition-colors group-hover:text-white">{item.label}</span>
                        <MaterialSymbol className="ms-auto text-lg text-kmt-gold opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 rtl:rotate-180 rtl:group-hover:-translate-x-1" name="arrow_forward" />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      className={cn("flex items-center gap-2 px-3 py-3 text-sm font-semibold text-kmt-gold transition-colors hover:text-[#f8f3ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold", publicMotionTextLink)}
                      href={localizedPublicHref("/services", locale)}
                      onClick={() => setMenuOpen(false)}
                      tabIndex={menuOpen ? undefined : -1}
                    >
                      {shell.viewAllPracticeAreas}
                    </Link>
                  </li>
                </ul>
              </nav>
              <div className="rounded-xl border border-kmt-gold/25 bg-kmt-gold/10 p-5">
                <p className="text-base font-semibold text-white">{content.bookingPage.sectionTitle}</p>
                <p className="mt-2 text-sm leading-7 text-stone-300">{content.bookingPage.sectionDescription}</p>
                <ConsultationLink className="mt-4 w-full" label={shell.consultationCta} locale={locale} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        id="public-mobile-menu"
        className={cn(
          "absolute inset-x-0 top-full transition-all duration-300 lg:hidden",
          mobileOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"
        )}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeMobile();
        }}
      >
        <div className="border-b border-kmt-gold/20 bg-[color:var(--kmt-public-header)] shadow-[0_32px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <nav aria-label={shell.mainNavLabel} className="mx-auto max-h-[70vh] max-w-[1200px] overflow-y-auto px-4 py-4 sm:px-6">
            <ConsultationLink className="w-full" label={shell.consultationCta} locale={locale} />
            <ul className="mt-3 space-y-1">
              {navItems
                .filter((item) => !insightHrefs.includes(item.href))
                .map((item) => {
                  if (item.href === "/services" && servicesItem) {
                    const expanded = openGroup === "services";
                    return (
                      <li key={item.href}>
                        <div
                          className={cn(
                            "flex min-h-12 items-center rounded-lg transition-colors",
                            item.active ? "bg-kmt-gold/15 text-white" : "text-stone-200 hover:bg-white/[0.04] hover:text-white"
                          )}
                        >
                          <Link
                            aria-current={item.active ? "page" : undefined}
                            className="flex min-h-12 flex-1 items-center px-3 text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-kmt-gold"
                            href={localizedPublicHref(item.href, locale)}
                            onClick={closeMobile}
                            tabIndex={mobileOpen ? undefined : -1}
                          >
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-label={item.label}
                            onClick={() => setOpenGroup(expanded ? null : "services")}
                            tabIndex={mobileOpen ? undefined : -1}
                            className="flex h-12 w-12 items-center justify-center rounded-lg text-stone-300 transition-colors hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-kmt-gold"
                          >
                            <MaterialSymbol className={cn("text-2xl transition-transform duration-300", expanded && "rotate-180")} name="expand_more" />
                          </button>
                        </div>
                        <div className={cn("grid transition-all duration-300", expanded ? "[grid-template-rows:1fr] opacity-100" : "[grid-template-rows:0fr] opacity-0")}>
                          <ul className="overflow-hidden">
                            <li className="ms-3 border-s border-white/10 ps-2">
                              <ul className="space-y-1 py-1">
                                {practiceLinks.map((link) => (
                                  <li key={link.href}>
                                    <Link
                                      className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-stone-300 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-kmt-gold"
                                      href={localizedPublicHref(link.href, locale)}
                                      onClick={closeMobile}
                                      tabIndex={mobileOpen && expanded ? undefined : -1}
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={item.href}>
                      <Link
                        aria-current={item.active ? "page" : undefined}
                        className={cn(
                          "flex min-h-12 items-center rounded-lg px-3 text-[15px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-kmt-gold",
                          item.active ? "bg-kmt-gold/15 text-white" : "text-stone-200 hover:bg-white/[0.04] hover:text-white"
                        )}
                        href={localizedPublicHref(item.href, locale)}
                        onClick={closeMobile}
                        tabIndex={mobileOpen ? undefined : -1}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              {articlesItem && insightChildren.length === 0 ? (
                <li key={articlesItem.href}>
                  <Link
                    aria-current={articlesItem.active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-lg px-3 text-[15px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-kmt-gold",
                      articlesItem.active ? "bg-kmt-gold/15 text-white" : "text-stone-200 hover:bg-white/[0.04] hover:text-white"
                    )}
                    href={localizedPublicHref(articlesItem.href, locale)}
                    onClick={closeMobile}
                    tabIndex={mobileOpen ? undefined : -1}
                  >
                    {articlesItem.label}
                  </Link>
                </li>
              ) : null}
              {insightChildren.length > 0 ? (
                <li>
                  <div
                    className={cn(
                      "flex min-h-12 items-center rounded-lg transition-colors",
                      insightItems.some((item) => item.active) ? "bg-kmt-gold/15 text-white" : "text-stone-200 hover:bg-white/[0.04] hover:text-white"
                    )}
                  >
                    <Link
                      aria-current={insightItems.some((item) => item.active) ? "page" : undefined}
                      className="flex min-h-12 flex-1 items-center px-3 text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-kmt-gold"
                      href={localizedPublicHref(insightsHref, locale)}
                      onClick={closeMobile}
                      tabIndex={mobileOpen ? undefined : -1}
                    >
                      {insightsGroupLabel}
                    </Link>
                    <button
                      type="button"
                      aria-expanded={openGroup === "insights"}
                      aria-label={insightsGroupLabel}
                      onClick={() => setOpenGroup(openGroup === "insights" ? null : "insights")}
                      tabIndex={mobileOpen ? undefined : -1}
                      className="flex h-12 w-12 items-center justify-center rounded-lg text-stone-300 transition-colors hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-kmt-gold"
                    >
                      <MaterialSymbol className={cn("text-2xl transition-transform duration-300", openGroup === "insights" && "rotate-180")} name="expand_more" />
                    </button>
                  </div>
                  <div className={cn("grid transition-all duration-300", openGroup === "insights" ? "[grid-template-rows:1fr] opacity-100" : "[grid-template-rows:0fr] opacity-0")}>
                    <ul className="overflow-hidden">
                      <li className="ms-3 border-s border-white/10 ps-2">
                        <ul className="space-y-1 py-1">
                          {insightChildren.map((item) => (
                            <li key={item.href}>
                              <Link
                                aria-current={item.active ? "page" : undefined}
                                className={cn(
                                  "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-kmt-gold",
                                  item.active ? "bg-kmt-gold/15 text-white" : "text-stone-300 hover:bg-white/[0.04] hover:text-white"
                                )}
                                href={localizedPublicHref(item.href, locale)}
                                onClick={closeMobile}
                                tabIndex={mobileOpen && openGroup === "insights" ? undefined : -1}
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </div>
                </li>
              ) : null}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
