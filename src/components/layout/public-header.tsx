"use client";
import { navigationChildren } from "@/content/site-completion-copy";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import { X } from "lucide-react";
import { KmtBrandLogo } from "@/components/brand";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/animate-ui/components/radix/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/animate-ui/components/radix/tooltip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MaterialSymbol } from "@/components/ui";
import { ShimmerCtaLink } from "@/components/ui/shimmer-cta-link";
import { Menu, MenuItem } from "@/components/ui/navbar-menu";
import { MobileNav, MobileNavHeader, NavBody } from "@/components/ui/resizable-navbar";
import { getPublicContent } from "@/content/public-content";
import { publicMotionButton, publicMotionCta, publicMotionIcon, publicMotionIconHalo, publicMotionNavLink } from "@/features/public-site/public-motion";
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
  languageHref,
  showClientLogin = true
}: {
  navItems: PublicNavItem[];
  locale?: PublicLocale;
  languageHref?: string | null;
  showClientLogin?: boolean;
}) {
  const content = getPublicContent(locale);
  const shell = content.shell;
  const [scrolled, setScrolled] = useState(false);
  const [concealed, setConcealed] = useState(false);
  const [servicesActive, setServicesActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerFocused, setHeaderFocused] = useState(false);
  const [focusGeometryScrolled, setFocusGeometryScrolled] = useState(false);
  const [openGeometryScrolled, setOpenGeometryScrolled] = useState(false);
  const [mobileGeometryScrolled, setMobileGeometryScrolled] = useState(false);
  const lastY = useRef(0);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const closeMobile = () => {
    setMobileOpen(false);
    setServicesActive(null);
    setOpenGroup(null);
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

  // Opening a menu must never shift its trigger under the pointer. Hold the
  // current geometry until the menu closes; the pill otherwise follows scroll.
  const glassed = servicesActive !== null ? openGeometryScrolled : headerFocused ? focusGeometryScrolled : scrolled;
  const toggleGroup = (href: string) => {
    if (servicesActive === null) setOpenGeometryScrolled(headerFocused ? focusGeometryScrolled : scrolled);
    setServicesActive(servicesActive === href ? null : href);
  };
  const sheetSide = locale === "ar" ? "right" : "left";
  const navLinkClasses = "relative inline-flex items-center px-3 text-sm font-semibold transition-colors duration-kmt-fast ease-kmt-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-ring motion-reduce:transition-none";

  const languageAction = languageHref ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          aria-label={shell.languageSwitchLabel}
          className={cn("inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--kmt-public-line)] text-xs font-semibold text-[var(--kmt-public-muted)] transition-colors duration-kmt-fast ease-kmt-out hover:border-[var(--kmt-public-gold)] hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:h-11 sm:w-auto sm:px-3", publicMotionButton, publicMotionCta)}
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
      <header
        data-testid="public-header"
        onFocusCapture={() => { if (!headerFocused) setFocusGeometryScrolled(scrolled); setHeaderFocused(true); }}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeaderFocused(false); }}
        className={cn("sticky top-0 z-50 transition-transform duration-kmt-normal ease-kmt-out motion-reduce:transition-none", !concealed || servicesActive !== null || mobileOpen || headerFocused ? "translate-y-0" : "-translate-y-full")}
      >
        {/* Desktop: Aceternity Resizable Navbar shell + Navbar Menu flyout. */}
        <NavBody visible={glassed} className="px-4 sm:px-6 lg:hidden xl:flex max-w-[1440px]">
          {/* Logo size stays constant across scroll states so the sticky
              header height never shifts on the TOP→SCROLLED transition. */}
          <KmtBrandLogo className={navItems[0]?.active ? "kmt-logo-enter" : undefined} href={localizedPublicHref("/", locale)} size="md" surface="theme" variant="public" />
          <nav aria-label={shell.mainNavLabel} className="flex min-w-0 flex-1 items-stretch justify-center self-stretch">
            <Menu setActive={setServicesActive} className="min-w-0 flex-1 items-center gap-0.5 space-x-0 self-stretch px-0 py-0">
              {navItems.map(item => {const children=navigationChildren(locale,item.href);return children.length ? <MenuItem key={item.href} item={item.href} activeLink={item.active} active={servicesActive} setActive={setServicesActive} onToggle={()=>toggleGroup(item.href)} ariaExpanded={servicesActive===item.href} triggerClassName={cn(navLinkClasses,publicMotionNavLink,"min-h-11")} trigger={<>{item.label}<MaterialSymbol name="expand_more"/></>}><ul className="min-w-56 space-y-1">{children.map(child=><li key={child.href}><Link className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-[var(--kmt-public-hover)] focus-visible:outline" href={localizedPublicHref(child.href,locale)} onClick={()=>setServicesActive(null)}>{child.label}</Link></li>)}</ul></MenuItem>:<Link key={item.href} className={cn(navLinkClasses,publicMotionNavLink,"min-h-11")} href={localizedPublicHref(item.href,locale)} aria-current={item.active?'page':undefined}>{item.label}</Link>;})}
            </Menu>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {languageAction}
            {themeAction}
            {showClientLogin ? <ClientLoginLink label={shell.clientLoginCta} locale={locale} /> : null}
            <ConsultationLink className="px-3 max-sm:hidden sm:px-4" label={shell.consultationCta} locale={locale} />
          </div>
        </NavBody>

        {/* Mobile: Aceternity MobileNav bar + Animate UI Sheet drawer. */}
        <MobileNav visible={mobileOpen ? mobileGeometryScrolled : headerFocused ? focusGeometryScrolled : scrolled} className="px-4 lg:flex xl:hidden">
          <MobileNavHeader className="h-auto min-h-16 w-full flex-wrap gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <Sheet open={mobileOpen} onOpenChange={open => { if (open) setMobileGeometryScrolled(scrolled); else setOpenGroup(null); setMobileOpen(open); }}>
                <SheetTrigger asChild>
                  <button
                    ref={mobileTriggerRef}
                    type="button"
                    aria-expanded={mobileOpen}
                    aria-label={shell.compactNavLabel}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--kmt-public-line)] text-[var(--kmt-public-muted)] transition-colors duration-kmt-fast ease-kmt-out hover:border-[var(--kmt-public-gold)] hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none xl:hidden"
                  >
                    {mobileOpen ? <X aria-hidden="true" size={24} /> : <MaterialSymbol className="text-2xl" name="menu" />}
                  </button>
                </SheetTrigger>
                <SheetContent
                  onCloseAutoFocus={event => { event.preventDefault(); mobileTriggerRef.current?.focus(); }}
                  side={sheetSide}
                  showCloseButton={false}
                  className="w-[min(22rem,90vw)] border-kmt-gold/25 bg-[color:var(--kmt-public-header)] p-0 backdrop-blur-xl"
                >
                  <SheetTitle className="sr-only">{shell.mainNavLabel}</SheetTitle>
                  <nav aria-label={shell.mainNavLabel} className="flex h-full flex-col gap-1 overflow-y-auto px-4 py-5 sm:px-6">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <KmtBrandLogo href={localizedPublicHref("/", locale)} size="sm" variant="public" />
                      <button type="button" aria-label={shell.closeNavigation} onClick={closeMobile} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--kmt-public-line)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                        <X aria-hidden="true" size={20} />
                      </button>
                    </div>
                    <div onClick={closeMobile}>
                      <ConsultationLink className="w-full" label={shell.consultationCta} locale={locale} />
                    </div>
                    <ul className="mt-3 space-y-1">
                      {navItems.map(item=>{const children=navigationChildren(locale,item.href);return <li key={item.href}><div className="flex items-center"><Link className="flex min-h-12 flex-1 items-center px-3 font-semibold" href={localizedPublicHref(item.href,locale)} onClick={closeMobile}>{item.label}</Link>{children.length?<button type="button" className="h-12 w-12 focus-visible:outline" aria-label={item.label} aria-expanded={openGroup===item.href} onClick={()=>setOpenGroup(openGroup===item.href?null:item.href)}><MaterialSymbol name={openGroup===item.href?'expand_less':'expand_more'}/></button>:null}</div>{children.length&&openGroup===item.href?<ul className="ms-4 border-s border-[var(--kmt-public-line)] ps-3">{children.map(child=><li key={child.href}><Link className="flex min-h-11 items-center px-3 text-sm" href={localizedPublicHref(child.href,locale)} onClick={closeMobile}>{child.label}</Link></li>)}</ul>:null}</li>;})}
                    </ul>
                    {showClientLogin ? <Link className="mt-4 flex min-h-11 items-center gap-2 rounded-lg border border-[var(--kmt-public-line)] px-3" href={`/login?next=/client&locale=${locale}`} onClick={closeMobile}>
                      <MaterialSymbol name="account_circle" />{shell.clientLoginCta}
                    </Link> : null}
                  </nav>
                </SheetContent>
              </Sheet>
              <KmtBrandLogo className={navItems[0]?.active ? "kmt-logo-enter" : undefined} href={localizedPublicHref("/", locale)} size="md" surface="theme" variant="public" />
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {languageAction}
              {themeAction}
            </div>
          </MobileNavHeader>
        </MobileNav>
      </header>
    </MotionConfig>
  );
}
