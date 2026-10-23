import { afterEach, expect, it, vi } from "vitest";
import { composeLegalAssistance } from "@/server/ai/legal-assistance-service";
import { legalContextSchema } from "@/server/ai/legal-assistance-contract";
import { getAIProvider } from "@/server/ai/provider-registry";

afterEach(() => vi.unstubAllGlobals());
const checks = { inScope: true, grounded: true, noFalseCurrentLaw: true, factsAccurate: true, noExternalReferrals: true, noGuarantees: true, draftMarked: true, noFalseActionClaim: true };
const answer = "ذكرت أن إيصال الأمانة على بياض. يلزم توضيح الوقائع قبل تقييمه: هل تسلّم الموقّع مالًا فعلًا؟";
function setup(reject: boolean) {
  let reviewed = false;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    const name = body.tools[0].function.name;
    const result = name === "review_legal_reply" ? { ...checks, grounded: !reject && reviewed, corrections: ["Do not presume the customer signed the receipt."] } : { answer, sourceIds: [] };
    if (name === "review_legal_reply") reviewed = true;
    return Response.json({ choices: [{ finish_reason: "tool_calls", message: { content: null, tool_calls: [{ id: crypto.randomUUID(), type: "function", function: { name, arguments: JSON.stringify(result) } }] } }] });
  }));
  return { provider: getAIProvider({ provider: "openai-compatible", model: "synthetic", baseUrl: "https://synthetic.invalid", apiKey: "synthetic", timeoutMs: 1000, maxTokens: 1200, temperature: 0 }), context: legalContextSchema.parse({}), locale: "ar" as const, message: "معايا إيصال أمانة على بياض وعايز أرفع قضية بيه", requestId: crypto.randomUUID(), history: [], knowledge: {}, showJurisdiction: true };
}
it("repairs a rejected receipt answer and returns only the reviewed response (2026-10-23 incident)", async () => {
  const result = await composeLegalAssistance(setup(false));
  expect(result.accepted).toBe(true);
  expect(result.text).toContain(answer);
  expect(result.text).not.toContain("ما أهم واقعة");
  const requests = vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
  const repaired = requests.filter(body => body.tools[0].function.name === "compose_legal_reply")[1];
  expect(JSON.stringify(repaired.messages)).toContain("Do not presume the customer signed the receipt.");
  expect(result.text).not.toContain("Do not presume");
});
it("keeps repeated review failure retryable instead of blaming missing customer details", async () => {
  await expect(composeLegalAssistance(setup(true))).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
});
