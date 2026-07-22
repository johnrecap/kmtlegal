"use client";

import { AdminShellState } from "@/components/layout/admin-shell-state";
import { plan35AdminRecoveryCopy, plan35AdminStateCopy } from "@/lib/ui-copy";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AdminShellState
      action={{ label: plan35AdminRecoveryCopy.retry, onSelect: reset }}
      description={plan35AdminStateCopy.unavailable.description}
      title={plan35AdminStateCopy.unavailable.title}
      tone="error"
    />
  );
}
