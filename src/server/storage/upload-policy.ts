import { ApiError } from "@/server/http/errors";

export const DEFAULT_MAX_UPLOAD_MB = 5;
export const DEFAULT_ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png"
] as const;

export const ALLOWED_EXTENSIONS_BY_MIME: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"]
};

export type UploadCandidate = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Buffer;
};

export type UploadPolicy = {
  maxBytes: number;
  allowedMimeTypes: string[];
};

export class UploadValidationError extends ApiError {
  constructor(status: number, code: "FILE_TOO_LARGE" | "UNSUPPORTED_FILE_TYPE" | "VALIDATION_ERROR", message: string) {
    super(status, code, message);
    this.name = "UploadValidationError";
  }
}

export function getUploadPolicy(): UploadPolicy {
  const maxUploadMb = Number.parseInt(process.env.MAX_UPLOAD_MB ?? String(DEFAULT_MAX_UPLOAD_MB), 10);
  const maxBytes = (Number.isFinite(maxUploadMb) && maxUploadMb > 0 ? maxUploadMb : DEFAULT_MAX_UPLOAD_MB) * 1024 * 1024;
  const allowedMimeTypes = (process.env.ALLOWED_UPLOAD_TYPES ?? DEFAULT_ALLOWED_UPLOAD_TYPES.join(","))
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return { maxBytes, allowedMimeTypes };
}

export function assertMultipartContentLengthAllowed(contentLength: string | null, policy = getUploadPolicy()) {
  if (!contentLength) {
    return;
  }

  const parsed = Number.parseInt(contentLength, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new UploadValidationError(400, "VALIDATION_ERROR", "Invalid Content-Length header.");
  }

  if (parsed > policy.maxBytes) {
    throw new UploadValidationError(413, "FILE_TOO_LARGE", "Uploaded request exceeds the 5MB limit.");
  }
}

export function getExtension(fileName: string) {
  const cleanName = fileName.trim().toLowerCase();
  const index = cleanName.lastIndexOf(".");
  return index >= 0 ? cleanName.slice(index + 1) : "";
}

export function sanitizeDownloadFileName(fileName: string) {
  const cleaned = fileName.replace(/[\\/\0\r\n]/g, "_").trim();
  return cleaned || "document";
}

export function assertUploadAllowed(candidate: UploadCandidate, policy = getUploadPolicy()) {
  if (candidate.sizeBytes <= 0 || candidate.bytes.length <= 0) {
    throw new UploadValidationError(400, "VALIDATION_ERROR", "Uploaded file is empty.");
  }

  if (candidate.sizeBytes > policy.maxBytes || candidate.bytes.length > policy.maxBytes) {
    throw new UploadValidationError(413, "FILE_TOO_LARGE", "Uploaded file exceeds the 5MB limit.");
  }

  if (!policy.allowedMimeTypes.includes(candidate.mimeType)) {
    throw new UploadValidationError(415, "UNSUPPORTED_FILE_TYPE", "Uploaded file type is not allowed.");
  }

  const extension = getExtension(candidate.fileName);
  const allowedExtensions = ALLOWED_EXTENSIONS_BY_MIME[candidate.mimeType] ?? [];
  if (!allowedExtensions.includes(extension)) {
    throw new UploadValidationError(415, "UNSUPPORTED_FILE_TYPE", "Uploaded file extension does not match an allowed type.");
  }

  if (!hasExpectedMagicBytes(candidate.mimeType, candidate.bytes)) {
    throw new UploadValidationError(415, "UNSUPPORTED_FILE_TYPE", "Uploaded file content does not match the declared type.");
  }
}

export function hasExpectedMagicBytes(mimeType: string, bytes: Buffer) {
  if (mimeType === "application/pdf") {
    return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "application/msword") {
    return bytes.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return bytes.subarray(0, 2).toString("ascii") === "PK";
  }

  return false;
}
