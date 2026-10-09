import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { ApiError, jsonOk } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";
import { publishQuestionnaire, questionnaireSchema } from "@/server/services/service-request-service";
export async function POST(request: Request) {
  try { const auth = await getAuthContextFromRequest(request); if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required."); return jsonOk(await publishQuestionnaire(auth.principal, await parseJsonRequest(request, questionnaireSchema))); }
  catch (error) { return phaseFiveErrorResponse(error, request); }
}
