import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { ApiError, jsonOk } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";
import { createServiceRequest, createServiceRequestSchema, listServiceRequests } from "@/server/services/service-request-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { const auth = await getAuthContextFromRequest(request); if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required."); return jsonOk(await listServiceRequests(auth.principal)); }
  catch (error) { return phaseFiveErrorResponse(error, request); }
}
export async function POST(request: Request) {
  try { const auth = await getAuthContextFromRequest(request); if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required."); return jsonOk(await createServiceRequest(auth.principal, await parseJsonRequest(request, createServiceRequestSchema))); }
  catch (error) { return phaseFiveErrorResponse(error, request); }
}
