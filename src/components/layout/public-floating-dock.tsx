"use client";

import { MotionConfig } from "motion/react";
import { MaterialSymbol } from "@/components/ui";
import { FloatingDock, type FloatingDockItem } from "@/components/ui/floating-dock";
import { getPublicContent } from "@/content/public-content";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";

/**
 * Public floating dock: exactly two actions — Consultation (existing
 * localized route, same page, no modal) and WhatsApp (configured URL or
 * the contact page fallback, new tab + noopener). Rendered by PublicShell
 * on every public route EXCEPT the consultation route itself (the shell
 * hides it there so the fixed overlay can never cover the assistant
 * composer); Admin/Client Portal (separate layouts) never get it.
 */
export function PublicFloatingDock({ locale = "en" }: { locale?: PublicLocale }) {
  const content = getPublicContent(locale);
  const whatsappHref = process.env.NEXT_PUBLIC_KMT_WHATSAPP_URL || localizedPublicHref("/contact", locale);
  const items: FloatingDockItem[] = [
    {
      title: content.shared.bookConsultation,
      icon: <MaterialSymbol className="text-2xl" name="event_available" />,
      href: localizedPublicHref("/book-consultation", locale),
    },
    {
      title: content.contactPage.whatsappLabel,
      icon: <MaterialSymbol className="text-2xl" name="forum" />,
      href: whatsappHref,
      external: true,
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
        data-testid="public-floating-dock"
      >
        <div className="pointer-events-auto">
          <FloatingDock items={items} mobileMenuLabel={content.shell.dockMenuLabel} />
        </div>
      </div>
    </MotionConfig>
  );
}
