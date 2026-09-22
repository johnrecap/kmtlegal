"use client";

import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/animate-ui/components/radix/tabs";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export type AdminTabItem = {
  value: string;
  label: string;
  href: string;
  badge?: React.ReactNode;
};

function AdminTabBadge({ children }: { children: React.ReactNode }) {
  if (typeof children === "number" || typeof children === "string") {
    return <Badge tone="neutral">{children}</Badge>;
  }
  return <>{children}</>;
}

/**
 * Shared admin Tabs (Phase 09) over the verified Animate UI Tabs primitive.
 * URL-param contract (prevents `?tab=`/`?view=` drift when Phase 10 migrates
 * `CaseTabs`, outcome nav, content tabs, finance section tabs):
 * - The page (server) reads the active value from `searchParams` and passes
 *   it as `active`. No client state guessing.
 * - `onValueChange` navigates to the tab's canonical `href` (full server
 *   navigation, same URLs as today's hand-rolled tab links) — never a
 *   client-only panel swap that desyncs the URL.
 * - Only tabs present in `tabs` are navigable; unknown values must resolve
 *   to the default server-side (existing `activeTab` pattern).
 * - Optional `badge` (Phase 10): count/status chip rendered inside the
 *   trigger after the label — preserves per-tab counts (consultation
 *   outcome views, content types) without inventing new labels.
 */
export function AdminTabs({
  tabs,
  active,
  ariaLabel,
  className
}: {
  tabs: AdminTabItem[];
  active: string;
  ariaLabel: string;
  className?: string;
}) {
  const router = useRouter();

  function navigateToTab(value: string) {
    const tab = tabs.find((item) => item.value === value);
    if (tab) {
      router.push(tab.href);
    }
  }

  return (
    <Tabs
      activationMode="manual"
      className={className}
      value={active}
      onValueChange={navigateToTab}
    >
      <TabsList
        aria-label={ariaLabel}
        className={cn("w-full justify-start overflow-x-auto border-border bg-surface sm:justify-start")}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            className="min-h-11 gap-2 text-muted-foreground hover:text-foreground data-[disabled]:hover:text-muted-foreground"
            value={tab.value}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined ? <AdminTabBadge>{tab.badge}</AdminTabBadge> : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
