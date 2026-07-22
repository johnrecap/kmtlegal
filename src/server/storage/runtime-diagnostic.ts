import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { malwareScanMode, pingClamAv } from "./malware-scan";
import { getUploadPolicy } from "./upload-policy";
import { getUploadsRoot, resolveUploadsRoot } from "./vps-storage";

const BYTES_PER_MEGABYTE = 1024 * 1024;
const DIAGNOSTIC_SCANNER_TIMEOUT_MS = 2_000;

export type StorageRuntimeDiagnostic = {
  source: "environment";
  status: "configured" | "degraded" | "unavailable";
  driver: "vps-filesystem";
  maxUploadMb: number;
  allowedTypes: string[];
  uploadsPathConfigured: boolean;
  rootStatus: "valid-writable" | "invalid" | "unwritable";
  scannerMode: "required" | "optional-disabled";
  scannerStatus: "reachable" | "disabled" | "unreachable";
  checkedAt: string;
  editable: false;
};

type DiagnosticFileSystem = {
  stat(path: string): Promise<{ isDirectory(): boolean }>;
  access(path: string, mode?: number): Promise<unknown>;
};

type DiagnosticOptions = {
  env?: NodeJS.ProcessEnv;
  now?: Date;
  fileSystem?: DiagnosticFileSystem;
  ping?: typeof pingClamAv;
};

export async function getStorageRuntimeDiagnostic(
  options: DiagnosticOptions = {}
): Promise<StorageRuntimeDiagnostic> {
  const env = options.env ?? process.env;
  const fileSystem = options.fileSystem ?? fs;
  const rootStatus = await storageRootStatus(env, fileSystem);
  const scanner = await scannerDiagnostic(env, options.ping ?? pingClamAv);
  const policy = getUploadPolicy(env);

  return {
    source: "environment",
    status: diagnosticStatus(env, rootStatus, scanner.status),
    driver: "vps-filesystem",
    maxUploadMb: policy.maxBytes / BYTES_PER_MEGABYTE,
    allowedTypes: policy.allowedMimeTypes,
    uploadsPathConfigured: Boolean(env.UPLOADS_DIR?.trim()),
    rootStatus,
    scannerMode: scanner.mode,
    scannerStatus: scanner.status,
    checkedAt: (options.now ?? new Date()).toISOString(),
    editable: false
  };
}

async function storageRootStatus(
  env: NodeJS.ProcessEnv,
  fileSystem: DiagnosticFileSystem
): Promise<StorageRuntimeDiagnostic["rootStatus"]> {
  if (!env.UPLOADS_DIR?.trim()) return "invalid";

  let root: string;
  try {
    root = resolveUploadsRoot(getUploadsRoot(env));
  } catch {
    return "invalid";
  }

  try {
    const stats = await fileSystem.stat(root);
    if (!stats.isDirectory()) return "invalid";
  } catch {
    return "invalid";
  }

  try {
    await fileSystem.access(root, fsConstants.W_OK);
    return "valid-writable";
  } catch {
    return "unwritable";
  }
}

async function scannerDiagnostic(env: NodeJS.ProcessEnv, ping: typeof pingClamAv) {
  if (malwareScanMode(env) === "disabled") {
    return { mode: "optional-disabled" as const, status: "disabled" as const };
  }

  try {
    const reachable = await ping(env, DIAGNOSTIC_SCANNER_TIMEOUT_MS);
    return { mode: "required" as const, status: reachable ? "reachable" as const : "unreachable" as const };
  } catch {
    return { mode: "required" as const, status: "unreachable" as const };
  }
}

function diagnosticStatus(
  env: NodeJS.ProcessEnv,
  rootStatus: StorageRuntimeDiagnostic["rootStatus"],
  scannerStatus: StorageRuntimeDiagnostic["scannerStatus"]
): StorageRuntimeDiagnostic["status"] {
  if (rootStatus !== "valid-writable" || scannerStatus === "unreachable") return "unavailable";
  if (scannerStatus === "reachable") return "configured";
  return isProduction(env) ? "unavailable" : "degraded";
}

function isProduction(env: NodeJS.ProcessEnv) {
  return env.APP_ENV === "production" || env.NODE_ENV === "production";
}
