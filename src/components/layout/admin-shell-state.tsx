"use client";

import { Button, ButtonLink, SkeletonCard, SkeletonTable, StateBlock } from "@/components/ui";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { DashboardPageFrame } from "./dashboard-page-frame";

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
  const stateAction = action ? <AdminStateAction action={action} /> : undefined;

  if (tone === "loading") {
    return (
      <DashboardPageFrame description={description} eyebrow={plan35AdminShellCopy.workspaceEyebrow} title={title}>
        <div aria-label={description} className="space-y-5" data-testid={testId} role="status">
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={6} />
        </div>
      </DashboardPageFrame>
    );
  }

  return (
    <DashboardPageFrame eyebrow={plan35AdminShellCopy.workspaceEyebrow} title={title}>
      <div data-testid={testId}>
        <StateBlock action={stateAction} description={description} title={title} tone={tone} />
      </div>
    </DashboardPageFrame>
  );
}

function AdminStateAction({ action }: { action: AdminShellStateAction }) {
  if ("href" in action) {
    return <ButtonLink href={action.href} variant="secondary">{action.label}</ButtonLink>;
  }
  return <Button onClick={action.onSelect} variant="secondary">{action.label}</Button>;
}
