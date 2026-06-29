import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  const icon = await readFile(join(process.cwd(), "public", "brand", "kmt-logo-icon.png"));

  return new Response(new Uint8Array(icon), {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "image/png"
    }
  });
}
