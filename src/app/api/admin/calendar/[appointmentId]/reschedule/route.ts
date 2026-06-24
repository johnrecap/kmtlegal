import { NextResponse } from "next/server";
import { appointmentRescheduleSchema, rescheduleAdminCalendarAppointment } from "@/server/admin/case-operations-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type AppointmentActionRouteProps = {
  params: {
    appointmentId: string;
  };
};

export async function POST(request: Request, { params }: AppointmentActionRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, appointmentRescheduleSchema, "Appointment reschedule payload is invalid.");
    const appointment = await rescheduleAdminCalendarAppointment({
      actor: context.principal,
      appointmentId: params.appointmentId,
      body,
      request
    });

    return NextResponse.json({ data: appointment, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
