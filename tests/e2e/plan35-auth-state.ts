import { mkdir, rm, rmdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { PrismaClient } from "@prisma/client";
import type { Browser, Page } from "@playwright/test";
import { PLAN35_ROLE_KEYS, type Plan35RoleKey } from "../fixtures/plan35-role-fixtures";
import { createPlan35DatabaseFixture, type Plan35DatabaseFixture, type Plan35DatabasePersona } from "../fixtures/plan35-db-fixtures";

export const PLAN35_AUTH_STATE_ROOT = resolve(process.cwd(), "test-results", "plan35", "auth");

export type Plan35StorageStateBundle = {
  namespace: string;
  paths: Record<Plan35RoleKey, string>;
  cleanup: () => Promise<void>;
};

export async function loginPlan35Persona(page: Page, persona: Plan35DatabasePersona, options: { baseURL?: string; destination?: string } = {}) {
  const destination = options.destination ?? "/admin";
  const baseURL = options.baseURL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  const response = await page.request.post("/api/auth/login", {
    data: { email: persona.email, password: persona.password },
    headers: { Origin: new URL(baseURL).origin }
  });
  if (response.status() !== 200) throw new Error(`PLAN-35 login failed for ${persona.key}: HTTP ${response.status()}`);
  const body = (await response.json()) as { status?: string };
  if (body.status !== "authenticated") throw new Error(`PLAN-35 login for ${persona.key} did not produce an authenticated session.`);
  await page.goto(destination, { waitUntil: "domcontentloaded" });
  if (new URL(page.url()).pathname.startsWith("/login")) throw new Error(`PLAN-35 persona ${persona.key} was redirected to login.`);
}

export async function loginPlan35PersonaThroughUi(page: Page, persona: Plan35DatabasePersona, destination = "/admin") {
  await page.goto(`/login?next=${encodeURIComponent(destination)}`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(persona.email);
  await page.locator('input[name="password"]').fill(persona.password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === destination || url.pathname.startsWith(`${destination}/`)),
    page.locator('button[type="submit"]').click()
  ]);
}

export async function createPlan35StorageStates({ browser, baseURL, database, outputRoot = PLAN35_AUTH_STATE_ROOT }: {
  browser: Browser;
  baseURL: string;
  database: Plan35DatabaseFixture;
  outputRoot?: string;
}): Promise<Plan35StorageStateBundle> {
  const paths = Object.create(null) as Record<Plan35RoleKey, string>;
  try {
    for (const key of PLAN35_ROLE_KEYS) {
      const statePath = plan35StorageStatePath(database.namespace, key, outputRoot);
      await mkdir(dirname(statePath), { recursive: true });
      const context = await browser.newContext({ baseURL });
      try {
        const page = await context.newPage();
        await loginPlan35Persona(page, database.personas[key], { baseURL });
        await context.storageState({ path: statePath });
        paths[key] = statePath;
      } finally {
        await context.close();
      }
    }
  } catch (error) {
    await cleanupStorageStates(Object.values(paths));
    throw error;
  }
  return { namespace: database.namespace, paths, cleanup: () => cleanupStorageStates(Object.values(paths)) };
}

export async function createPlan35AuthenticatedTestState({ prisma, browser, baseURL, namespace, outputRoot, allowDatabaseMutation = false }: {
  prisma: PrismaClient;
  browser: Browser;
  baseURL: string;
  namespace?: string;
  outputRoot?: string;
  allowDatabaseMutation?: boolean;
}) {
  const database = await createPlan35DatabaseFixture(prisma, { namespace, allowDatabaseMutation });
  try {
    const storage = await createPlan35StorageStates({ browser, baseURL, database, outputRoot });
    let cleaned = false;
    return {
      database,
      storage,
      cleanup: async () => {
        if (cleaned) return;
        cleaned = true;
        await storage.cleanup();
        await database.cleanup();
      }
    };
  } catch (error) {
    await database.cleanup().catch(() => undefined);
    throw error;
  }
}

export function plan35StorageStatePath(namespace: string, key: Plan35RoleKey, outputRoot = PLAN35_AUTH_STATE_ROOT) {
  return join(resolve(outputRoot), namespace, `${key}.json`);
}

export function configuredPlan35StorageState(key: Plan35RoleKey, env: NodeJS.ProcessEnv = process.env) {
  const variable = `PLAN35_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}_STORAGE_STATE`;
  return env[variable] || env.PLAN35_E2E_STORAGE_STATE || null;
}

async function cleanupStorageStates(paths: string[]) {
  const unique = [...new Set(paths.map((item) => resolve(item)))];
  await Promise.all(unique.map((item) => rm(item, { force: true })));
  for (const directory of [...new Set(unique.map((item) => dirname(item)))].sort((a, b) => b.length - a.length)) {
    await rmdir(directory).catch(() => undefined);
  }
}
