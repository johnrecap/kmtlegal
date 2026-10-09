import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import type { Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { appendAuditLog } from "@/server/audit/audit-service";
import { runAppointmentConflictTransaction, assertNoAppointmentConflict, APPOINTMENT_TRANSACTION_MODES, ACTIVE_APPOINTMENT_STATUSES } from "@/server/appointments/appointment-conflict-service";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { bookingCategoryForPublicService } from "@/content/public-content";
import { bookingAllowed } from "@/server/ai/company-conversation-policy";
import { ownAssistantSession } from "./conversation-session-service";
import { intakeDraftSchema } from "./conversation-contract";
import { cairoDateString, cairoWeekday, CONSULTATION_AVAILABILITY_SETTING_KEY, consultationAvailabilitySchema, consultationSlotDateSchema, defaultConsultationAvailability, generateConsultationSlots } from "./consultation-availability-service";
import { ensureAssistantHandoff } from "@/server/conversations/assistant-handoff-service";

type DB = Pick<Prisma.TransactionClient, "systemSetting" | "appointment" | "user">;
const phoneSchema = z.string().trim().max(24).refine(v => /^[+\d٠-٩۰-۹ ()-]+$/.test(v) && /^\d{8,15}$/.test(canonicalPhone(v) ?? ""));
export const directBookingInputSchema = z.strictObject({
  action: z.enum(["confirm_booking", "reschedule_booking", "cancel_booking", "request_callback"]),
  key: z.uuid(), revision: z.number().int().nonnegative(), confirmed: z.literal(true),
  fullName: z.string().trim().min(2).max(160).optional(), phone: phoneSchema.optional(),
  contactChannel: z.enum(["PHONE", "WHATSAPP"]).optional(), startsAt: z.iso.datetime().optional()
}).superRefine((v, ctx) => {
  if (["confirm_booking", "request_callback"].includes(v.action) && (!v.fullName || !v.phone || !v.contactChannel)) ctx.addIssue({ code: "custom", message: "Contact details required." });
  if (["confirm_booking", "reschedule_booking"].includes(v.action) && !v.startsAt) ctx.addIssue({ code: "custom", message: "Appointment time required." });
});

async function availableCandidates(db: DB, date?: string, excludeAppointmentId?: string, now = new Date()) {
  if (date) consultationSlotDateSchema.parse(date);
  const setting = await db.systemSetting.findUnique({ where: { key: CONSULTATION_AVAILABILITY_SETTING_KEY } });
  const availability = consultationAvailabilitySchema.parse({ ...defaultConsultationAvailability, ...(setting?.value as object ?? {}) });
  if (!availability.directBooking.published) return { published: false, slots: [] };
  const ids = [...new Set(availability.directBooking.roster.flatMap(d => d.lawyerIds))];
  const lawyers = await db.user.findMany({ where: { id: { in: ids }, status: "ACTIVE", deletedAt: null, role: { name: "Lawyer", status: "ACTIVE" } }, select: { id: true } });
  const appointments = await db.appointment.findMany({ where: {
    id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
    status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
    endsAt: { gt: new Date(now.getTime() - 86400000) }, startsAt: { lt: new Date(now.getTime() + 62 * 86400000) },
    OR: [{ type: "CONSULTATION" }, { lawyerId: { in: ids } }]
  }, select: { id: true, type: true, lawyerId: true, startsAt: true, endsAt: true } });
  const slots = generateConsultationSlots({ availability, mode: "PHONE", date, now, limit: 6000, appointments: appointments.filter(a => a.type === "CONSULTATION") }).flatMap(slot => {
    const start = new Date(slot.startsAt), end = new Date(slot.endsAt), day = cairoDateString(start);
    const roster = availability.directBooking.roster.find(d => d.weekday === cairoWeekday(day))?.lawyerIds ?? [];
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(start).split(":").map(Number);
    const minute = parts[0] * 60 + parts[1];
    const busy = (id: string) => appointments.some(a => a.lawyerId === id && a.startsAt < end && a.endsAt > start);
    const closed = (id: string) => availability.directBooking.closures.some(c => c.date === day && (!c.lawyerId || c.lawyerId === id) && minute < toMinutes(c.end) && minute + availability.slotDurationMinutes > toMinutes(c.start));
    const eligible = lawyers.filter(l => roster.includes(l.id) && !busy(l.id) && !closed(l.id)).map(l => ({ id: l.id, count: appointments.filter(a => a.lawyerId === l.id && cairoDateString(a.startsAt) === day).length })).sort((a,b) => a.count - b.count || a.id.localeCompare(b.id));
    return eligible.length ? [{ ...slot, lawyerId: eligible[0].id }] : [];
  });
  return { published: true, slots };
}
function toMinutes(clock: string) { const [h,m] = clock.split(":").map(Number); return h * 60 + m; }

export async function listDirectBookingSlots(date?: string, excludeAppointmentId?: string) {
  const result = await availableCandidates(prisma, date, excludeAppointmentId);
  return { published: result.published, slots: result.slots.slice(0, date ? 100 : 3).map(({ lawyerId: _lawyerId, ...slot }) => slot) };
}

export async function readDirectBooking(requestId: string | null) {
  if (!requestId) return null;
  const row = await prisma.consultationRequest.findUnique({ where: { id: requestId }, select: {
    confirmationSource: true, contactChannel: true, publicReference: true, fullName: true, phone: true, serviceCategory: true, status: true,
    appointments: { where: { type: "CONSULTATION", caseId: null }, orderBy: { createdAt: "desc" }, take: 1,
      select: { id: true, startsAt: true, endsAt: true, status: true, lawyer: { select: { name: true } } } }
  } });
  return row && row.confirmationSource !== "STAFF_APPROVAL" ? row : null;
}

export async function mutateDirectBooking(token: string, body: z.infer<typeof directBookingInputSchema>, actor?: Principal | null) {
  const owned = await ownAssistantSession(token, actor);
  const hash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  await runAppointmentConflictTransaction({ mode: APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry, operation: async tx => {
    await tx.$queryRaw`SELECT id FROM assistant_sessions WHERE id = ${owned.id}::uuid FOR UPDATE`;
    const session = await tx.assistantSession.findUniqueOrThrow({ where: { id: owned.id } });
    if (session.expiresAt <= new Date() || (session.clientId && session.clientId !== actor?.clientId)) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    const replay = await tx.assistantBookingAction.findUnique({ where: { sessionId_key: { sessionId: session.id, key: body.key } } });
    if (replay) { if (replay.requestHash !== hash) throw new ApiError(409, "CONFLICT", "Booking action changed."); return; }
    if (session.revision !== body.revision || session.leaseId) throw new ApiError(409, "CONFLICT", "Conversation changed.");
    const existing = session.consultationRequestId ? await tx.consultationRequest.findUniqueOrThrow({ where: { id: session.consultationRequestId }, include: { appointments: { where: { type: "CONSULTATION", caseId: null }, orderBy: { createdAt: "desc" } } } }) : null;
    if (existing?.confirmationSource === "STAFF_APPROVAL") throw new ApiError(409, "CONFLICT", "Existing request requires office review.");
    const appointment = existing?.appointments[0];
    const editing = body.action === "cancel_booking" || body.action === "reschedule_booking";
    if (editing && (!appointment || !["SCHEDULED", "RESCHEDULED"].includes(appointment.status) || appointment.startsAt <= new Date() || existing?.outcomeStatus !== "PENDING")) throw new ApiError(409, "CONFLICT", "Appointment cannot be changed.");
    if (!editing && (existing || !bookingAllowed(session.dialogue))) throw new ApiError(409, "CONFLICT", "Explicit booking consent required.");
    if (body.action === "cancel_booking") {
      await tx.appointment.update({ where: { id: appointment!.id }, data: { status: "CANCELLED" } });
      await tx.consultationRequest.update({ where: { id: existing!.id }, data: { status: "REJECTED", outcomeStatus: "CANCELLED", outcomeAt: new Date(), outcomeVersion: { increment: 1 } } });
    } else {
      const phone = canonicalPhone(existing?.phone ?? body.phone)!;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`direct-booking:${phone}`}))::text`;
      const duplicate = await tx.consultationRequest.findFirst({ where: { id: existing ? { not: existing.id } : undefined, phoneCanonical: phone, confirmationSource: "PUBLISHED_SLOT", appointments: { some: { startsAt: { gt: new Date() }, status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } } } }, select: { id: true } });
      if (duplicate) throw new ApiError(409, "APPOINTMENT_CONFLICT", "An active booking already exists.");
      const slot = body.action === "request_callback" ? null : (await availableCandidates(tx, cairoDateString(new Date(body.startsAt!)), appointment?.id)).slots.find(s => Date.parse(s.startsAt) === Date.parse(body.startsAt!));
      if (body.action !== "request_callback" && !slot) throw new ApiError(409, "APPOINTMENT_CONFLICT", "Time is unavailable.");
      if (slot) {
        await assertNoAppointmentConflict({ client: tx, scope: { kind: "office-consultation" }, startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt), excludeAppointmentId: appointment?.id });
        await assertNoAppointmentConflict({ client: tx, scope: { kind: "lawyer", lawyerId: slot.lawyerId }, startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt), excludeAppointmentId: appointment?.id });
      }
      const draft = intakeDraftSchema.parse(session.draft);
      const locale = session.locale === "en" ? "en" : "ar";
      // Never look up historical clients by contact details. A guest gets an isolated lead, not an account.
      const clientId = existing?.clientId ?? session.clientId ?? (await tx.client.create({ data: { fullName: body.fullName!, phone: body.phone!, phoneCanonical: phone, status: "LEAD", source: "assistant_guest_booking", assignedLawyerId: slot?.lawyerId } })).id;
      if (slot) await assertNoAppointmentConflict({ client: tx, scope: { kind: "client", clientId }, startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt), excludeAppointmentId: appointment?.id });
      const id = existing?.id ?? randomUUID();
      if (!existing) await tx.consultationRequest.create({ data: { id, clientId, publicReference: `CONS-${id.replaceAll("-", "").toUpperCase()}`, fullName: body.fullName!, phone: body.phone!, phoneCanonical: phone, serviceCategory: bookingCategoryForPublicService(draft.service ?? "legal-consultation", locale) ?? "legal-consultation", summary: draft.summary ?? directBookingCopy[locale].defaultSummary, preferredMode: "PHONE", contactChannel: body.contactChannel!, locale, confirmationSource: slot ? "PUBLISHED_SLOT" : "CALLBACK_REQUEST", status: slot ? "SCHEDULED" : "NEW", assignedLawyerId: slot?.lawyerId, requestedStartsAt: slot ? new Date(slot.startsAt) : null, requestedEndsAt: slot ? new Date(slot.endsAt) : null } });
      if (slot) {
        const data = { lawyerId: slot.lawyerId, startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt) };
        await tx.client.updateMany({ where: { id: clientId, source: "assistant_guest_booking", userId: null }, data: { assignedLawyerId: slot.lawyerId } });
        if (appointment) await tx.appointment.update({ where: { id: appointment.id }, data: { ...data, status: "RESCHEDULED" } });
        else await tx.appointment.create({ data: { ...data, clientId, consultationRequestId: id, type: "CONSULTATION", mode: "PHONE", status: "SCHEDULED", title: directBookingCopy[locale].appointmentTitle } });
        if (existing) await tx.consultationRequest.update({ where: { id }, data: { assignedLawyerId: slot.lawyerId, requestedStartsAt: data.startsAt, requestedEndsAt: data.endsAt, outcomeVersion: { increment: 1 } } });
      }
      await tx.assistantSession.update({ where: { id: session.id }, data: { consultationRequestId: id, draft: { ...draft, fullName: existing?.fullName ?? body.fullName, phone: `+${phone}`, preferredMode: "PHONE", ...(slot ? { requestedStartsAt: slot.startsAt } : {}) } as Prisma.InputJsonValue } });
      const threadId = await ensureAssistantHandoff(tx, session.id);
      await tx.conversationThread.update({ where: { id: threadId }, data: { clientId, ...(!session.humanOwned && slot ? { assignedToId: slot.lawyerId } : {}) } });
      const copy = directBookingCopy[locale];
      await tx.conversationMessage.create({ data: { threadId, senderType: "SYSTEM", body: [
        slot ? copy.confirmed : copy.callbackDone,
        `${copy.reference}: ${existing?.publicReference ?? `CONS-${id.replaceAll("-", "").toUpperCase()}`}`,
        `${existing?.fullName ?? body.fullName} · ${existing?.phone ?? body.phone}`,
        (existing?.contactChannel ?? body.contactChannel) === "WHATSAPP" ? copy.whatsapp : copy.phone,
        ...(slot ? [`${new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(slot.startsAt))} · ${copy.cairo}`] : []),
        draft.summary ?? copy.defaultSummary
      ].join("\n") } });
    }
    await tx.assistantSession.update({ where: { id: session.id }, data: { revision: { increment: 1 } } });
    await tx.assistantBookingAction.create({ data: { sessionId: session.id, key: body.key, requestHash: hash } });
    await appendAuditLog({ client: tx, action: `assistant.${body.action}`, actorId: actor?.id, resourceType: "AssistantSession", resourceId: session.id });
  } });
}
