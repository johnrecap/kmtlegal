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
  closeLabel?: string;
  fitVisualViewport?: boolean;
};

export function Dialog({ open, onClose, title, description, children, footer, className, closeLabel, fitVisualViewport = false }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !fitVisualViewport || !dialog) return;
    const viewport = window.visualViewport;
    const sync = () => {
      dialog.style.setProperty("--dialog-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
      dialog.style.setProperty("--dialog-viewport-top", `${viewport?.offsetTop ?? 0}px`);
    };
    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      dialog.style.removeProperty("--dialog-viewport-height");
      dialog.style.removeProperty("--dialog-viewport-top");
    };
  }, [open, fitVisualViewport]);

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
      const previousOverflow = document.body.style.overflow;
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
        document.body.style.overflow = previousOverflow;
        restoreFocusRef.current?.focus?.();
      };
    }

    if (dialog.open) {
      dialog.close();
    }
    restoreFocusRef.current?.focus?.();
    restoreFocusRef.current = null;
    return;
  }, [open, handleCancel]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(element => {
      if (!element.getClientRects().length || element.closest("fieldset:disabled")) return false;
      if (!(element instanceof HTMLInputElement) || element.type !== "radio") return true;
      const group = Array.from(dialog.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(radio => radio.name === element.name);
      return element === (group.find(radio => radio.checked) ?? group[0]);
    });
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
      data-fit-visual-viewport={fitVisualViewport || undefined}
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
        {closeLabel && <button type="button" className="kmt-dialog-close" aria-label={closeLabel} onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>}
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
