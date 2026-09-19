import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/animate-ui/components/radix/accordion";

/**
 * Shared mobile-only detail accordion (Phase 08). The desktop panel stays
 * fully visible (`hidden lg:block` at the call site) while small screens
 * collapse the same content into one Animate UI Accordion item styled like
 * a `ClientPortalPanel`. Critical facts (identity, status, amounts, primary
 * actions) always stay outside collapsed areas at the call site.
 */
export function ClientMobileAccordion({
  title,
  description,
  value,
  testId,
  children
}: {
  title: ReactNode;
  description?: ReactNode;
  value: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Accordion className="lg:hidden" collapsible data-testid={testId} type="single">
      <AccordionItem
        className="rounded-lg border border-[var(--kmt-client-line)] bg-[var(--kmt-client-surface)] px-5 py-1"
        value={value}
      >
        <AccordionTrigger className="text-start hover:no-underline">
          <span className="block">
            <span className="block text-base font-semibold text-[var(--kmt-client-text)]">{title}</span>
            {description ? (
              <span className="mt-1 block text-sm font-normal text-[var(--kmt-client-muted)]">{description}</span>
            ) : null}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pb-5">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
