import policy from "./policy-data.json";

export const ROLES = policy.roles;
export const STAFF_ROLES = new Set<string>(policy.staffRoles);
export const ALL_PERMISSIONS = policy.permissions;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

export type Principal = {
  id: string;
  roleName: string;
  permissions?: string[];
  clientId?: string | null;
};

export function isStaffRole(roleName: string) {
  return STAFF_ROLES.has(roleName);
}

export function permissionsForRole(roleName: string) {
  const configured = policy.rolePermissions[roleName as keyof typeof policy.rolePermissions] ?? [];
  return configured.includes("*") ? ALL_PERMISSIONS : configured;
}

export function hasPermission(principal: Pick<Principal, "roleName" | "permissions">, permission: string) {
  const effectivePermissions = principal.permissions ?? permissionsForRole(principal.roleName);
  return effectivePermissions.includes("*") || effectivePermissions.includes(permission);
}

export function assertPermission(principal: Pick<Principal, "roleName" | "permissions">, permission: string) {
  if (!hasPermission(principal, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

export class PermissionDeniedError extends Error {
  constructor(public readonly permission: string) {
    super(`Missing permission: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

export function canReadClient(
  principal: Principal,
  resource: { userId?: string | null; assignedLawyerId?: string | null; clientId?: string | null }
) {
  if (hasPermission(principal, "client.read.any")) {
    return true;
  }
  if (hasPermission(principal, "client.read.self") && resource.userId === principal.id) {
    return true;
  }
  return hasPermission(principal, "client.read.assigned") && resource.assignedLawyerId === principal.id;
}

export function canReadCase(
  principal: Principal,
  resource: { clientUserId?: string | null; assignedLawyerId?: string | null }
) {
  if (hasPermission(principal, "case.read.any")) {
    return true;
  }
  if (hasPermission(principal, "case.read.own") && resource.clientUserId === principal.id) {
    return true;
  }
  return hasPermission(principal, "case.read.assigned") && resource.assignedLawyerId === principal.id;
}
