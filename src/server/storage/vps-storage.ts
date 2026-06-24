import fs from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@/server/http/errors";

export class StorageConfigError extends ApiError {
  constructor(message: string) {
    super(500, "INTERNAL_ERROR", message);
    this.name = "StorageConfigError";
  }
}

export class StoragePathError extends ApiError {
  constructor(message = "Invalid storage path.") {
    super(400, "VALIDATION_ERROR", message);
    this.name = "StoragePathError";
  }
}

export function getUploadsRoot() {
  return process.env.UPLOADS_DIR ?? "/var/lib/kmt-legal/uploads";
}

export function resolveUploadsRoot(uploadRoot = getUploadsRoot()) {
  const resolved = path.resolve(uploadRoot);
  const lower = resolved.toLowerCase();
  const publicSegment = `${path.sep}public`;

  if (lower.endsWith(publicSegment) || lower.includes(`${publicSegment}${path.sep}`)) {
    throw new StorageConfigError("UPLOADS_DIR must not be inside a public web directory.");
  }

  return resolved;
}

export function resolvePrivateFilePath(fileKey: string, uploadRoot = getUploadsRoot()) {
  if (!fileKey || fileKey.includes("\0") || fileKey.includes("\\") || path.isAbsolute(fileKey)) {
    throw new StoragePathError();
  }

  const normalized = path.posix.normalize(fileKey);
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new StoragePathError();
  }

  const root = resolveUploadsRoot(uploadRoot);
  const absolutePath = path.resolve(root, ...normalized.split("/"));
  const allowedPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (absolutePath !== root && !absolutePath.startsWith(allowedPrefix)) {
    throw new StoragePathError();
  }

  return absolutePath;
}

export async function savePrivateFile(input: { fileKey: string; bytes: Buffer; uploadRoot?: string }) {
  const targetPath = resolvePrivateFilePath(input.fileKey, input.uploadRoot);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, input.bytes, { flag: "wx" });
  return targetPath;
}

export async function readPrivateFile(input: { fileKey: string; uploadRoot?: string }) {
  const targetPath = resolvePrivateFilePath(input.fileKey, input.uploadRoot);
  return fs.readFile(targetPath);
}
