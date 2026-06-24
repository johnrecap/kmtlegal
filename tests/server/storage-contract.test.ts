import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { documentDownloadHeaders } from "@/server/storage/download-headers";
import { generateDocumentFileKey } from "@/server/storage/file-keys";
import { assertMultipartContentLengthAllowed, assertUploadAllowed } from "@/server/storage/upload-policy";
import { resolvePrivateFilePath, resolveUploadsRoot, StorageConfigError, StoragePathError } from "@/server/storage/vps-storage";
import { canReadDocument } from "@/server/storage/document-service";

describe("document storage and upload contract", () => {
  it("accepts allowed PDF uploads under 5MB after MIME, extension, and magic-byte validation", () => {
    expect(() =>
      assertUploadAllowed({
        fileName: "contract.pdf",
        mimeType: "application/pdf",
        sizeBytes: 12,
        bytes: Buffer.from("%PDF-1.7 test")
      })
    ).not.toThrow();
  });

  it("rejects oversized, unsupported, and content-mismatched uploads", () => {
    expect(() =>
      assertUploadAllowed({
        fileName: "large.pdf",
        mimeType: "application/pdf",
        sizeBytes: 6 * 1024 * 1024,
        bytes: Buffer.alloc(6 * 1024 * 1024, "a")
      })
    ).toThrow("5MB");

    expect(() =>
      assertUploadAllowed({
        fileName: "script.exe",
        mimeType: "application/octet-stream",
        sizeBytes: 3,
        bytes: Buffer.from("MZ")
      })
    ).toThrow("not allowed");

    expect(() =>
      assertUploadAllowed({
        fileName: "image.png",
        mimeType: "image/png",
        sizeBytes: 8,
        bytes: Buffer.from("not-png!")
      })
    ).toThrow("content");
  });

  it("rejects oversized multipart requests before reading form data", () => {
    expect(() => assertMultipartContentLengthAllowed(String(5 * 1024 * 1024))).not.toThrow();
    expect(() => assertMultipartContentLengthAllowed(String(5 * 1024 * 1024 + 1))).toThrow("5MB");
    expect(() => assertMultipartContentLengthAllowed("not-a-number")).toThrow("Content-Length");
  });

  it("generates opaque document keys and rejects path traversal", () => {
    const key = generateDocumentFileKey({
      fileName: "Contract.PDF",
      mimeType: "application/pdf",
      now: new Date("2026-06-23T12:00:00Z")
    });

    expect(key).toMatch(/^documents\/2026\/06\/23\/[0-9a-f-]+\.pdf$/);

    const root = path.join(os.tmpdir(), "kmt-uploads");
    expect(resolvePrivateFilePath(key, root)).toContain(path.resolve(root));
    expect(() => resolvePrivateFilePath("../secret.pdf", root)).toThrow(StoragePathError);
    expect(() => resolvePrivateFilePath("documents\\secret.pdf", root)).toThrow(StoragePathError);
  });

  it("rejects private storage roots inside public directories", () => {
    expect(() => resolveUploadsRoot(path.join(os.tmpdir(), "public", "uploads"))).toThrow(StorageConfigError);
  });

  it("sets attachment download headers with no-store and nosniff", () => {
    const headers = documentDownloadHeaders({
      fileName: "case notes.pdf",
      mimeType: "application/pdf",
      sizeBytes: 120
    });

    expect(headers["Content-Disposition"]).toContain("attachment");
    expect(headers["Content-Disposition"]).toContain("case%20notes.pdf");
    expect(headers["Cache-Control"]).toBe("private, no-store");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("enforces document ownership and assigned lawyer read checks", () => {
    const client = { id: "u-client", roleName: "Client", permissions: ["document.read.own"] };
    const lawyer = { id: "u-lawyer", roleName: "Lawyer", permissions: ["document.read.assigned"] };
    const other = { id: "u-other", roleName: "Client", permissions: ["document.read.own"] };
    const document = {
      visibility: "CLIENT_VISIBLE",
      ownerClient: { userId: "u-client", assignedLawyerId: "u-lawyer" },
      case: null
    };

    expect(canReadDocument(client, document)).toBe(true);
    expect(canReadDocument(lawyer, document)).toBe(true);
    expect(canReadDocument(other, document)).toBe(false);
  });
});
