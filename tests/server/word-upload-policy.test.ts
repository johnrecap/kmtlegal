import { describe, expect, it } from "vitest";
import { hasExpectedMagicBytes, getUploadPolicy } from "@/server/storage/upload-policy";
const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
function archive(entries: Array<[string, string, number?]>) {
  const local: Buffer[] = []; const central: Buffer[] = []; let offset = 0;
  for (const [name, text, declared] of entries) {
    const file = Buffer.from(text); const filename = Buffer.from(name); const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt32LE(file.length, 18); header.writeUInt32LE(file.length, 22); header.writeUInt16LE(filename.length, 26);
    const entry = Buffer.concat([header, filename, file]); local.push(entry);
    const directory = Buffer.alloc(46); directory.writeUInt32LE(0x02014b50); directory.writeUInt32LE(file.length, 20); directory.writeUInt32LE(declared ?? file.length, 24); directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([directory, filename])); offset += entry.length;
  }
  const directory = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
const word: Array<[string, string, number?]> = [["[Content_Types].xml", '<Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'], ["word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>']];
describe("bounded Word archive inspection", () => {
  it("accepts a Word package, not an arbitrary ZIP renamed docx", () => {
    expect(hasExpectedMagicBytes(mime, archive(word))).toBe(true);
    expect(hasExpectedMagicBytes(mime, archive([["other.txt", "not a document"], ["another.txt", "unrelated"]]))).toBe(false);
  });
  it("rejects traversal, macros, duplicate names, oversized expansion and truncated directory", () => {
    for (const entry of [["../secret", "x"], ["word/vbaProject.bin", "x"], ["word/document.xml", "duplicate"], ["large.bin", "x", 60 * 1024 * 1024]] as Array<[string, string, number?]>) expect(hasExpectedMagicBytes(mime, archive([...word, entry]))).toBe(false);
    expect(hasExpectedMagicBytes(mime, archive(word).subarray(0, -10))).toBe(false);
  });
  it("cannot widen the approved five-megabyte/type policy through environment settings", () => {
    const policy = getUploadPolicy({ NODE_ENV: "test", MAX_UPLOAD_MB: "100", ALLOWED_UPLOAD_TYPES: "application/pdf,application/zip" });
    expect(policy.maxBytes).toBe(5 * 1024 * 1024); expect(policy.allowedMimeTypes).toEqual(["application/pdf"]);
  });
});
