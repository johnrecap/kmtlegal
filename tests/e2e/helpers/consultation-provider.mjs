// Loopback-only synthetic provider for real HTTP/UI tests; no environment secrets read.
import { createServer } from "node:http";
let calls = 0, reasoningDisabled = true;
const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url === "/stats") return response.end(JSON.stringify({ calls, reasoningDisabled }));
  if (request.method !== "POST" || request.url !== "/v1/chat/completions") { response.statusCode = 404; return response.end('{}'); }
  let text = ''; for await (const chunk of request) text += chunk;
  try {
    const input = JSON.parse(text); calls++; reasoningDisabled &&= input.reasoning?.enabled === false;
    const name = input.tools?.[0]?.function?.name;
    if (["classify_company_message", "review_company_reply"].includes(name)) {
      const data = JSON.parse(input.messages[1].content);
      const locale = /[\u0600-\u06ff]/.test(data.message) ? "ar" : "en";
      const result = name === "classify_company_message"
        ? { scope: "OFFICE", intent: "NONE", evidence: "", locale, offerAppropriate: false, inScopeQuestion: data.message }
        : { inScope: true, grounded: true, noPrematureContact: true, noBookingPressure: true, noFinalLegalAdvice: true, noFalseActionClaim: true };
      return response.end(JSON.stringify({ choices: [{ finish_reason: "tool_calls", message: { content: null, tool_calls: [{ id: name, type: "function", function: { name, arguments: JSON.stringify(result) } }] } }] }));
    }
    const user = input.messages.filter(message => message.role === "user").at(-1)?.content || '';
    const answer = /[\u0600-\u06ff]/.test(user) ? "يمكنني شرح خدمات المكتب، ومنها تأسيس الشركات ومراجعة العقود." : "I can explain office services, including company formation and contract review.";
    response.end(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: answer } }], usage: { completion_tokens: 20, prompt_tokens: 20, total_tokens: 40 } }));
  } catch { response.statusCode = 400; response.end('{}'); }
});
server.listen(55479, '127.0.0.1', () => console.log('Synthetic conversation provider on 127.0.0.1:55479; no external AI calls.'));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
