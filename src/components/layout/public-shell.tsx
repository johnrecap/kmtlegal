import type { ReactNode } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";

export type PublicNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

const footerPracticeLinks = [
  { label: "الشركات والعقود", href: "/services/contract-drafting" },
  { label: "العقارات", href: "/services/real-estate-consultation" },
  { label: "المنازعات التجارية", href: "/services/commercial-disputes" },
  { label: "علاقات العمل", href: "/services/employment-compliance" }
];

const officeLinks = [
  { label: "القاهرة", detail: "وسط القاهرة، قريب من الجهات الإدارية" },
  { label: "اجتماعات أونلاين", detail: "مواعيد مرنة بعد مراجعة الطلب" }
];

function publicNavLabel(item: PublicNavItem) {
  return item.href === "/services" ? "مجالات الخبرة" : item.label;
}

function ConsultationLink({ className }: { className?: string }) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 border border-kmt-gold bg-kmt-gold px-4 text-sm font-semibold text-[#120d07] shadow-[0_10px_24px_rgba(153,123,68,0.22)] transition-colors hover:border-[#c7a363] hover:bg-[#c7a363] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
        className
      )}
      href="/book-consultation"
    >
      <span>احجز استشارة</span>
      <MaterialSymbol className="text-lg" name="event_available" />
    </Link>
  );
}

function PublicBrand({ condensed = false }: { condensed?: boolean }) {
  return (
    <Link
      className="group inline-flex min-w-0 items-center gap-3 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kmt-gold"
      href="/"
    >
      <span className={cn("grid place-items-center border border-kmt-gold/70 bg-kmt-gold/10 text-kmt-gold", condensed ? "h-10 w-10" : "h-11 w-11")}>
        <MaterialSymbol className={condensed ? "text-xl" : "text-2xl"} name="balance" />
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
  className
}: {
  navItems: PublicNavItem[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-[#060504] text-[#f8f3ea] selection:bg-kmt-gold/30 selection:text-white", className)}>
      <header className="sticky top-0 z-50 border-b border-kmt-gold/20 bg-[#070604]/95 shadow-[0_12px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <PublicBrand />
          <nav aria-label="التنقل الرئيسي" className="hidden items-stretch gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-[76px] items-center border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-kmt-gold",
                  item.active ? "border-kmt-gold text-white" : "border-transparent text-stone-300 hover:border-kmt-gold/50 hover:text-white"
                )}
                href={item.href}
              >
                {publicNavLabel(item)}
              </Link>
            ))}
          </nav>
          <ConsultationLink className="shrink-0 px-3 sm:px-4" />
        </div>
        <nav aria-label="التنقل المختصر" className="border-t border-white/10 bg-[#090806]/95 lg:hidden">
          <div className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 py-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
                  item.active ? "border-kmt-gold bg-kmt-gold/15 text-white" : "border-transparent text-stone-300 hover:border-kmt-gold/40 hover:text-white"
                )}
                href={item.href}
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
              <h2 className="text-2xl font-semibold leading-tight text-[#f8f3ea] md:text-3xl">هل تحتاج إلى دعم قانوني واضح؟</h2>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                ابدأ بطلب منظم، وسيراجع الفريق البيانات قبل تحديد المسار المناسب للتواصل أو الحجز.
              </p>
            </div>
            <ConsultationLink className="w-full sm:w-auto" />
          </div>
        </section>

        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 text-sm sm:px-6 md:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] lg:px-10">
          <div className="max-w-sm">
            <PublicBrand condensed />
            <p className="mt-5 leading-7 text-stone-300">
              مكتب محاماة عربي لإدارة الاستشارات والقضايا بوضوح وأمان، مع تنظيم الوقائع والمستندات قبل أي خطوة قانونية.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-stone-400">
              <span className="border border-kmt-gold/30 px-3 py-2">سرية البيانات</span>
              <span className="border border-kmt-gold/30 px-3 py-2">مراجعة بشرية</span>
            </div>
          </div>

          <nav aria-label="روابط مجالات الخبرة">
            <h2 className="font-semibold text-[#f8f3ea]">مجالات الخبرة</h2>
            <ul className="mt-4 space-y-3">
              {footerPracticeLinks.map((item) => (
                <li key={item.href}>
                  <Link className="inline-flex text-stone-300 transition-colors hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="inline-flex text-kmt-gold transition-colors hover:text-[#f8f3ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold" href="/services">
                  عرض كل المجالات
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-semibold text-[#f8f3ea]">المكاتب</h2>
            <ul className="mt-4 space-y-4">
              {officeLinks.map((office) => (
                <li key={office.label}>
                  <p className="font-semibold text-stone-100">{office.label}</p>
                  <p className="mt-1 leading-6 text-stone-400">{office.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-[#f8f3ea]">تواصل معنا</h2>
            <ul className="mt-4 space-y-3">
              <li className="flex gap-2">
                <MaterialSymbol className="mt-0.5 text-kmt-gold" name="mail" />
                <span>contact@kmtlegal.com</span>
              </li>
              <li className="flex gap-2">
                <MaterialSymbol className="mt-0.5 text-kmt-gold" name="call" />
                <span dir="ltr">+20 100 000 0001</span>
              </li>
              <li className="flex gap-2">
                <MaterialSymbol className="mt-0.5 text-kmt-gold" name="schedule" />
                <span>الأحد - الخميس، 9:00 ص - 6:00 م</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-5 text-xs text-stone-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
            <p>© 2026 KMT Legal. جميع الحقوق محفوظة.</p>
            <div className="flex gap-5">
              <Link className="hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold" href="/privacy">
                الخصوصية
              </Link>
              <Link className="hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold" href="/terms">
                الشروط
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
