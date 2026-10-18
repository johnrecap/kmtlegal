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
  contentMode = "page",
  className
}: {
  title: string;
  eyebrow?: string;
  navItems: DashboardNavItem[];
  locale: ClientLocale;
  children: ReactNode;
  userLabel: string;
  action?: ReactNode;
  contentMode?: "page" | "conversation";
  className?: string;
}) {
  const copy = getClientContent(locale);
  return (
    <div
      className={cn("client-portal-shell flex h-[var(--client-viewport-height,100dvh)] min-h-0 flex-col overflow-hidden bg-[var(--kmt-client-shell)] text-[var(--kmt-client-text)] selection:bg-kmt-gold/30 selection:text-[var(--kmt-client-text)]", className)}
      data-testid="client-portal-shell"
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      <header className="relative z-50 shrink-0 border-b border-[var(--kmt-client-line)] bg-[var(--kmt-client-header)] shadow-[0_12px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.34)]">
        <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-1.5 px-3 sm:gap-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <ClientMobileNav locale={locale} navItems={navItems} />
            <ClientPortalBrand locale={locale} />
          </div>
          <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
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

      <div className="flex min-h-0 flex-1">
        <ClientSidebarNav locale={locale} navItems={navItems} />
        <main aria-label={title} className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--kmt-client-shell)]", contentMode === "conversation" ? "overflow-hidden" : "overflow-y-auto")} data-testid="client-portal-main">
          {contentMode === "page" && <section className="shrink-0 border-b border-[var(--kmt-client-line)] bg-[linear-gradient(135deg,var(--kmt-client-surface)_0%,var(--kmt-client-surface-muted)_55%,var(--kmt-client-shell)_100%)]">
            <div className="px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
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
          </section>}

          <section className={cn("bg-[var(--kmt-client-shell)]", contentMode === "conversation" ? "flex min-h-0 flex-1 flex-col p-3 sm:p-4 lg:p-6" : "flex-1 shrink-0 px-4 py-8 sm:px-6 lg:px-8 lg:py-10")}>
            {children}
          </section>
          <footer className="shrink-0 border-t border-[var(--kmt-client-line)] bg-[var(--kmt-client-header)] text-[var(--kmt-client-muted)]">
            <div className={cn("flex flex-col gap-2 px-4 text-xs sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8", contentMode === "conversation" ? "py-2" : "py-5")}>
              <p>{copy.shell.footerTitle}</p>
              <p>{copy.shell.footerPrivacy}</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
