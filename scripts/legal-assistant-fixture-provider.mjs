// Local synthetic provider for browser QA only. No real model or web search is called.
import http from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
const counts = { requests: 0, research: 0, unsafeResearch: 0 };
const tool = (name, value) => ({ choices: [{ finish_reason: "tool_calls", message: { content: null, tool_calls: [{ id: randomUUID(), type: "function", function: { name, arguments: JSON.stringify(value) } }] } }] });
const checks = { inScope: true, grounded: true, noFalseCurrentLaw: true, factsAccurate: true, noExternalReferrals: true, noGuarantees: true, draftMarked: true, noFalseActionClaim: true };
await mkdir(".playwright/legal-assistant", { recursive: true });
const server = http.createServer(async (req, res) => {
  try {
    let raw = ""; for await (const chunk of req) { raw += chunk; if (raw.length > 131072) throw new Error("Oversized synthetic request"); }
    const body = JSON.parse(raw); counts.requests++;
    const name = body.tools?.[0]?.function?.name;
    let value;
    if (body.tools?.[0]?.type === "openrouter:web_search") {
      counts.research++;
      if (/PRIVATE_|synthetic\.invalid|010999|@/.test(JSON.stringify(body))) counts.unsafeResearch++;
      const english = /Official legislation/.test(body.messages.at(-1).content);
      value = { choices: [{ message: { annotations: [{ type: "url_citation", url_citation: { url: "https://elpai.idsc.gov.eg/", title: english ? "Official authority — synthetic QA excerpt" : "جهة رسمية — مقتطف اختبار مصطنع", content: "SYNTHETIC QA ONLY: tenancy assessment depends on contract type, date, premises and relevant facts. This fixture is not a verified statement of current law." } }] } }] };
    } else if (name === "classify_company_message") {
      const data = JSON.parse(body.messages.at(-1).content), message = data.message;
      // Existing signup QA deliberately verifies a provider outage after successful registration.
      if (message === "Synthetic service question") { res.writeHead(503); res.end("Synthetic outage"); return; }
      const english = !/[ء-ي]/.test(message), book = /احجز|book (?:a |with)/i.test(message);
      value = tool(name, { scope: book ? "OFFICE" : "LEGAL", intent: book ? "BOOK" : "NONE", evidence: book ? message : "", locale: english ? "en" : "ar", offerAppropriate: false, inScopeQuestion: message,
        legal: { topics: ["RENT"], mode: /مسودة|draft/i.test(message) ? "DRAFT" : "EXPLANATION" } });
    } else if (name === "compose_legal_reply") {
      const data = JSON.parse(body.messages.at(-1).content), english = data.language === "en";
      const draft = data.jurisdiction.mode === "DRAFT";
      value = tool(name, { answer: english ? draft ? "Tenancy draft: landlord [name], tenant [name], premises [description], term [agreed period]. This text depends on the supplied facts. [S1]" : "Start by identifying the contract type, date and premises. Keep a copy and clarify the dispute before choosing a step. The legal analysis depends on those facts. [S1]" : draft ? "مسودة عقد إيجار: الطرف الأول [الاسم]، الطرف الثاني [الاسم]، العين [الوصف]، والمدة [المدة المتفق عليها]. البنود تتوقف على الوقائع. [S1]" : "ابدأ بتحديد نوع العقد وتاريخه وطبيعة العين. احتفظ بنسخة العقد وحدد سبب النزاع قبل اختيار الخطوة المناسبة؛ التحليل القانوني يتوقف على هذه الوقائع. [S1]", sourceIds: ["S1"] });
    } else if (name === "review_legal_reply") value = tool(name, checks);
    else if (name === "review_company_reply") value = tool(name, { inScope: true, grounded: true, noPrematureContact: true, noBookingPressure: true, noFinalLegalAdvice: true, noFalseActionClaim: true });
    else value = { choices: [{ finish_reason: "stop", message: { content: /Initial language: en/.test(body.messages[0]?.content) ? "Continue using the secure booking form on this website." : "يمكنك استكمال الحجز من النموذج داخل الموقع." } }] };
    await writeFile(".playwright/legal-assistant/browser-provider-receipt.json", JSON.stringify({ syntheticOnly: true, ...counts }, null, 2));
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(value));
  } catch { res.writeHead(400); res.end("Synthetic fixture error"); }
});
server.listen(3118, "127.0.0.1", () => console.log("Synthetic legal browser provider ready at 127.0.0.1:3118; no external calls."));
process.on("SIGINT", () => server.close(() => process.exit(0)));
