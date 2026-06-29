import type { ReactNode } from "react";
import Link from "next/link";
import { KmtBrandLogo } from "@/components/brand";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { DashboardNavItem } from "./dashboard-shell";

function ClientPortalBrand() {
  return (
    <KmtBrandLogo
      href="/client"
      size="md"
      sublabel="بوابة العميل"
      surface="dark"
      variant="lockup"
    />
  );
}

function ClientPortalNav({
  navItems,
  compact = false
}: {
  navItems: DashboardNavItem[];
  compact?: boolean;
}) {
  return (
    <nav
      aria-label="تنقل بوابة العميل"
      className={compact ? "border-t border-white/10 bg-[#090806]/95 lg:hidden" : "hidden border-t border-white/10 bg-[#090806]/80 lg:block"}
    >
      <div className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 py-2 sm:px-6 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 border-b-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-kmt-gold",
              compact
                ? "min-h-11 px-3 py-2 focus-visible:outline-offset-2"
                : "min-h-12 px-3.5 py-2 focus-visible:outline-offset-2",
              item.active
                ? compact
                  ? "border-kmt-gold bg-kmt-gold/15 text-white"
                  : "border-kmt-gold bg-kmt-gold/[0.08] text-white"
                : compact
                  ? "border-transparent text-stone-300 hover:border-kmt-gold/40 hover:text-white"
                  : "border-transparent text-stone-300 hover:border-kmt-gold/40 hover:text-white"
            )}
            href={item.href}
          >
            <MaterialSymbol className="text-[20px] text-kmt-gold" name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function ClientSiteShell({
  title,
  eyebrow = "بوابة العميل",
  navItems,
  children,
  userLabel,
  action,
  className
}: {
  title: string;
  eyebrow?: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
  userLabel: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("client-portal-shell min-h-screen bg-[#060504] text-[#f8f3ea] selection:bg-kmt-gold/30 selection:text-white", className)}
      data-testid="client-portal-shell"
      dir="rtl"
      lang="ar"
    >
      <header className="sticky top-0 z-50 border-b border-kmt-gold/20 bg-[#070604]/95 shadow-[0_12px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[68px] max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <ClientPortalBrand />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              className="hidden min-h-10 items-center border border-white/15 px-3 text-xs font-semibold text-stone-200 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold md:inline-flex"
              href="/"
            >
              الرجوع للموقع
            </Link>
            <span className="hidden max-w-56 truncate border border-kmt-gold/25 bg-kmt-gold/10 px-3 py-2 text-xs font-semibold text-amber-100 sm:inline-flex">
              {userLabel}
            </span>
            <form action="/api/auth/logout" method="post">
              <button
                aria-label="تسجيل الخروج"
                className="inline-flex h-11 min-w-11 items-center justify-center gap-2 border border-white/15 px-3 text-sm font-semibold text-stone-200 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
                type="submit"
              >
                <MaterialSymbol className="text-[20px]" name="logout" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </form>
          </div>
        </div>
        <ClientPortalNav navItems={navItems} />
        <ClientPortalNav compact navItems={navItems} />
      </header>

      <main className="bg-[#060504]">
        <section className="border-b border-white/10 bg-[linear-gradient(135deg,#0b0a08_0%,#111827_48%,#060504_100%)]">
          <div className="mx-auto max-w-[1200px] px-4 py-7 sm:px-6 lg:px-10 lg:py-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 max-w-3xl">
                <p className="text-sm font-semibold text-kmt-gold">{eyebrow}</p>
                <h1 className="mt-2 break-words text-2xl font-semibold leading-tight text-white md:text-4xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  مساحة آمنة لمتابعة ملفاتك ومواعيدك ومدفوعاتك مع مكتب KMT Legal.
                </p>
              </div>
              {action ? <div className="shrink-0">{action}</div> : null}
            </div>
          </div>
        </section>

        <section className="bg-[#07090b]">
          <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </section>
      </main>

      <footer className="border-t border-kmt-gold/20 bg-[#070604] text-stone-400">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-5 text-xs sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>KMT Legal - بوابة العميل المحمية</p>
          <p>البيانات الظاهرة هنا خاصة بحسابك فقط.</p>
        </div>
      </footer>
    </div>
  );
}
