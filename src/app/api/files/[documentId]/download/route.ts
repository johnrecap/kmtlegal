import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { getAuthorizedDocumentDownload } from "@/server/storage/document-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DocumentDownloadRouteProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(request: Request, { params }: DocumentDownloadRouteProps) {
  const requestId = getRequestId(request);
  const { documentId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const download = await getAuthorizedDocumentDownload({
      actor: context.principal,
      documentId,
      request
    });

    return new Response(download.bytes, {
      status: 200,
      headers: {
        ...download.headers,
        "X-Request-Id": requestId
      }
    });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
