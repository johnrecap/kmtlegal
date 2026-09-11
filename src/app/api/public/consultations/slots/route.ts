import { NextResponse } from "next/server";
import { z } from "zod";
import { consultationSlotFilterSchema, listPublicConsultationSlots } from "@/server/consultations/consultation-availability-service";
import { errorToResponse, getRequestId } from "@/server/http/errors";
import { parseQueryParams } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

const slotsQuerySchema = consultationSlotFilterSchema.extend({
  mode: z.enum(["PHONE", "ONLINE", "OFFICE"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional()
});

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const query = parseQueryParams(request, slotsQuerySchema, "Consultation slot query is invalid.");
    const slots = await listPublicConsultationSlots({
      mode: query.mode,
      date: query.date,
      fromTime: query.fromTime,
      toTime: query.toTime,
      limit: query.limit
    });
    return NextResponse.json({ data: { slots }, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
