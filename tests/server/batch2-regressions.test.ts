import { describe, expect, it } from "vitest";
import { logoutByRequest } from "@/server/auth/auth-service";
import { defaultConsultationAvailability, generateConsultationSlots } from "@/server/consultations/consultation-availability-service";

describe("batch 2 source-confirmed regressions", () => {
  it("lets a malformed-cookie logout finish without touching a database", async () => {
    await expect(logoutByRequest(new Request("http://localhost/api/auth/logout", { headers: { cookie: "kmt_session=%FF" } }))).resolves.toBeUndefined();
  });

  it.each([
    ["2026-01-12", "2026-01-12T08:00:00.000Z"],
    ["2026-07-13", "2026-07-13T07:00:00.000Z"]
  ])("offers 10:00 Cairo at the correct instant on %s", (date, expected) => {
    const slots = generateConsultationSlots({ availability: { ...defaultConsultationAvailability, minLeadHours: 0 }, appointments: [], now: new Date(`${date}T00:00:00Z`), date, limit: 1 });
    expect(slots[0].startsAt).toBe(expected);
    expect(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit" }).format(new Date(slots[0].startsAt))).toBe("10:00");
  });

  it("skips the nonexistent Cairo spring-forward hour rather than shifting it", () => {
    const availability = { ...defaultConsultationAvailability, minLeadHours: 0, days: defaultConsultationAvailability.days.map(day => ({ ...day, enabled: true, start: "00:00", end: "03:00" })) };
    const slots = generateConsultationSlots({ availability, appointments: [], now: new Date("2026-04-23T18:00:00Z"), date: "2026-04-24", limit: 5 });
    const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit" });
    expect(slots.map(slot => clock.format(new Date(slot.startsAt)))).toEqual(["01:00", "02:00"]);
  });

  it("offers the first repeated fall-back hour once with real duration, lead time and conflicts", () => {
    const availability = { ...defaultConsultationAvailability, minLeadHours: 0, days: defaultConsultationAvailability.days.map(day => ({ ...day, enabled: true, start: "22:00", end: "24:00" })) };
    const input = { availability, appointments: [], now: new Date("2026-10-29T18:00:00Z"), date: "2026-10-29", limit: 5 };
    const slots = generateConsultationSlots(input);
    expect(slots.map(slot => slot.startsAt)).toEqual(["2026-10-29T19:00:00.000Z", "2026-10-29T20:00:00.000Z"]);
    const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit" });
    expect(slots.map(slot => clock.format(new Date(slot.startsAt)))).toEqual(["22:00", "23:00"]);
    expect(new Set(slots.map(slot => slot.id)).size).toBe(slots.length);
    for (const slot of slots) expect(Date.parse(slot.endsAt) - Date.parse(slot.startsAt)).toBe(60 * 60_000);
    expect(generateConsultationSlots({ ...input, availability: { ...availability, minLeadHours: 1 }, now: new Date("2026-10-29T19:30:00Z") })).toEqual([]);
    expect(generateConsultationSlots({ ...input, appointments: [{ startsAt: new Date("2026-10-29T20:15:00Z"), endsAt: new Date("2026-10-29T20:45:00Z") }] }).map(slot => slot.id)).toEqual([slots[0].id]);
  });
});
