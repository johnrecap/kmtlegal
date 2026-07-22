import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { hashPassword } from "@/server/auth/password";
import { PLAN35_ROLE_FIXTURES, PLAN35_ROLE_KEYS, buildPlan35CrossAssignment, type Plan35RoleKey } from "./plan35-role-fixtures";

export const PLAN35_FIXTURE_PASSWORD = "Plan35-Disposable-Only!2026";
export const PLAN35_FIXTURE_OPT_IN_ENV = "PLAN35_ALLOW_DB_FIXTURES";

export type Plan35DatabasePersona = {
  key: Plan35RoleKey;
  userId: string;
  roleId: string;
  roleName: string;
  displayName: string;
  email: string;
  password: string;
};

export type Plan35DatabaseFixture = {
  namespace: string;
  marker: string;
  personas: Record<Plan35RoleKey, Plan35DatabasePersona>;
  crossAssignments: {
    clientId: string;
    caseId: string;
    taskId: string;
    appointmentId: string;
    caseAssignedLawyerId: string;
    taskDirectAssigneeId: string;
    createdById: string;
  };
  cleanup: () => Promise<Plan35DatabaseCleanupResult>;
};

export type Plan35DatabaseCleanupResult = {
  auditLogs: number;
  appointments: number;
  tasks: number;
  cases: number;
  clients: number;
  users: number;
};

type FixtureMutationOptions = { allowDatabaseMutation?: boolean; env?: NodeJS.ProcessEnv };

export async function createPlan35DatabaseFixture(
  prisma: PrismaClient,
  options: FixtureMutationOptions & { namespace?: string } = {}
): Promise<Plan35DatabaseFixture> {
  assertPlan35FixtureMutationAllowed(options);
  const namespace = plan35FixtureNamespace(options.namespace);
  const marker = plan35FixtureMarker(namespace);
  const passwordHash = await hashPassword(PLAN35_FIXTURE_PASSWORD);
  await cleanupPlan35DatabaseFixture(prisma, namespace, options);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const roleNames = PLAN35_ROLE_KEYS.map((key) => PLAN35_ROLE_FIXTURES[key].roleName);
      const roles = await tx.role.findMany({ where: { name: { in: roleNames } }, select: { id: true, name: true } });
      const roleIds = new Map(roles.map((role) => [role.name, role.id]));
      const missing = roleNames.filter((name) => !roleIds.has(name));
      if (missing.length) throw new Error(`PLAN-35 database fixtures require seeded roles: ${missing.join(", ")}`);

      const personas = Object.create(null) as Record<Plan35RoleKey, Plan35DatabasePersona>;
      for (const key of PLAN35_ROLE_KEYS) {
        const definition = PLAN35_ROLE_FIXTURES[key];
        const roleId = roleIds.get(definition.roleName)!;
        const email = plan35FixtureEmail(definition.email, namespace);
        const user = await tx.user.create({
          data: { name: `${definition.displayName} [${namespace}]`, email, passwordHash, roleId, status: "ACTIVE", locale: "ar" },
          select: { id: true }
        });
        personas[key] = { key, userId: user.id, roleId, roleName: definition.roleName, displayName: definition.displayName, email, password: PLAN35_FIXTURE_PASSWORD };
      }

      await tx.lawyerProfile.create({
        data: {
          userId: personas.lawyer.userId,
          publicSlug: `${namespace}-lawyer`,
          title: "محامي اختبار PLAN-35",
          bio: "ملف اختبار اصطناعي قابل للحذف ولا يمثل عميلاً أو محاميًا حقيقيًا.",
          specialties: ["PLAN-35"],
          languages: ["ar"],
          isPublic: false,
          bookingEnabled: true
        }
      });

      const client = await tx.client.create({
        data: {
          fullName: `عميل اختبار ${namespace}`,
          phone: plan35FixturePhone(namespace),
          email: `client.${namespace}@example.invalid`,
          source: marker,
          status: "ACTIVE",
          assignedLawyerId: personas.lawyer.userId
        },
        select: { id: true }
      });
      const legalCase = await tx.legalCase.create({
        data: {
          internalFileNumber: plan35FixtureCaseReference(namespace),
          clientId: client.id,
          assignedLawyerId: personas.lawyer.userId,
          title: `${marker} قضية اختبار النطاق`,
          caseType: "PLAN35_TEST",
          status: "ACTIVE",
          priority: "NORMAL",
          summary: "بيانات اصطناعية لاختبار الإسناد المتقاطع فقط."
        },
        select: { id: true }
      });
      const assignment = buildPlan35CrossAssignment("lawyer", "secretary");
      const task = await tx.task.create({
        data: {
          title: `${marker} مهمة بإسناد متقاطع`,
          description: "المحامي يراها عبر القضية والسكرتير عبر الإسناد المباشر.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assignedToId: personas[assignment.target.key].userId,
          caseId: legalCase.id,
          dueDate: new Date("2035-01-15T08:00:00.000Z"),
          createdById: personas.superAdmin.userId
        },
        select: { id: true }
      });
      const appointment = await tx.appointment.create({
        data: {
          clientId: client.id,
          lawyerId: personas[assignment.actor.key].userId,
          caseId: legalCase.id,
          title: `${marker} موعد اختبار الإسناد`,
          type: "INTERNAL_MEETING",
          mode: "OFFICE",
          startsAt: new Date("2035-01-15T09:00:00.000Z"),
          endsAt: new Date("2035-01-15T10:00:00.000Z"),
          status: "SCHEDULED",
          notes: "موعد اصطناعي قابل للحذف."
        },
        select: { id: true }
      });

      return {
        personas,
        crossAssignments: {
          clientId: client.id,
          caseId: legalCase.id,
          taskId: task.id,
          appointmentId: appointment.id,
          caseAssignedLawyerId: personas.lawyer.userId,
          taskDirectAssigneeId: personas.secretary.userId,
          createdById: personas.superAdmin.userId
        }
      };
    });
    return { namespace, marker, ...created, cleanup: () => cleanupPlan35DatabaseFixture(prisma, namespace, options) };
  } catch (error) {
    await cleanupPlan35DatabaseFixture(prisma, namespace, options).catch(() => undefined);
    throw error;
  }
}

export async function cleanupPlan35DatabaseFixture(
  prisma: PrismaClient,
  namespace: string,
  options: FixtureMutationOptions = {}
): Promise<Plan35DatabaseCleanupResult> {
  assertPlan35FixtureMutationAllowed(options);
  const safeNamespace = assertPlan35FixtureNamespace(namespace);
  const marker = plan35FixtureMarker(safeNamespace);
  const caseReference = plan35FixtureCaseReference(safeNamespace);
  const emailSuffix = `.${safeNamespace}@example.invalid`;

  return prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({ where: { email: { endsWith: emailSuffix } }, select: { id: true } });
    const clients = await tx.client.findMany({ where: { source: marker }, select: { id: true } });
    const cases = await tx.legalCase.findMany({ where: { internalFileNumber: caseReference }, select: { id: true } });
    const appointments = await tx.appointment.findMany({ where: { title: { startsWith: marker } }, select: { id: true } });
    const userIds = users.map(({ id }) => id);
    const clientIds = clients.map(({ id }) => id);
    const caseIds = cases.map(({ id }) => id);
    const appointmentIds = appointments.map(({ id }) => id);
    const auditLogs = await tx.auditLog.deleteMany({
      where: { OR: [{ actorId: { in: userIds } }, { clientId: { in: clientIds } }, { caseId: { in: caseIds } }, { appointmentId: { in: appointmentIds } }] }
    });
    const deletedAppointments = await tx.appointment.deleteMany({ where: { OR: [{ id: { in: appointmentIds } }, { title: { startsWith: marker } }] } });
    const deletedTasks = await tx.task.deleteMany({ where: { title: { startsWith: marker } } });
    const deletedCases = await tx.legalCase.deleteMany({ where: { OR: [{ id: { in: caseIds } }, { internalFileNumber: caseReference }] } });
    const deletedClients = await tx.client.deleteMany({ where: { OR: [{ id: { in: clientIds } }, { source: marker }] } });
    const deletedUsers = await tx.user.deleteMany({ where: { email: { endsWith: emailSuffix } } });
    return {
      auditLogs: auditLogs.count,
      appointments: deletedAppointments.count,
      tasks: deletedTasks.count,
      cases: deletedCases.count,
      clients: deletedClients.count,
      users: deletedUsers.count
    };
  });
}

export function plan35FixtureNamespace(value?: string) {
  const suffix = (value ?? randomUUID()).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return assertPlan35FixtureNamespace(suffix.startsWith("plan35-") ? suffix : `plan35-${suffix}`);
}

export function assertPlan35FixtureMutationAllowed({ allowDatabaseMutation = false, env = process.env }: FixtureMutationOptions = {}) {
  if (env.APP_ENV === "production" || env.NODE_ENV === "production") throw new Error("PLAN-35 disposable fixtures are forbidden in production runtimes.");
  if (!allowDatabaseMutation && env[PLAN35_FIXTURE_OPT_IN_ENV] !== "true") {
    throw new Error(`PLAN-35 database fixtures require allowDatabaseMutation=true or ${PLAN35_FIXTURE_OPT_IN_ENV}=true against a disposable database.`);
  }
}

function assertPlan35FixtureNamespace(namespace: string) {
  if (!/^plan35-[a-z0-9][a-z0-9-]{7,47}$/.test(namespace)) throw new Error(`Unsafe PLAN-35 fixture namespace: ${namespace}`);
  return namespace;
}

function plan35FixtureMarker(namespace: string) { return `[PLAN35:${assertPlan35FixtureNamespace(namespace)}]`; }
function plan35FixtureEmail(base: string, namespace: string) { return `${base.split("@")[0]}.${assertPlan35FixtureNamespace(namespace)}@example.invalid`; }
function plan35FixturePhone(namespace: string) {
  const digits = Array.from(namespace).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return `+20155${String(digits).padStart(7, "0").slice(-7)}`;
}
function plan35FixtureCaseReference(namespace: string) { return `PLAN35-${assertPlan35FixtureNamespace(namespace).slice(7).toUpperCase()}`; }

export type Plan35FixtureTransaction = Prisma.TransactionClient;
