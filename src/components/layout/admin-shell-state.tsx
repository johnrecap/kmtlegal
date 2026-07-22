"use client";

import { Button, ButtonLink, StateBlock } from "@/components/ui";
import { useAdminAccess } from "@/features/admin/shell/admin-access-context";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { DashboardShellView } from "./dashboard-shell-view";

type AdminShellStateAction =
  | { label: string; href: string }
  | { label: string; onSelect: () => void };

export function AdminShellState({
  title,
  description,
  tone,
  action,
  testId
}: {
  title: string;
  description: string;
  tone: "loading" | "error" | "permission" | "empty";
  action?: AdminShellStateAction;
  testId?: string;
}) {
  const access = useAdminAccess();
  const stateAction = action ? <AdminStateAction action={action} /> : undefined;

  return (
    <DashboardShellView
      eyebrow={plan35AdminShellCopy.workspaceEyebrow}
      navItems={access.navItems}
      title={title}
      userLabel={access.userLabel}
    >
      <div data-testid={testId}>
        <StateBlock action={stateAction} description={description} title={title} tone={tone} />
      </div>
    </DashboardShellView>
  );
}

function AdminStateAction({ action }: { action: AdminShellStateAction }) {
  if ("href" in action) {
    return <ButtonLink href={action.href} variant="secondary">{action.label}</ButtonLink>;
  }
  return <Button onClick={action.onSelect} variant="secondary">{action.label}</Button>;
}
