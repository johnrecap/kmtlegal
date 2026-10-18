import { ApiError } from "@/server/http/errors";

/** Shared byte ceiling; provider bodies and prompts never enter diagnostics. */
export async function readBoundedAIResponse(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid.");
  let raw = "", bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 131_072) { await reader.cancel(); throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid."); }
      raw += decoder.decode(part.value, { stream: true });
    }
    raw += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(raw); }
  catch { throw new ApiError(502, "AI_OUTPUT_INVALID", "AI provider response is invalid."); }
}
