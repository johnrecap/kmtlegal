import { sanitizeDownloadFileName } from "./upload-policy";

export function documentDownloadHeaders(input: { fileName: string; mimeType: string; sizeBytes: number }) {
  const fileName = sanitizeDownloadFileName(input.fileName);
  const encoded = encodeURIComponent(fileName);

  return {
    "Content-Type": input.mimeType,
    "Content-Length": String(input.sizeBytes),
    "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "_")}"; filename*=UTF-8''${encoded}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff"
  };
}
