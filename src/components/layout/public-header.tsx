"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import { KmtBrandLogo } from "@/components/brand";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/animate-ui/components/radix/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/animate-ui/components/radix/tooltip";
import { RippleLink } from "@/components/animate-ui/ripple-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MaterialSymbol } from "@/components/ui";
import { ShimmerCtaLink } from "@/components/ui/shimmer-cta-link";
import { Menu, MenuItem } from "@/components/ui/navbar-menu";
import { MobileNav, MobileNavHeader, NavBody } from "@/components/ui/resizable-navbar";
import { getPublicContent } from "@/content/public-content";
import { publicMotionButton, publicMotionCta, publicMotionIcon, publicMotionIconHalo, publicMotionNavLink, publicMotionTextLink } from "@/features/public-site/public-motion";
import { cn } from "@/lib/cn";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
import type { PublicNavItem } from "./public-shell";

export function ConsultationLink({ className, locale, label }: { className?: string; locale: PublicLocale; label: string }) {
  return (
    <ShimmerCtaLink
      className={cn(
        "min-h-11 border border-kmt-gold/60 px-4 text-sm font-semibold text-primary-foreground",
        publicMotionButton,
        publicMotionCta,
        className
      )}
      href={localizedPublicHref("/book-consultation", locale)}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        <span>{label}</span>
        <MaterialSymbol className={cn("text-lg", publicMotionIcon, publicMotionIconHalo)} name="event_available" />
      </span>
    </ShimmerCtaLink>
  );
}

function ClientLoginLink({ className, label, locale }: { className?: string; locale: PublicLocale; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          aria-label={label}
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--kmt-public-line)] text-[var(--kmt-public-muted)] transition-colors duration-kmt-fast ease-kmt-out hover:border-[var(--kmt-public-gold)] hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
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
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Component-locked public header (Phase 1):
 * - Aceternity Resizable Navbar (NavBody/MobileNav) as the animated shell:
 *   transparent + roomy at top, floating compressed deep-black pill w/ gold
 *   hairline after scroll. `visible` is driven by the preserved KMT scroll
 *   state so SSR first paint (unscrolled) matches hydration.
 * - Aceternity Navbar Menu (Menu/MenuItem) for the desktop Services flyout
 *   with real KMT practice data (no demo links).
 * - Animate UI Radix Sheet for the mobile drawer (touch-first, no hover).
 * All routes, locale routing, theme logic, keyboard behavior, and focus
 * handling from the previous header are preserved.
 */
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
  const [servicesActive, setServicesActive] = useState<string | null>(null);
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
    setServicesActive(null);
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

  // Floating pill engages after scroll OR while the Services flyout is open
  // (so the open dropdown always sits on a readable surface at page top).
  const glassed = scrolled || servicesActive !== null || mobileOpen;
  const sheetSide = locale === "ar" ? "right" : "left";
  const navLinkClasses = "relative inline-flex items-center px-3 text-sm font-semibold transition-colors duration-kmt-fast ease-kmt-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-ring motion-reduce:transition-none";

  const languageAction = languageHref ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          aria-label={shell.languageSwitchLabel}
          className={cn("inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--kmt-public-line)] text-xs font-semibold text-[var(--kmt-public-muted)] transition-colors duration-kmt-fast ease-kmt-out hover:border-[var(--kmt-public-gold)] hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:h-10 sm:w-auto sm:px-3", publicMotionButton, publicMotionCta)}
          data-testid="public-language-switch"
          href={languageHref}
          hrefLang={locale === "ar" ? "en" : "ar"}
        >
          <MaterialSymbol className="text-lg sm:hidden" name="translate" />
          <span className="sr-only sm:not-sr-only">{shell.languageSwitchLabel}</span>
        </a>
      </TooltipTrigger>
      <TooltipContent>{shell.languageSwitchLabel}</TooltipContent>
    </Tooltip>
  ) : null;

  const themeAction = (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <ThemeToggle
            className="border border-[var(--kmt-public-line)] text-[var(--kmt-public-muted)] hover:border-[var(--kmt-public-gold)] hover:text-[var(--kmt-public-gold)] focus-visible:outline-ring"
            label={shell.themeToggleLabel}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>{shell.themeToggleLabel}</TooltipContent>
    </Tooltip>
  );

  return (
    <MotionConfig reducedMotion="user">
      <header className={cn("sticky top-0 z-50 transition-transform duration-kmt-normal ease-kmt-out motion-reduce:transition-none", !concealed || servicesActive !== null || mobileOpen ? "translate-y-0" : "-translate-y-full")}>
        {/* Desktop: Aceternity Resizable Navbar shell + Navbar Menu flyout. */}
        <NavBody visible={glassed} className="px-4 sm:px-6">
          {/* Logo size stays constant across scroll states so the sticky
              header height never shifts on the TOP→SCROLLED transition. */}
          <KmtBrandLogo href={localizedPublicHref("/", locale)} size="md" surface="theme" variant="lockup" />
          <nav aria-label={shell.mainNavLabel} className="flex min-w-0 flex-1 items-stretch justify-center self-stretch">
            <Menu setActive={setServicesActive} className="min-w-0 flex-1 items-center gap-0.5 space-x-0 self-stretch px-0 py-0">
              {navItems.map((item) =>
                item.href === "/services" && servicesItem ? (
                  <MenuItem
                    key={item.href}
                    item="services"
                    href={localizedPublicHref(item.href, locale)}
                    activeLink={item.active}
                    ariaExpanded={servicesActive === "services"}
                    triggerClassName={cn(
                      navLinkClasses,
                      publicMotionNavLink,
                      item.active || servicesActive === "services" ? "text-[var(--kmt-public-gold)]" : "text-[var(--kmt-public-muted)] hover:text-[var(--kmt-public-gold)]"
                    )}
                    trigger={
                      <>
                        {item.label}
                        <MaterialSymbol className={cn("text-lg transition-transform duration-kmt-normal ease-kmt-out motion-reduce:transition-none", servicesActive === "services" && "rotate-180")} name="expand_more" />
                        {item.active ? (
                          <span
                            aria-hidden="true"
                            className="kmt-nav-indicator absolute inset-x-3 bottom-2 h-0.5 rounded-full bg-[var(--kmt-public-gold)]"
                          />
                        ) : null}
                      </>
                    }
                    active={servicesActive}
                    setActive={setServicesActive}
                  >
                    <div className="w-[min(36rem,calc(100vw-3rem))]" onClick={() => setServicesActive(null)}>
                      <nav aria-label={shell.practiceLinksLabel}>
                        <ul className="grid gap-1 sm:grid-cols-2">
                          {practiceLinks.map((link, index) => (
                            <li key={link.href}>
                              <Link
                                className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors duration-kmt-fast ease-kmt-out hover:bg-[var(--kmt-public-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                                href={localizedPublicHref(link.href, locale)}
                              >
                                <span className="text-xs font-semibold tabular-nums tracking-widest text-[var(--kmt-public-gold)] opacity-80" aria-hidden="true">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="text-sm font-semibold text-[var(--kmt-public-muted)] transition-colors group-hover:text-[var(--kmt-public-text)]">{link.label}</span>
                                <MaterialSymbol className="ms-auto text-lg text-[var(--kmt-public-gold)] opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 rtl:rotate-180 rtl:group-hover:-translate-x-1" name="arrow_forward" />
                              </Link>
                            </li>
                          ))}
                          <li className="sm:col-span-2">
                            <Link
                              className={cn("flex items-center gap-2 px-3 py-3 text-sm font-semibold text-[var(--kmt-public-gold)] transition-colors hover:text-[var(--kmt-public-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", publicMotionTextLink)}
                              href={localizedPublicHref("/services", locale)}
                            >
                              {shell.viewAllPracticeAreas}
                            </Link>
                          </li>
                        </ul>
                      </nav>
                      <div className="mt-2 rounded-xl border border-kmt-gold/30 bg-kmt-gold/10 p-5">
                        <p className="text-base font-semibold text-[var(--kmt-public-text)]">{content.bookingPage.sectionTitle}</p>
                        <p className="mt-2 text-sm leading-7 text-[var(--kmt-public-muted)]">{content.bookingPage.sectionDescription}</p>
                        <RippleLink
                          className={cn(
                            "mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-kmt-fast ease-kmt-out hover:border-accent hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
                            publicMotionButton,
                            publicMotionCta
                          )}
                          href={localizedPublicHref("/book-consultation", locale)}
                        >
                          <span>{shell.consultationCta}</span>
                          <MaterialSymbol className={cn("text-lg", publicMotionIcon, publicMotionIconHalo)} name="event_available" />
                        </RippleLink>
                      </div>
                    </div>
                  </MenuItem>
                ) : (
                  <Link
                    key={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      navLinkClasses,
                      publicMotionNavLink,
                      item.active ? "text-[var(--kmt-public-gold)]" : "text-[var(--kmt-public-muted)] hover:text-[var(--kmt-public-gold)]"
                    )}
                    href={localizedPublicHref(item.href, locale)}
                  >
                    {item.label}
                    {item.active ? (
                      <span
                        aria-hidden="true"
                        className="kmt-nav-indicator absolute inset-x-3 bottom-2 h-0.5 rounded-full bg-[var(--kmt-public-gold)]"
                      />
                    ) : null}
                  </Link>
                )
              )}
            </Menu>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {languageAction}
            {themeAction}
            <ClientLoginLink label={shell.clientLoginCta} locale={locale} />
            <ConsultationLink className="px-3 max-sm:hidden sm:px-4" label={shell.consultationCta} locale={locale} />
          </div>
        </NavBody>

        {/* Mobile: Aceternity MobileNav bar + Animate UI Sheet drawer. */}
        <MobileNav visible={scrolled} className="px-4">
          <MobileNavHeader className="w-full">
            <div className="flex items-center gap-1">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-expanded={mobileOpen}
                    aria-label={shell.compactNavLabel}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--kmt-public-line)] text-[var(--kmt-public-muted)] transition-colors duration-kmt-fast ease-kmt-out hover:border-[var(--kmt-public-gold)] hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none lg:hidden"
                  >
                    <MaterialSymbol className="text-2xl" name={mobileOpen ? "close" : "menu"} />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side={sheetSide}
                  showCloseButton={false}
                  className="w-[min(22rem,90vw)] border-kmt-gold/25 bg-[color:var(--kmt-public-header)] p-0 backdrop-blur-xl"
                >
                  <SheetTitle className="sr-only">{shell.mainNavLabel}</SheetTitle>
                  <nav aria-label={shell.mainNavLabel} className="flex h-full flex-col gap-1 overflow-y-auto px-4 py-5 sm:px-6">
                    <div onClick={closeMobile}>
                      <ConsultationLink className="w-full" label={shell.consultationCta} locale={locale} />
                    </div>
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
                                    "flex min-h-12 items-center rounded-lg transition-colors duration-kmt-fast ease-kmt-out motion-reduce:transition-none",
                                    item.active ? "bg-kmt-gold/15 text-[var(--kmt-public-text)]" : "text-[var(--kmt-public-muted)] hover:bg-[var(--kmt-public-hover)] hover:text-[var(--kmt-public-text)]"
                                  )}
                                >
                                  <Link
                                    aria-current={item.active ? "page" : undefined}
                                    className="flex min-h-12 flex-1 items-center px-3 text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
                                    href={localizedPublicHref(item.href, locale)}
                                    onClick={closeMobile}
                                  >
                                    {item.label}
                                  </Link>
                                  <button
                                    type="button"
                                    aria-expanded={expanded}
                                    aria-label={item.label}
                                    onClick={() => setOpenGroup(expanded ? null : "services")}
                                    className="flex h-12 w-12 items-center justify-center rounded-lg text-[var(--kmt-public-muted)] transition-colors hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
                                  >
                                    <MaterialSymbol className={cn("text-2xl transition-transform duration-kmt-normal ease-kmt-out motion-reduce:transition-none", expanded && "rotate-180")} name="expand_more" />
                                  </button>
                                </div>
                                <div className={cn("grid transition-all duration-kmt-normal ease-kmt-out motion-reduce:transition-none", expanded ? "[grid-template-rows:1fr] opacity-100" : "[grid-template-rows:0fr] opacity-0")}>
                                  <ul className="overflow-hidden">
                                    <li className="ms-3 border-s border-[var(--kmt-public-line)] ps-2">
                                      <ul className="space-y-1 py-1">
                                        {practiceLinks.map((link) => (
                                          <li key={link.href}>
                                            <Link
                                              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--kmt-public-muted)] transition-colors duration-kmt-fast ease-kmt-out hover:bg-[var(--kmt-public-hover)] hover:text-[var(--kmt-public-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring motion-reduce:transition-none"
                                              href={localizedPublicHref(link.href, locale)}
                                              onClick={closeMobile}
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
                                  "flex min-h-12 items-center rounded-lg px-3 text-[15px] font-semibold transition-colors duration-kmt-fast ease-kmt-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring motion-reduce:transition-none",
                                  item.active ? "bg-kmt-gold/15 text-[var(--kmt-public-text)]" : "text-[var(--kmt-public-muted)] hover:bg-[var(--kmt-public-hover)] hover:text-[var(--kmt-public-text)]"
                                )}
                                href={localizedPublicHref(item.href, locale)}
                                onClick={closeMobile}
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
                              "flex min-h-12 items-center rounded-lg px-3 text-[15px] font-semibold transition-colors duration-kmt-fast ease-kmt-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring motion-reduce:transition-none",
                              articlesItem.active ? "bg-kmt-gold/15 text-[var(--kmt-public-text)]" : "text-[var(--kmt-public-muted)] hover:bg-[var(--kmt-public-hover)] hover:text-[var(--kmt-public-text)]"
                            )}
                            href={localizedPublicHref(articlesItem.href, locale)}
                            onClick={closeMobile}
                          >
                            {articlesItem.label}
                          </Link>
                        </li>
                      ) : null}
                      {insightChildren.length > 0 ? (
                        <li>
                          <div
                            className={cn(
                              "flex min-h-12 items-center rounded-lg transition-colors duration-kmt-fast ease-kmt-out motion-reduce:transition-none",
                              insightItems.some((item) => item.active) ? "bg-kmt-gold/15 text-[var(--kmt-public-text)]" : "text-[var(--kmt-public-muted)] hover:bg-[var(--kmt-public-hover)] hover:text-[var(--kmt-public-text)]"
                            )}
                          >
                            <Link
                              aria-current={insightItems.some((item) => item.active) ? "page" : undefined}
                              className="flex min-h-12 flex-1 items-center px-3 text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
                              href={localizedPublicHref(insightsHref, locale)}
                              onClick={closeMobile}
                            >
                              {insightsGroupLabel}
                            </Link>
                            <button
                              type="button"
                              aria-expanded={openGroup === "insights"}
                              aria-label={insightsGroupLabel}
                              onClick={() => setOpenGroup(openGroup === "insights" ? null : "insights")}
                              className="flex h-12 w-12 items-center justify-center rounded-lg text-[var(--kmt-public-muted)] transition-colors hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
                            >
                              <MaterialSymbol className={cn("text-2xl transition-transform duration-kmt-normal ease-kmt-out motion-reduce:transition-none", openGroup === "insights" && "rotate-180")} name="expand_more" />
                            </button>
                          </div>
                          <div className={cn("grid transition-all duration-kmt-normal ease-kmt-out motion-reduce:transition-none", openGroup === "insights" ? "[grid-template-rows:1fr] opacity-100" : "[grid-template-rows:0fr] opacity-0")}>
                            <ul className="overflow-hidden">
                              <li className="ms-3 border-s border-[var(--kmt-public-line)] ps-2">
                                <ul className="space-y-1 py-1">
                                  {insightChildren.map((item) => (
                                    <li key={item.href}>
                                      <Link
                                        aria-current={item.active ? "page" : undefined}
                                        className={cn(
                                          "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors duration-kmt-fast ease-kmt-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring motion-reduce:transition-none",
                                          item.active ? "bg-kmt-gold/15 text-[var(--kmt-public-text)]" : "text-[var(--kmt-public-muted)] hover:bg-[var(--kmt-public-hover)] hover:text-[var(--kmt-public-text)]"
                                        )}
                                        href={localizedPublicHref(item.href, locale)}
                                        onClick={closeMobile}
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
                </SheetContent>
              </Sheet>
              <KmtBrandLogo href={localizedPublicHref("/", locale)} size="md" surface="theme" variant="lockup" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {languageAction}
              {themeAction}
              <ClientLoginLink label={shell.clientLoginCta} locale={locale} />
            </div>
          </MobileNavHeader>
        </MobileNav>
      </header>
    </MotionConfig>
  );
}
