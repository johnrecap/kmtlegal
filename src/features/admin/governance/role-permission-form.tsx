"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InlineFeedback
} from "@/components/ui";
import {
  permissionDisplayLabel,
  permissionGroupDisplayLabel,
  plan35RoleGovernanceUiCopy,
  roleDisplayLabel
} from "@/lib/ui-copy";

type RolePermissionMatrix = {
  permissions: Array<{ key: string; groupKey: string; labelKey: string }>;
  roles: Array<{
    id: string;
    name: string;
    status: string;
    protected: boolean;
    readOnly: boolean;
    effectiveWildcard: boolean;
    userCount: number;
    permissionKeys: string[];
    updatedAt: string;
  }>;
};

type Feedback = { tone: "success" | "warning" | "error"; message: string } | null;

function initialDrafts(matrix: RolePermissionMatrix) {
  return Object.fromEntries(matrix.roles.map((role) => [role.id, [...role.permissionKeys]]));
}

function checkboxId(roleId: string, permissionKey: string) {
  return `role-${roleId}-permission-${permissionKey.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

export function RolePermissionForm({ initialMatrix }: { initialMatrix: RolePermissionMatrix }) {
  const firstEditableRole = initialMatrix.roles.find((role) => !role.readOnly) ?? initialMatrix.roles[0];
  const [roles, setRoles] = useState(initialMatrix.roles);
  const [selectedRoleId, setSelectedRoleId] = useState(firstEditableRole?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, string[]>>(() => initialDrafts(initialMatrix));
  const [dirtyRoleIds, setDirtyRoleIds] = useState<Set<string>>(() => new Set());
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isBusy, setIsBusy] = useState(false);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, typeof initialMatrix.permissions>();
    for (const permission of initialMatrix.permissions) {
      groups.set(permission.groupKey, [...(groups.get(permission.groupKey) ?? []), permission]);
    }
    return [...groups.entries()];
  }, [initialMatrix]);

  if (!selectedRole) {
    return (
      <InlineFeedback
        description={plan35RoleGovernanceUiCopy.noEditableRole}
        title={plan35RoleGovernanceUiCopy.permissionMatrix}
        tone="warning"
      />
    );
  }

  const selectedKeys = drafts[selectedRole.id] ?? selectedRole.permissionKeys;
  const isDirty = dirtyRoleIds.has(selectedRole.id);

  function selectRole(roleId: string) {
    setSelectedRoleId(roleId);
    setFeedback(null);
  }

  function togglePermission(permissionKey: string, checked: boolean) {
    setDrafts((current) => {
      const currentKeys = current[selectedRole.id] ?? selectedRole.permissionKeys;
      const nextKeys = checked
        ? [...new Set([...currentKeys, permissionKey])]
        : currentKeys.filter((key) => key !== permissionKey);
      return { ...current, [selectedRole.id]: nextKeys };
    });
    setDirtyRoleIds((current) => new Set(current).add(selectedRole.id));
    setFeedback(null);
  }

  async function savePermissions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedRole.readOnly || !isDirty) return;
    setIsBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionKeys: selectedKeys, updatedAt: selectedRole.updatedAt })
      });

      if (response.status === 409) {
        setFeedback({ tone: "warning", message: plan35RoleGovernanceUiCopy.feedback.stale });
        return;
      }
      if (!response.ok) {
        setFeedback({ tone: "error", message: plan35RoleGovernanceUiCopy.feedback.failed });
        return;
      }

      const payload = (await response.json()) as {
        data?: { id: string; permissionKeys: string[]; updatedAt: string };
      };
      const saved = payload.data;
      if (!saved) {
        setFeedback({ tone: "error", message: plan35RoleGovernanceUiCopy.feedback.failed });
        return;
      }

      setRoles((current) =>
        current.map((role) =>
          role.id === saved.id
            ? { ...role, permissionKeys: [...saved.permissionKeys], updatedAt: saved.updatedAt }
            : role
        )
      );
      setDrafts((current) => ({ ...current, [saved.id]: [...saved.permissionKeys] }));
      setDirtyRoleIds((current) => {
        const next = new Set(current);
        next.delete(saved.id);
        return next;
      });
      setFeedback({ tone: "success", message: plan35RoleGovernanceUiCopy.feedback.saved });
    } catch {
      setFeedback({ tone: "error", message: plan35RoleGovernanceUiCopy.feedback.unavailable });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{plan35RoleGovernanceUiCopy.roleList}</CardTitle>
          <CardDescription>{plan35RoleGovernanceUiCopy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => (
            <button
              aria-pressed={role.id === selectedRole.id}
              className={`min-h-11 w-full rounded-lg border p-3 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold ${
                role.id === selectedRole.id
                  ? "border-kmt-gold bg-kmt-gold/10"
                  : "border-kmt-border bg-white hover:border-kmt-navy/40"
              }`}
              key={role.id}
              onClick={() => selectRole(role.id)}
              type="button"
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-kmt-ink">{roleDisplayLabel(role.name)}</span>
                <Badge tone={role.status === "ACTIVE" ? "active" : "neutral"}>
                  {role.status === "ACTIVE"
                    ? plan35RoleGovernanceUiCopy.status.active
                    : plan35RoleGovernanceUiCopy.status.inactive}
                </Badge>
              </span>
              <span className="mt-2 block text-xs leading-5 text-kmt-muted">
                {role.userCount} {plan35RoleGovernanceUiCopy.usersSuffix}
              </span>
              {role.protected ? (
                <span className="mt-2 block text-xs leading-5 text-kmt-muted">
                  {plan35RoleGovernanceUiCopy.protectedRole}
                </span>
              ) : null}
              {role.status !== "ACTIVE" ? (
                <span className="mt-2 block text-xs leading-5 text-kmt-muted">
                  {plan35RoleGovernanceUiCopy.inactiveRole}
                </span>
              ) : null}
              {role.effectiveWildcard ? (
                <span className="mt-2 block text-xs leading-5 text-kmt-muted">
                  {plan35RoleGovernanceUiCopy.effectiveWildcard}
                </span>
              ) : null}
            </button>
          ))}
        </CardContent>
      </Card>

      <form className="space-y-5" onSubmit={savePermissions}>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {plan35RoleGovernanceUiCopy.permissionMatrix}: {roleDisplayLabel(selectedRole.name)}
                </CardTitle>
                <CardDescription>
                  {isDirty ? plan35RoleGovernanceUiCopy.dirty : plan35RoleGovernanceUiCopy.clean}
                </CardDescription>
              </div>
              {selectedRole.readOnly ? (
                <Badge tone="neutral">{plan35RoleGovernanceUiCopy.status.readOnly}</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {groupedPermissions.map(([groupKey, permissions]) => (
              <fieldset className="space-y-3" disabled={selectedRole.readOnly || isBusy} key={groupKey}>
                <legend className="mb-3 text-base font-semibold text-kmt-navy">
                  {permissionGroupDisplayLabel(groupKey)}
                </legend>
                <div className="grid gap-3 md:grid-cols-2">
                  {permissions.map((permission) => {
                    const id = checkboxId(selectedRole.id, permission.key);
                    return (
                      <div className="rounded-lg border border-kmt-border bg-kmt-paper p-3" key={permission.key}>
                        <label className="flex min-h-11 cursor-pointer items-start gap-3" htmlFor={id}>
                          <input
                            checked={selectedKeys.includes(permission.key)}
                            className="mt-1 h-5 w-5 shrink-0 accent-kmt-gold"
                            disabled={selectedRole.readOnly || isBusy}
                            id={id}
                            name="permissionKeys"
                            onChange={(event) => togglePermission(permission.key, event.currentTarget.checked)}
                            type="checkbox"
                            value={permission.key}
                          />
                          <span className="text-sm font-medium leading-6 text-kmt-ink">
                            {permissionDisplayLabel(permission.key)}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={selectedRole.readOnly || !isDirty}
            loading={isBusy}
            type="submit"
          >
            {isBusy ? plan35RoleGovernanceUiCopy.saving : plan35RoleGovernanceUiCopy.save}
          </Button>
          {feedback?.tone === "warning" ? (
            <Button onClick={() => window.location.reload()} type="button" variant="secondary">
              {plan35RoleGovernanceUiCopy.reload}
            </Button>
          ) : null}
        </div>

        <div aria-live="polite">
          {feedback ? (
            <InlineFeedback
              description={feedback.message}
              title={
                feedback.tone === "success"
                  ? plan35RoleGovernanceUiCopy.feedback.successTitle
                  : plan35RoleGovernanceUiCopy.feedback.incompleteTitle
              }
              tone={feedback.tone}
            />
          ) : null}
        </div>
      </form>
    </div>
  );
}
