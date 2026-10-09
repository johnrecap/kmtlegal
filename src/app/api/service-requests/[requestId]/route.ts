import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { ApiError, jsonOk } from "@/server/http/errors";
import { parseJsonRequest, parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { actOnServiceRequest, getServiceRequest, serviceActionSchema } from "@/server/services/service-request-service";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ requestId: string }> };
export async function GET(request: Request, context: Context) {
  try { const auth = await getAuthContextFromRequest(request); if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required."); return jsonOk(await getServiceRequest(auth.principal, parseWithSchema(uuidSchema, (await context.params).requestId))); }
  catch (error) { return phaseFiveErrorResponse(error, request); }
}
export async function POST(request: Request, context: Context) {
  try { const auth = await getAuthContextFromRequest(request); if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required."); return jsonOk(await actOnServiceRequest(auth.principal, parseWithSchema(uuidSchema, (await context.params).requestId), await parseJsonRequest(request, serviceActionSchema))); }
  catch (error) { return phaseFiveErrorResponse(error, request); }
}
