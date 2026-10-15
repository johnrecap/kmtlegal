import type { BookingAvailability, BookingAvailabilityStatus, BookingDay, BookingSlot } from "@/lib/direct-booking-availability";
import { ValidationApiError } from "@/server/http/errors";
import { parseWithSchema } from "@/server/validation/schemas";
import { addCairoDays, cairoDateString, cairoWeekday, consultationSlotFilterSchema, consultationSlotWindow, generateConsultationSlots, type ConsultationAvailability, type PublicConsultationSlotFilter } from "./consultation-availability-service";

export type BookingAvailabilitySnapshot = {
  availability: ConsultationAvailability; now: Date; lawyers: Array<{ id: string }>;
  appointments: Array<{ type: string; lawyerId: string | null; startsAt: Date; endsAt: Date }>;
};
type Candidate = BookingSlot & { lawyerId: string };
const minutes = (clock: string) => { const [h, m] = clock.split(":").map(Number); return h * 60 + m; };
const clockFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const slotMinute = (time: string) => minutes(clockFormatter.format(new Date(time)));
const overlaps = (slot: BookingSlot, appointment: { startsAt: Date; endsAt: Date }) => appointment.startsAt < new Date(slot.endsAt) && appointment.endsAt > new Date(slot.startsAt);

function closedFor(snapshot: BookingAvailabilitySnapshot, date: string, start: number, lawyerId: string) {
  return snapshot.availability.directBooking.closures.some(c => c.date === date && (!c.lawyerId || c.lawyerId === lawyerId) &&
    start < minutes(c.end) && start + snapshot.availability.slotDurationMinutes > minutes(c.start));
}

function candidateFor(snapshot: BookingAvailabilitySnapshot, date: string, slot: BookingSlot, roster: Array<{ id: string }>): Candidate | BookingAvailabilityStatus {
  const start = Date.parse(slot.startsAt);
  const window = consultationSlotWindow(snapshot.availability, snapshot.now);
  const reasons = new Set<BookingAvailabilityStatus>();
  if (start < window.startsAt.getTime()) reasons.add("LEAD_TIME");
  if (start >= window.endsAt.getTime()) reasons.add("OUTSIDE_WINDOW");
  if (snapshot.appointments.some(a => a.type === "CONSULTATION" && overlaps(slot, a))) reasons.add("FULL");
  const minute = slotMinute(slot.startsAt);
  const open = roster.filter(l => !closedFor(snapshot, date, minute, l.id));
  if (!open.length) reasons.add("CLOSED_EXCEPTION");
  const eligible = open.filter(l => !snapshot.appointments.some(a => a.lawyerId === l.id && overlaps(slot, a)));
  if (open.length && !eligible.length) reasons.add(open.length === roster.length ? "FULL" : "NO_SLOTS");
  if (reasons.size) return reasons.size === 1 ? [...reasons][0] : "NO_SLOTS";
  const dailyCount = (id: string) => snapshot.appointments.filter(a => a.lawyerId === id && cairoDateString(a.startsAt) === date).length;
  const winner = eligible.map(l => ({ id: l.id, count: dailyCount(l.id) })).sort((a, b) => a.count - b.count || a.id.localeCompare(b.id))[0];
  return { ...slot, lawyerId: winner.id };
}

export function directBookingDay(snapshot: BookingAvailabilitySnapshot, date: string, filter: PublicConsultationSlotFilter = {}) {
  const { availability, now } = snapshot;
  const day = availability.days.find(d => d.weekday === cairoWeekday(date));
  const hours = day?.enabled && day.modes.includes("PHONE") ? { start: day.start, end: day.end } : null;
  const closedPeriods = availability.directBooking.closures.filter(c => c.date === date && !c.lawyerId).map(c => ({ start: c.start, end: c.end }));
  const describe = (status: BookingAvailabilityStatus, slots: Candidate[] = []) => ({ day: { date, status, hours, closedPeriods } satisfies BookingDay, slots });
  if (!availability.directBooking.published) return { day: { date, status: "UNPUBLISHED" as const, hours: null, closedPeriods: [] }, slots: [] as Candidate[] };
  const today = cairoDateString(now);
  const lastDate = cairoDateString(new Date(consultationSlotWindow(availability, now).endsAt.getTime() - 1));
  if (date < today || date > lastDate) return describe("OUTSIDE_WINDOW");
  if (!day?.enabled) return describe("CLOSED_WEEKLY");
  if (!day.modes.includes("PHONE")) return describe("MODE_UNAVAILABLE");
  const ids = availability.directBooking.roster.find(r => r.weekday === day.weekday)?.lawyerIds ?? [];
  const roster = snapshot.lawyers.filter(l => ids.includes(l.id));
  if (!roster.length) return describe("NO_STAFF");
  // Generate the whole local day first so elapsed/lead-time slots can be explained rather than silently omitted.
  const nominal = generateConsultationSlots({ availability: { ...availability, minLeadHours: 0, bookingWindowDays: 2 },
    date, mode: "PHONE", now: new Date(Date.parse(`${date}T00:00:00Z`) - 86400000), appointments: [], limit: 100
  }).map(slot => ({ ...slot, mode: "PHONE" as const }));
  const requested = nominal.filter(slot => (!filter.fromTime || slotMinute(slot.startsAt) >= minutes(filter.fromTime)) &&
    (!filter.toTime || slotMinute(slot.startsAt) + availability.slotDurationMinutes <= minutes(filter.toTime)));
  if (!requested.length) return describe((filter.fromTime && minutes(filter.fromTime) >= minutes(day.end)) ||
    (filter.toTime && minutes(filter.toTime) <= minutes(day.start)) ? "OUTSIDE_HOURS" : "NO_SLOTS");
  const evaluated = requested.map(slot => candidateFor(snapshot, date, slot, roster));
  const slots = evaluated.filter((candidate): candidate is Candidate => typeof candidate !== "string");
  const reasons = new Set(evaluated.filter((reason): reason is BookingAvailabilityStatus => typeof reason === "string"));
  return describe(slots.length ? "AVAILABLE" : reasons.size === 1 ? [...reasons][0] : "NO_SLOTS", slots);
}

function publicSlot({ lawyerId: _lawyerId, ...slot }: Candidate): BookingSlot { return slot; }

export function buildBookingAvailability(snapshot: BookingAvailabilitySnapshot, query: PublicConsultationSlotFilter = {}): BookingAvailability {
  const filter = parseWithSchema(consultationSlotFilterSchema, query);
  if (filter.fromTime && filter.toTime && filter.toTime <= filter.fromTime) throw new ValidationApiError();
  const { availability, now } = snapshot;
  const today = cairoDateString(now);
  const lastDate = cairoDateString(new Date(consultationSlotWindow(availability, now).endsAt.getTime() - 1));
  const dayCount = Math.round((Date.parse(`${lastDate}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000) + 1;
  const evaluated = Array.from({ length: dayCount }, (_, offset) => directBookingDay(snapshot, addCairoDays(today, offset)));
  const all = evaluated.flatMap(day => day.slots).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const requestedDate = filter.date ?? (filter.fromTime || filter.toTime ? today : undefined);
  const selectedDate = requestedDate ?? (all[0] ? cairoDateString(new Date(all[0].startsAt)) : today);
  const selected = directBookingDay(snapshot, selectedDate, filter);
  // Prefer a time that fits the requested range. Otherwise offer the first appointment after it.
  const afterTime = filter.toTime ?? filter.fromTime;
  const nearest = selected.slots[0] ?? all.find(slot => !requestedDate || cairoDateString(new Date(slot.startsAt)) > requestedDate ||
    (cairoDateString(new Date(slot.startsAt)) === requestedDate && (!afterTime || slotMinute(slot.startsAt) >= minutes(afterTime))));
  return {
    published: availability.directBooking.published, timezone: "Africa/Cairo", now: now.toISOString(), slotDurationMinutes: availability.slotDurationMinutes,
    weeklyHours: (availability.directBooking.published ? availability.days : []).slice().sort((a, b) => a.weekday - b.weekday).map(d => ({ weekday: d.weekday,
      enabled: d.enabled && d.modes.includes("PHONE"), hours: d.enabled && d.modes.includes("PHONE") ? { start: d.start, end: d.end } : null })),
    days: evaluated.map(day => day.day), selectedDay: selected.day,
    window: { startsOn: today, endsOn: lastDate },
    slots: (requestedDate ? selected.slots.slice(0, 100) : all.slice(0, 3)).map(publicSlot),
    nearestSlot: nearest ? publicSlot(nearest) : null,
    suggestedSlots: nearest ? all.filter(slot => Date.parse(slot.startsAt) >= Date.parse(nearest.startsAt)).slice(0, 3).map(publicSlot) : [], hasAvailability: all.length > 0
  };
}
