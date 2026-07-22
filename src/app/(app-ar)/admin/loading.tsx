import { AdminShellState } from "@/components/layout/admin-shell-state";
import { plan35AdminStateCopy } from "@/lib/ui-copy";

export default function AdminLoading() {
  return (
    <AdminShellState
      description={plan35AdminStateCopy.loading.description}
      title={plan35AdminStateCopy.loading.title}
      tone="loading"
    />
  );
}
