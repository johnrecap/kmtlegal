import { exportAdminPaymentsCsv } from "@/server/admin/finance-report-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const url = new URL(request.url);
    const result = await exportAdminPaymentsCsv({
      actor: context.principal,
      query: Object.fromEntries(url.searchParams.entries())
    });

    return new Response(result.content, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Export-Row-Count": String(result.count)
      }
    });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin-finance-export", method: "GET" });
  }
}
