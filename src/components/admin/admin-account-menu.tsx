"use client";

import { MaterialSymbol, buttonClasses } from "@/components/ui";
import { Popover, PopoverPanel, PopoverTrigger } from "@/components/animate-ui/components/base/popover";
import { plan35AdminShellCopy } from "@/lib/ui-copy";

export function AdminAccountMenu({
  userLabel,
  roleLabel,
  scopeLabel
}: {
  userLabel: string;
  roleLabel?: string;
  scopeLabel?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={plan35AdminShellCopy.accountMenu}
        className={buttonClasses({ variant: "ghost", size: "sm", className: "min-h-11 min-w-11 gap-2 px-2 sm:px-3" })}
      >
        <MaterialSymbol className="text-[20px]" name="account_circle" />
        <span className="hidden max-w-40 truncate sm:inline">{userLabel}</span>
      </PopoverTrigger>
      <PopoverPanel align="end" className="w-[min(20rem,calc(100vw-2rem))] border-border bg-popover p-4 text-popover-foreground">
        <div className="space-y-1 border-b border-border pb-3">
          <p className="break-words font-semibold text-foreground">{userLabel}</p>
          {roleLabel ? <p className="text-sm text-primary">{roleLabel}</p> : null}
          {scopeLabel ? <p className="text-xs leading-5 text-muted-foreground">{scopeLabel}</p> : null}
        </div>
        <form action="/api/auth/logout" className="mt-3" method="post">
          <button className={buttonClasses({ variant: "ghost", size: "sm", className: "w-full justify-start" })} type="submit">
            <MaterialSymbol className="text-[20px]" name="logout" />
            {plan35AdminShellCopy.logout}
          </button>
        </form>
      </PopoverPanel>
    </Popover>
  );
}
