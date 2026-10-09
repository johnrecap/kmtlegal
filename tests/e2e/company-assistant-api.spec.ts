import { expect, test } from "@playwright/test";

test("synthetic SQL HTTP consent, recovery and missing-provider gates", async ({ playwright, baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires the isolated memory-only fixture server.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
  const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });
  const endpoint = "/api/public/assistant/conversation";
  const post = (data: Record<string, unknown>) => api.post(endpoint, { data });
  try {
    expect((await post({ action: "begin_booking" })).status()).toBe(401);
    const start = await post({ action: "start", locale: "en", service: "company-formation" });
    expect(start.status()).toBe(200);
    expect((await start.json()).data.dialogue.mode).toBe("INQUIRY");
    expect((await post({ action: "verify", email: "blocked@synthetic.invalid", purpose: "ACTIVATE" })).status()).toBe(403);
    const help = await post({ action: "account_access" });
    expect((await help.json()).data.dialogue).toMatchObject({ mode: "INQUIRY", accountAccess: true, consentAt: null });
    const booking = await post({ action: "begin_booking" });
    expect((await booking.json()).data.dialogue.mode).toBe("BOOKING");
    const back = await post({ action: "return_inquiry" });
    expect(back.status()).toBe(200);
    expect((await back.json()).data.dialogue).toMatchObject({ mode: "INQUIRY", offerShown: true, consentAt: null });
    const unavailable = await post({ action: "message", locale: "en", messageId: crypto.randomUUID(), message: "What services does the office offer?" });
    expect(unavailable.status()).toBe(503);
    const restored = (await (await api.get(endpoint)).json()).data;
    expect(restored.dialogue.mode).toBe("INQUIRY");
    expect(restored.submitted).toBe(false);
    expect(restored.draft).toEqual({ service: "company-formation" });
    expect(restored.turns.at(-1).status).toBe("FAILED");
    const foreign = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: "https://foreign.invalid" } });
    try { expect((await foreign.post(endpoint, { data: { action: "start", locale: "en" } })).status()).toBe(403); }
    finally { await foreign.dispose(); }
  } finally { await api.dispose(); }
});
