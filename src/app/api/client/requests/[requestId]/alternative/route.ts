import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { ApiError, jsonOk } from "@/server/http/errors";
import { parseJsonRequest, parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { alternativeTimeSchema, requestAlternativeTime } from "@/server/portal/client-requests-service";
export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  try { const auth = await getAuthContextFromRequest(request); if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required."); return jsonOk(await requestAlternativeTime(auth.principal, parseWithSchema(uuidSchema, (await context.params).requestId), await parseJsonRequest(request, alternativeTimeSchema))); }
  catch (error) { return phaseFiveErrorResponse(error, request); }
}
