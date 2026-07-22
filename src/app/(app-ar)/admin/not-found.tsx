import { AdminShellState } from "@/components/layout/admin-shell-state";
import { plan35AdminRecoveryCopy, protectedRecoveryUiCopy } from "@/lib/ui-copy";

export default function AdminNotFound() {
  return (
    <AdminShellState
      action={{ href: "/admin", label: plan35AdminRecoveryCopy.backToWorkspace }}
      description={protectedRecoveryUiCopy.notFoundDescription}
      title={protectedRecoveryUiCopy.notFoundTitle}
      tone="empty"
    />
  );
}
