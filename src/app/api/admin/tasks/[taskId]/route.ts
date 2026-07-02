import { NextResponse } from "next/server";
import { adminTaskWriteSchema, updateAdminTask } from "@/server/admin/task-document-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type TaskRouteProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function PATCH(request: Request, { params }: TaskRouteProps) {
  const requestId = getRequestId(request);
  const { taskId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminTaskWriteSchema, "Task payload is invalid.");
    const task = await updateAdminTask({
      actor: context.principal,
      taskId,
      body,
      request
    });

    return NextResponse.json({ data: task, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
