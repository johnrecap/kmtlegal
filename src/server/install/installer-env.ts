import { timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import { ApiError } from "@/server/http/errors";

const INSTALLER_LOCK_DEFAULT = "/var/lib/kmt-legal/install.lock";

export function isInstallerEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.INSTALLER_ENABLED === "true";
}

export function getInstallerLockPath(env: NodeJS.ProcessEnv = process.env) {
  return env.INSTALLER_LOCK_PATH || INSTALLER_LOCK_DEFAULT;
}

export function installerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-installer-token")?.trim() || new URL(request.url).searchParams.get("token")?.trim() || "";
}

export function assertInstallerToken(token: string, env: NodeJS.ProcessEnv = process.env) {
  const expected = env.INSTALLER_SETUP_TOKEN?.trim();
  if (!expected || !safeEqual(token, expected)) {
    throw new ApiError(403, "FORBIDDEN", "Installer setup token is invalid.");
  }
}

export async function hasInstallerLockFile() {
  try {
    await fs.access(getInstallerLockPath());
    return true;
  } catch {
    return false;
  }
}

function safeEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
