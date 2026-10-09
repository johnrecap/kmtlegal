import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { Prisma } from "@prisma/client";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { ApiError, jsonOk } from "@/server/http/errors";
import { paymentEntryInputSchema, postPaymentEntry } from "@/server/payments/payment-ledger-service";
import { parseJsonRequest, parseWithSchema, uuidSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ paymentId: string }> }) {
  try {
    const auth = await getAuthContextFromRequest(request);
    if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    const paymentId = parseWithSchema(uuidSchema, (await context.params).paymentId);
    const body = await parseJsonRequest(request, paymentEntryInputSchema);
    return jsonOk(await postPaymentEntry({ actor: auth.principal, paymentId, body, request }));
  } catch (error) {
    const normalized = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
      ? new ApiError(409, "CONFLICT", "This receipt or correction has already been recorded.") : error;
    return phaseFiveErrorResponse(normalized, request);
  }
}
