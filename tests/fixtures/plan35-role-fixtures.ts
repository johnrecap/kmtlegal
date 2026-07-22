import { permissionsForRole, ROLES, type Principal } from "@/server/auth/policy";

export const PLAN35_ROLE_KEYS = [
  "lawyer",
  "secretary",
  "officeAdmin",
  "marketingStaff",
  "superAdmin"
] as const;

export type Plan35RoleKey = (typeof PLAN35_ROLE_KEYS)[number];

export type Plan35RoleFixture = {
  key: Plan35RoleKey;
  id: string;
  roleName: string;
  displayName: string;
  email: string;
  principal: Principal;
};

const ROLE_IDENTITIES: Record<Plan35RoleKey, Omit<Plan35RoleFixture, "key" | "principal">> = {
  lawyer: {
    id: "35000000-0000-4000-8000-000000000001",
    roleName: ROLES.lawyer,
    displayName: "PLAN-35 Lawyer",
    email: "lawyer.plan35@example.invalid"
  },
  secretary: {
    id: "35000000-0000-4000-8000-000000000002",
    roleName: ROLES.secretary,
    displayName: "PLAN-35 Secretary",
    email: "secretary.plan35@example.invalid"
  },
  officeAdmin: {
    id: "35000000-0000-4000-8000-000000000003",
    roleName: ROLES.officeAdmin,
    displayName: "PLAN-35 Office Admin",
    email: "office-admin.plan35@example.invalid"
  },
  marketingStaff: {
    id: "35000000-0000-4000-8000-000000000004",
    roleName: ROLES.marketingStaff,
    displayName: "PLAN-35 Marketing Staff",
    email: "marketing.plan35@example.invalid"
  },
  superAdmin: {
    id: "35000000-0000-4000-8000-000000000005",
    roleName: ROLES.superAdmin,
    displayName: "PLAN-35 Super Admin",
    email: "super-admin.plan35@example.invalid"
  }
};

function createRoleFixture(key: Plan35RoleKey): Plan35RoleFixture {
  const identity = ROLE_IDENTITIES[key];
  return Object.freeze({
    key,
    ...identity,
    principal: Object.freeze({
      id: identity.id,
      roleName: identity.roleName,
      permissions: [...permissionsForRole(identity.roleName)]
    })
  });
}

export const PLAN35_ROLE_FIXTURES: Readonly<Record<Plan35RoleKey, Plan35RoleFixture>> = Object.freeze({
  lawyer: createRoleFixture("lawyer"),
  secretary: createRoleFixture("secretary"),
  officeAdmin: createRoleFixture("officeAdmin"),
  marketingStaff: createRoleFixture("marketingStaff"),
  superAdmin: createRoleFixture("superAdmin")
});

export const PLAN35_PRINCIPALS: Readonly<Record<Plan35RoleKey, Principal>> = Object.freeze(
  Object.fromEntries(PLAN35_ROLE_KEYS.map((key) => [key, PLAN35_ROLE_FIXTURES[key].principal])) as Record<Plan35RoleKey, Principal>
);

export function getPlan35RoleFixture(key: Plan35RoleKey) {
  return PLAN35_ROLE_FIXTURES[key];
}

export type Plan35ScopedResourceFixture = {
  ownerUserId: string;
  userId: string;
  clientUserId: string;
  clientId: string;
  assignedLawyerId: string | null;
};

export type Plan35CrossAssignmentFixture = {
  actor: Plan35RoleFixture;
  target: Plan35RoleFixture;
  actorOwnedResource: Plan35ScopedResourceFixture;
  targetOwnedResource: Plan35ScopedResourceFixture;
  actorAssignedResource: Plan35ScopedResourceFixture;
  targetAssignedResource: Plan35ScopedResourceFixture;
};

function scopedResource(ownerId: string, assignedLawyerId: string | null): Plan35ScopedResourceFixture {
  return Object.freeze({
    ownerUserId: ownerId,
    userId: ownerId,
    clientUserId: ownerId,
    clientId: ownerId,
    assignedLawyerId
  });
}

export function buildPlan35CrossAssignment(actorKey: Plan35RoleKey, targetKey: Plan35RoleKey): Plan35CrossAssignmentFixture {
  if (actorKey === targetKey) {
    throw new Error("PLAN-35 cross-assignment fixtures require two distinct role keys.");
  }

  const actor = getPlan35RoleFixture(actorKey);
  const target = getPlan35RoleFixture(targetKey);
  return Object.freeze({
    actor,
    target,
    actorOwnedResource: scopedResource(actor.id, null),
    targetOwnedResource: scopedResource(target.id, null),
    actorAssignedResource: scopedResource(target.id, actor.id),
    targetAssignedResource: scopedResource(actor.id, target.id)
  });
}
