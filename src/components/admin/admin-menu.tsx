"use client";

import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

import { buttonClasses } from "@/components/ui";
import {
  Menu,
  MenuItem,
  MenuPanel,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger
} from "@/components/animate-ui/components/base/menu";

export type AdminMenuAction = {
  key: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
};

export type AdminMenuEntry =
  | { kind: "action"; action: AdminMenuAction }
  | { kind: "separator"; key: string };

/**
 * Shared admin row-action Menu (Phase 09 kit). Animate UI Base Menu
 * semantics: Base UI keyboard navigation, Motion popup animation,
 * highlight-following hover, separators, shortcuts, destructive item
 * styling, RTL-safe positioning, focus return to the trigger on close.
 * Labels/shortcuts arrive via props (Arabic copy lives with the caller).
 * The MenuItem itself is the interactive element (activation is uniform
 * across mouse/keyboard/touch): `href` entries navigate via the app router,
 * `onSelect` entries call back. Primary one-click controls (and links that
 * need native affordances such as open-in-new-tab) stay visible per-row;
 * this Menu holds SECONDARY actions only. Destructive entries open an
 * `AdminDialog` confirmation in Phase 11 — they never execute here.
 * Panel surface: official `bg-popover`/`text-popover-foreground` utilities
 * are dead in this repo (no popover tokens in the theme), so the kit binds
 * the designed extension point (`MenuPanel className`) to the admin
 * light-only surface (`bg-white text-kmt-ink border-kmt-border`).
 * `defaultOpen` is a test/gallery affordance (closed in production).
 */
export function AdminRowActions({
  label,
  entries,
  defaultOpen
}: {
  label: string;
  entries: AdminMenuEntry[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();

  return (
    <Menu defaultOpen={defaultOpen}>
      <MenuTrigger
        aria-label={label}
        className={buttonClasses({ variant: "ghost", size: "sm", className: "min-w-9 px-2" })}
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </MenuTrigger>
      <MenuPanel className="border-kmt-border bg-white text-kmt-ink">
        {entries.map((entry) =>
          entry.kind === "separator" ? (
            <MenuSeparator key={entry.key} />
          ) : (
            <MenuItem
              key={entry.action.key}
              disabled={entry.action.disabled}
              variant={entry.action.destructive ? "destructive" : "default"}
              onClick={() => {
                if (entry.action.disabled) return;
                if (entry.action.href) router.push(entry.action.href);
                else entry.action.onSelect?.();
              }}
            >
              <span className="flex flex-1 items-center gap-2">
                <span className="flex-1">{entry.action.label}</span>
                {entry.action.shortcut ? (
                  <MenuShortcut>{entry.action.shortcut}</MenuShortcut>
                ) : null}
              </span>
            </MenuItem>
          )
        )}
      </MenuPanel>
    </Menu>
  );
}
