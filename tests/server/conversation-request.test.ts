import { afterEach, describe, expect, it, vi } from "vitest";
import { conversationRequest } from "@/features/public-site/conversation-request";
import { fixtureBookingAvailability } from "../e2e/helpers/booking-availability";

const snapshot = { locale: "en", revision: 1, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
  dialogue: { mode: "INQUIRY", offerShown: false, consentAt: null, accountAccess: false }, turns: [] };
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("PLAN40 bounded conversation reader", () => {
  it("accepts real-shaped availability and booking snapshots without discarding compatible extra fields", async () => {
    const availability = fixtureBookingAvailability();
    const booked = { ...snapshot, draft: { followup: { selected: { id: "synthetic" } } }, booking: { confirmationSource: "PUBLISHED_SLOT", contactChannel: "PHONE", publicReference: "CONS-SYNTHETIC", fullName: "Synthetic Guest", phone: "01012345678", appointments: [{ id: "synthetic", startsAt: availability.slots[0].startsAt, endsAt: availability.slots[0].endsAt, status: "SCHEDULED", lawyer: null }] } };
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => Response.json({ data: JSON.parse(init.body).action === "booking_slots" ? availability : booked })));
    expect(await conversationRequest({ action: "booking_slots" })).toEqual(availability);
    expect(await conversationRequest({ action: "confirm_booking" })).toEqual(booked);
  });
  it.each([null, snapshot])("accepts compatible protected reads: %j", async saved => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: saved })));
    expect(await conversationRequest()).toEqual(saved);
  });
  it.each([401, 403, 409, 429, 502])("preserves HTTP %s and safe correlation without raw server prose", async status => {
    const requestId = "12345678-1234-4234-8234-123456789abc";
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: { code: "AI_PROVIDER_UNAVAILABLE", message: "PRIVATE PROVIDER OUTPUT", requestId } }, { status })));
    const failure = await conversationRequest({ action: "message", message: "synthetic" }).catch(error => error);
    expect(failure).toMatchObject({ kind: "HTTP", status, requestId, code: "AI_PROVIDER_UNAVAILABLE" });
    expect(JSON.stringify(failure) + failure.message).not.toContain("PRIVATE PROVIDER OUTPUT");
  });
  it("handles the production non-JSON502 without exposing an HTML/body error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>PRIVATE PROXY ERROR</html>", { status: 502 })));
    const failure = await conversationRequest({ action: "message" }).catch(error => error);
    expect(failure).toMatchObject({ kind: "HTTP", status: 502 });
    expect(failure.message + JSON.stringify(failure)).not.toContain("PRIVATE PROXY");
  });
  it.each([{}, { data: "invalid" }, { data: {} }, { data: { ...snapshot, turns: "invalid" } }])("rejects malformed success instead of clearing conversation: %j", async body => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(body)));
    await expect(conversationRequest()).rejects.toMatchObject({ kind: "INVALID_RESPONSE" });
  });
  it("drops unvalidated support references and codes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: { code: "private@example.invalid", requestId: "PRIVATE CONTENT" } }, { status: 500 })));
    const failure = await conversationRequest().catch(error => error);
    expect(failure.code).toBeUndefined(); expect(failure.requestId).toBeUndefined();
  });
  it.each([
    { body: { ...snapshot, booking: {} }, action: undefined },
    { body: { ...snapshot, staffMessages: "invalid" }, action: undefined },
    { body: { ...snapshot, draft: { fullName: 99 } }, action: undefined },
    { body: { slots: [{}], selectedDay: { date: "invalid", status: "AVAILABLE" } }, action: "booking_slots" }
  ])("rejects malformed nested data before it can replace a usable form: %j", async ({ body, action }) => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: body })));
    await expect(conversationRequest(action ? { action } : undefined)).rejects.toMatchObject({ kind: "INVALID_RESPONSE" });
  });
  it.each([["message", 75_000], ["booking_slots", 20_000]])("bounds %s without an automatic retry", async (action, budget) => {
    vi.useFakeTimers();
    const network = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", network);
    const pending = conversationRequest({ action });
    const failed = expect(pending).rejects.toMatchObject({ kind: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(budget);
    await failed;
    expect(network).toHaveBeenCalledTimes(1);
    expect((network.mock.calls[0] as unknown as [string, RequestInit])[1].signal?.aborted).toBe(true);
  });
  it("bounds a stalled body read and cancels its request", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream({ start() {} }))));
    const failure = expect(conversationRequest()).rejects.toMatchObject({ kind: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(20_000); await failure;
  });
  it("preserves network uncertainty without claiming saved data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("PRIVATE SOCKET ERROR"); }));
    const failure = await conversationRequest().catch(error => error);
    expect(failure).toMatchObject({ kind: "NETWORK" });
    expect(failure.message).not.toContain("PRIVATE SOCKET");
  });
});
