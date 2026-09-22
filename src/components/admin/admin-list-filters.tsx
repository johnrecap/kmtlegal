import { SlidersHorizontal } from "lucide-react";

import { buttonClasses } from "@/components/ui";
import {
  Popover,
  PopoverPanel,
  PopoverTrigger
} from "@/components/animate-ui/components/base/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/animate-ui/components/radix/sheet";

/**
 * Shared admin list-filter chrome (Phase 10 kit). Standard list
 * architecture splits each page's EXISTING GET filters (identical names +
 * values, no invented filters) across complete sibling forms:
 * - main form: primary/common controls + hidden inputs carrying the
 *   current secondary values + visible apply;
 * - more-filters form (desktop Popover panel): hidden inputs carrying the
 *   current primary values + the secondary controls + its own apply;
 * - mobile form (Sheet): the full set + its own apply.
 * Each form submits the complete filter state on its own, so no JavaScript
 * state and no cross-portal input duplication are needed (portal content
 * mounts outside the outer `<form>` and unmounts when closed — it can
 * never be a plain inline fieldset).
 * Panels use the semantic surface contract shared by both themes.
 */
export function MoreFiltersPopover({
  triggerLabel,
  children
}: {
  triggerLabel: string;
  children: React.ReactNode;
}) {
  return (
    <span className="hidden lg:block">
      <Popover>
        <PopoverTrigger
          className={buttonClasses({ variant: "ghost", size: "sm", className: "min-h-11 gap-2" })}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {triggerLabel}
        </PopoverTrigger>
        <PopoverPanel
          align="end"
          className="w-[min(24rem,calc(100vw-2rem))] space-y-3 border-border bg-popover p-4 text-popover-foreground"
        >
          {children}
        </PopoverPanel>
      </Popover>
    </span>
  );
}

export function MobileFiltersSheet({
  triggerLabel,
  title,
  description,
  children
}: {
  triggerLabel: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="lg:hidden">
      <Sheet>
        <SheetTrigger
          className={buttonClasses({ variant: "ghost", size: "sm", className: "min-h-11 gap-2" })}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {triggerLabel}
        </SheetTrigger>
        <SheetContent
          aria-label={title}
          className="overflow-y-auto border-border bg-surface text-foreground"
          side="right"
        >
          <SheetHeader>
            <SheetTitle className="text-foreground">{title}</SheetTitle>
            {description ? <SheetDescription className="text-muted-foreground">{description}</SheetDescription> : null}
          </SheetHeader>
          <div className="mt-4 space-y-3">{children}</div>
        </SheetContent>
      </Sheet>
    </span>
  );
}
