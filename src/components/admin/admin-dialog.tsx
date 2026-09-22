"use client";

import type { ReactNode } from "react";
import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

type AdminDialogVariant = "confirm" | "destructive" | "form" | "preview";

type AdminDialogProps = {
  variant?: AdminDialogVariant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
  confirmBusy?: boolean;
};

/**
 * Shared admin Dialog (Phase 09) over the vendored Animate UI Dialog
 * (Radix focus trap + Esc + animated overlay/content). Variants:
 * - `confirm`: title + description + cancel/confirm footer.
 * - `destructive`: confirm with danger-toned confirm action.
 * - `form`: title + description + custom children + caller-owned footer
 *   (no preset actions).
 * - `preview`: title + scrollable children, no footer actions.
 * All copy arrives via props (Arabic copy slots) — no new strings here.
 * Actual page-action migration happens in Phases 10–11.
 */
export function AdminDialog({
  variant = "confirm",
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  confirmDisabled,
  confirmBusy
}: AdminDialogProps) {
  // Confirm dismisses in both modes: controlled callers receive
  // onOpenChange(false); trigger-driven (uncontrolled) dialogs track a
  // local open state so confirm closes them too. The confirmed action
  // (fetch + feedback) proceeds behind the closed dialog.
  const [internalOpen, setInternalOpen] = React.useState(false);
  const resolvedOpen = open ?? internalOpen;
  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }
  function handleConfirm() {
    onConfirm?.();
    setInternalOpen(false);
    onOpenChange?.(false);
  }
  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="border-border bg-surface text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description ? <DialogDescription className="text-muted-foreground">{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {variant === "confirm" || variant === "destructive" ? (
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {cancelLabel}
              </Button>
            </DialogClose>
            <Button
              className={cn(variant === "destructive" && "border-danger bg-danger text-white hover:border-danger-strong hover:bg-danger-strong")}
              disabled={confirmDisabled}
              loading={confirmBusy}
              type="button"
              variant="primary"
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
