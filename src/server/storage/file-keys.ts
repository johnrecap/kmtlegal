import crypto from "node:crypto";
import { ALLOWED_EXTENSIONS_BY_MIME, getExtension } from "./upload-policy";

export function generateDocumentFileKey(input: { fileName: string; mimeType: string; now?: Date }) {
  const now = input.now ?? new Date();
  const datePath = now.toISOString().slice(0, 10).replaceAll("-", "/");
  const extension = extensionForUpload(input.fileName, input.mimeType);
  return `documents/${datePath}/${crypto.randomUUID()}.${extension}`;
}

function extensionForUpload(fileName: string, mimeType: string) {
  const extension = getExtension(fileName);
  const allowed = ALLOWED_EXTENSIONS_BY_MIME[mimeType] ?? [];
  return allowed.includes(extension) ? extension : allowed[0] ?? "bin";
}
