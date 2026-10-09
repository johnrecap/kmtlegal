import { conversationCopy } from "@/content/conversation-copy";
import { getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";
// Retired creation endpoint: old tabs must not bypass office approval.
// Existing payment settlement/receipt endpoints remain available independently.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = body?.locale === "en" ? "en" : "ar";
  return jsonError(410, "FEATURE_DISABLED", conversationCopy[locale].legacy, getRequestId(request), undefined, { locale });
}
