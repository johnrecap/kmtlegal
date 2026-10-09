"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackClientAnalyticsEvent } from "@/lib/analytics-client";
import { publicAnalyticsContext, publicAnalyticsServices } from "@/lib/public-analytics";
import { stripPublicLocalePrefix } from "@/lib/public-locale";
import { publicOfficeProfile } from "@/content/public-office-profile";

export function PublicTelemetry() {
  const pathname = usePathname();
  const lastView = useRef<string | null>(null);
  useEffect(() => {
    const context = publicAnalyticsContext(pathname);
    if (!context) return;
    if (lastView.current !== pathname) {
      lastView.current = pathname;
      trackClientAnalyticsEvent("public.page_viewed", context);
    }
    const clicked = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.closest("form") || !link.closest('[data-testid="public-shell"]')) return;
      const href = link.getAttribute("href");
      const placement = link.closest('[data-testid="public-floating-dock"]') ? "dock" : link.closest("header") ? "header" : link.closest("footer") ? "footer" : "content";
      const channel = href === publicOfficeProfile.whatsappHref ? "whatsapp" : href === publicOfficeProfile.phoneHref ? "phone" : href === publicOfficeProfile.emailHref ? "email" : null;
      if (channel) trackClientAnalyticsEvent("public.contact_clicked", { ...context, placement, channel });
      if (!href) return;
      const destination = new URL(href, location.origin);
      if (destination.origin !== location.origin || stripPublicLocalePrefix(destination.pathname) !== "/book-consultation") return;
      const service = publicAnalyticsServices.find(value => value === destination.searchParams.get("service"));
      trackClientAnalyticsEvent("public.booking_clicked", { ...context, ...(service ? { service } : {}), placement });
    };
    document.addEventListener("click", clicked);
    return () => document.removeEventListener("click", clicked);
  }, [pathname]);
  return null;
}
