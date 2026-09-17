import { Suspense } from "react";
import { MaterialSymbol } from "@/components/ui";
import { getPublicContent } from "@/content/public-content";
import { RequestedLawyerQueryNotice } from "@/features/public-site/booking-query-client";
import { SupportGlowGate } from "@/features/public-site/support-glow-gate";
import { publicMotionIcon, publicMotionIconHalo } from "@/features/public-site/public-motion";
import { cn } from "@/lib/cn";
import { publicMutedText } from "@/features/public-site/public-components";
import type { PublicLocale } from "@/lib/public-locale";

/**
 * Booking support panel: visually subordinate to the assistant stage.
 * Real content only — the office-reviewed next steps (trustItems) plus the
 * requested-lawyer notice when a lawyer query is present. One gated gold
 * border glow, small icons, compact vertical rhythm, gold section marker.
 */
export function BookingSupportPanel({ copy, locale = "en" }: {
  copy: ReturnType<typeof getPublicContent>["bookingChat"];
  locale?: PublicLocale;
}) {
  const content = getPublicContent(locale);

  return (
    <aside className="space-y-4 lg:pt-2">
      <section className="relative overflow-hidden rounded-[1.25rem] border border-kmt-gold/25 bg-[var(--kmt-public-panel)] p-5">
        <SupportGlowGate />
        <div className="relative">
          <p aria-hidden="true" className="h-px w-12 bg-gradient-to-r from-[var(--kmt-public-gold)] to-transparent rtl:bg-gradient-to-l" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--kmt-public-text)]">{copy.trustTitle}</h2>
          <div className="mt-4 space-y-4">
            {copy.trustItems.map((item, index) => (
              <div key={item.label} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="text-xs font-semibold tabular-nums text-[var(--kmt-public-gold)]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-kmt-gold/25 bg-kmt-gold/10 text-kmt-gold">
                  <MaterialSymbol className={cn("text-lg", publicMotionIcon, publicMotionIconHalo)} name={item.icon} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--kmt-public-text)]">{item.label}</p>
                  <p className={cn("mt-1 text-sm leading-6", publicMutedText)}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <Suspense fallback={null}>
            <RequestedLawyerQueryNotice label={content.bookingPage.requestedLawyer} />
          </Suspense>
        </div>
      </section>
    </aside>
  );
}
