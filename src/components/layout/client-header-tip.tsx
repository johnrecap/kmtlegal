"use client";

import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/animate-ui/components/radix/tooltip";

/**
 * Phase 07 tooltip island: wraps an existing icon-only header control with
 * the approved Animate UI Tooltip. Label must already exist (translated
 * control meaning) — no new copy is introduced here.
 */
export function ClientHeaderTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
