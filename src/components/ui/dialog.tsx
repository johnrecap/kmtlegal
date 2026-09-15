"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const headingId = useId();

  const handleCancel = useCallback(
    (event: Event) => {
      event.preventDefault();
      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      if (!dialog.open) {
        dialog.showModal();
      }
      document.body.style.overflow = "hidden";

      const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? dialog).focus();

      dialog.addEventListener("cancel", handleCancel);
      return () => {
        dialog.removeEventListener("cancel", handleCancel);
      };
    }

    if (dialog.open) {
      dialog.close();
    }
    document.body.style.overflow = "";
    restoreFocusRef.current?.focus?.();
    restoreFocusRef.current = null;
    return;
  }, [open, handleCancel]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      className={cn(
        "m-auto w-full max-w-lg rounded-xl border border-border bg-surface p-0 text-foreground shadow-kmt-popover backdrop:bg-black/60",
        "open:flex open:flex-col",
        className
      )}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="border-b border-border px-5 py-4">
        <h2 id={headingId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div> : null}
      {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-border px-5 py-4">{footer}</div> : null}
    </dialog>
  );
}
