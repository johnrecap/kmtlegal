import type { ReactNode } from "react";
import Link from "next/link";
import { ButtonLink, MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";

export type PublicNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export function PublicShell({
  navItems,
  children,
  className
}: {
  navItems: PublicNavItem[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-kmt-canvas text-kmt-ink", className)}>
      <header className="sticky top-0 z-30 border-b border-kmt-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link className="text-xl font-semibold text-kmt-ink" href="/">
            KMT Legal
          </Link>
          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "border-b-2 px-3 py-5 text-sm font-medium transition-colors",
                  item.active ? "border-kmt-gold text-kmt-ink" : "border-transparent text-kmt-muted hover:text-kmt-ink"
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ButtonLink href="/book-consultation" size="sm" trailingIcon={<MaterialSymbol className="text-base rtl:rotate-180" name="arrow_forward" />}>
            احجز استشارة
          </ButtonLink>
        </div>
        <nav aria-label="التنقل المختصر" className="border-t border-kmt-border lg:hidden">
          <div className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn("shrink-0 rounded px-3 py-2 text-sm font-medium", item.active ? "bg-kmt-gold/15 text-kmt-ink" : "text-kmt-muted")}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-kmt-border bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 text-sm text-kmt-muted sm:px-6 lg:grid-cols-3 lg:px-10">
          <div>
            <p className="text-lg font-semibold text-kmt-ink">KMT Legal</p>
            <p className="mt-2 leading-6">مكتب محاماة عربي لإدارة الاستشارات والقضايا بوضوح وأمان.</p>
          </div>
          <div>
            <p className="font-semibold text-kmt-ink">مجالات التخصص</p>
            <ul className="mt-2 space-y-2">
              <li>قضايا الشركات</li>
              <li>صياغة العقود</li>
              <li>التحصيل التجاري</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-kmt-ink">تواصل معنا</p>
            <p className="mt-2 leading-6">contact@kmtlegal.com</p>
            <div className="mt-3 flex gap-4">
              <Link className="hover:text-kmt-ink" href="/privacy">
                الخصوصية
              </Link>
              <Link className="hover:text-kmt-ink" href="/terms">
                الشروط
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
