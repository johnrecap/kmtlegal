import type { ReactNode } from "react";
import Link from "next/link";
import { KmtBrandLogo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { DashboardNavItem } from "./dashboard-shell";
import { getClientContent, type ClientLocale } from "@/content/client-content";
import { ClientLanguageSwitch } from "@/features/client/client-language-switch";
import { ClientHeaderTip } from "./client-header-tip";
import { ClientMobileNav } from "./client-mobile-nav";
import { ClientSidebarNav } from "./client-sidebar-nav";

function ClientPortalBrand({ locale }: { locale: ClientLocale }) {
  const copy = getClientContent(locale);
  return (
    <KmtBrandLogo
      href="/client"
      size="md"
      sublabel={copy.shell.portal}
      surface="theme"
      variant="lockup"
    />
  );
}

export function ClientSiteShell({
  title,
  eyebrow,
  navItems,
  locale,
  children,
  userLabel,
  action,
  className
}: {
  title: string;
  eyebrow?: string;
  navItems: DashboardNavItem[];
  locale: ClientLocale;
  children: ReactNode;
  userLabel: string;
  action?: ReactNode;
  className?: string;
}) {
  const copy = getClientContent(locale);
  return (
    <div
      className={cn("client-portal-shell min-h-screen bg-[var(--kmt-client-shell)] text-[var(--kmt-client-text)] selection:bg-kmt-gold/30 selection:text-[var(--kmt-client-text)]", className)}
      data-testid="client-portal-shell"
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      <header className="sticky top-0 z-50 border-b border-[var(--kmt-client-line)] bg-[var(--kmt-client-header)] shadow-[0_12px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.34)]">
        <div className="mx-auto flex min-h-[68px] max-w-[1200px] items-center justify-between gap-1.5 px-3 sm:gap-3 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <ClientMobileNav locale={locale} navItems={navItems} />
            <ClientPortalBrand locale={locale} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              className="hidden min-h-10 items-center border border-[var(--kmt-client-line)] px-3 text-xs font-semibold text-[var(--kmt-client-muted)] transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold md:inline-flex"
              href={locale === "ar" ? "/ar" : "/"}
            >
              {copy.shell.backToSite}
            </Link>
            <ClientLanguageSwitch locale={locale} />
            <ClientHeaderTip label={copy.shell.themeToggle}>
              <span className="inline-flex">
                <ThemeToggle
                  className="border border-[var(--kmt-client-line)] text-[var(--kmt-client-muted)] hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline-kmt-gold"
                  label={copy.shell.themeToggle}
                />
              </span>
            </ClientHeaderTip>
            <span className="hidden max-w-56 truncate border border-kmt-gold/25 bg-kmt-gold/10 px-3 py-2 text-xs font-semibold text-[var(--kmt-client-gold)] sm:inline-flex">
              {userLabel}
            </span>
            <form action="/api/auth/logout" method="post">
              <ClientHeaderTip label={copy.shell.logout}>
                <button
                  aria-label={copy.shell.logout}
                  className="inline-flex h-11 min-w-11 items-center justify-center gap-2 border border-[var(--kmt-client-line)] px-3 text-sm font-semibold text-[var(--kmt-client-muted)] transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
                  type="submit"
                >
                  <MaterialSymbol className="text-[20px]" name="logout" />
                  <span className="hidden sm:inline">{copy.shell.logoutShort}</span>
                </button>
              </ClientHeaderTip>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] items-start">
        <ClientSidebarNav locale={locale} navItems={navItems} />
        <main className="min-w-0 flex-1 bg-[var(--kmt-client-shell)]">
          <section className="border-b border-[var(--kmt-client-line)] bg-[linear-gradient(135deg,var(--kmt-client-surface)_0%,var(--kmt-client-surface-muted)_55%,var(--kmt-client-shell)_100%)]">
            <div className="mx-auto max-w-[1200px] px-4 py-7 sm:px-6 lg:px-10 lg:py-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0 max-w-3xl">
                  <p className="text-sm font-semibold text-[var(--kmt-client-gold)]">{eyebrow ?? copy.shell.portal}</p>
                  <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-[var(--kmt-client-text)] md:text-4xl">{title}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--kmt-client-muted)]">
                    {copy.shell.description}
                  </p>
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
              </div>
            </div>
          </section>

          <section className="bg-[var(--kmt-client-shell)]">
            <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
          </section>
        </main>
      </div>

      <footer className="border-t border-[var(--kmt-client-line)] bg-[var(--kmt-client-header)] text-[var(--kmt-client-muted)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-5 text-xs sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>{copy.shell.footerTitle}</p>
          <p>{copy.shell.footerPrivacy}</p>
        </div>
      </footer>
    </div>
  );
}
