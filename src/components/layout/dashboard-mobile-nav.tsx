"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { KmtBrandLogo } from "@/components/brand";
import { MaterialSymbol, buttonClasses } from "@/components/ui";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { DashboardNavigationLinks, type DashboardNavItem } from "./dashboard-navigation";

const mobileNavigationDialogId = "dashboard-mobile-navigation";
const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function focusableDialogElements(dialog: HTMLDialogElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true"
  );
}

function focusFirstDialogControl(dialog: HTMLDialogElement) {
  focusableDialogElements(dialog)[0]?.focus();
}

function containTabFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key === "Tab") {
    cycleDialogFocus(event);
  }
}

function cycleDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  const controls = focusableDialogElements(event.currentTarget);
  const firstControl = controls[0];
  const lastControl = controls.at(-1);
  if (!firstControl || !lastControl) return;

  if (event.shiftKey && document.activeElement === firstControl) {
    event.preventDefault();
    lastControl.focus();
  } else if (!event.shiftKey && document.activeElement === lastControl) {
    event.preventDefault();
    firstControl.focus();
  }
}

export function DashboardMobileNav({ navItems, modeLabel }: { navItems: DashboardNavItem[]; modeLabel: string }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreFocusRef = useRef(true);
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => setIsHydrated(true), []);

  const closeNavigation = useCallback((restoreFocus = true) => {
    const dialog = dialogRef.current;
    restoreFocusRef.current = restoreFocus;
    if (dialog?.open) dialog.close();
  }, []);

  const openNavigation = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    restoreFocusRef.current = true;
    dialog.showModal();
    setIsOpen(true);
    requestAnimationFrame(() => focusFirstDialogControl(dialog));
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const bodyOverflow = document.body.style.overflow;
    const documentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const containProgrammaticFocus = (event: FocusEvent) => {
      if (dialog.open && event.target instanceof Node && !dialog.contains(event.target)) {
        focusFirstDialogControl(dialog);
      }
    };
    document.addEventListener("focusin", containProgrammaticFocus, true);
    return () => {
      document.removeEventListener("focusin", containProgrammaticFocus, true);
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = documentOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    if (dialogRef.current?.open) closeNavigation(false);
  }, [closeNavigation, pathname]);

  return (
    <>
      <button
        ref={triggerRef}
        aria-controls={mobileNavigationDialogId}
        aria-expanded={isOpen}
        aria-hidden={isHydrated ? undefined : true}
        aria-label={plan35AdminShellCopy.openNavigation}
        className={buttonClasses({ variant: "ghost", size: "sm", className: "h-11 w-11 shrink-0 px-0 lg:hidden" })}
        data-testid="dashboard-mobile-navigation-trigger"
        disabled={!isHydrated}
        onClick={openNavigation}
        type="button"
      >
        <MaterialSymbol className="text-[24px]" name="menu" />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`${mobileNavigationDialogId}-title`}
        className="fixed start-0 top-0 m-0 h-dvh max-h-none w-[min(22rem,90vw)] max-w-none overflow-y-auto border-0 bg-white p-0 text-kmt-ink shadow-2xl backdrop:bg-slate-950/55"
        dir="rtl"
        id={mobileNavigationDialogId}
        onCancel={(event) => {
          event.preventDefault();
          closeNavigation();
        }}
        onClose={() => {
          setIsOpen(false);
          if (restoreFocusRef.current) requestAnimationFrame(() => triggerRef.current?.focus());
        }}
        onKeyDown={containTabFocus}
      >
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-kmt-border px-4">
          <KmtBrandLogo size="sm" sublabel={modeLabel} surface="light" variant="lockup" />
          <button
            aria-label={plan35AdminShellCopy.closeNavigation}
            className={buttonClasses({ variant: "ghost", size: "sm", className: "h-11 w-11 shrink-0 px-0" })}
            onClick={() => closeNavigation()}
            type="button"
          >
            <MaterialSymbol className="text-[22px]" name="close" />
          </button>
        </div>
        <nav aria-label={plan35AdminShellCopy.mobileNavigation} className="p-3" data-testid="dashboard-mobile-navigation">
          <h2 className="sr-only" id={`${mobileNavigationDialogId}-title`}>{plan35AdminShellCopy.navigationTitle}</h2>
          <DashboardNavigationLinks navItems={navItems} onNavigate={() => closeNavigation(false)} surface="mobile" />
        </nav>
      </dialog>
    </>
  );
}
