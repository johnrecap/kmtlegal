import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AssistantMessageBody, assistantDisplayLines } from "@/features/public-site/assistant-message-body";
import { legalAssistantCopy } from "@/content/legal-assistant-copy";

const render = (body: string, locale: "ar" | "en" = "ar") => renderToStaticMarkup(<AssistantMessageBody body={body} draftLabel={legalAssistantCopy[locale].draft} />);
describe("assistant display preserves content with safe structured formatting", () => {
  it("repairs the actual escaped Arabic facts list and bold headings", () => {
    const html = render("**الوقائع:**\\n- شريكك سلّم المبلغ.\\n- الطرف الآخر استلمه.");
    expect(html).toContain("<strong>الوقائع:</strong>");
    expect(html).toContain('<ul dir="auto"><li>شريكك سلّم المبلغ.</li><li>الطرف الآخر استلمه.</li></ul>');
    expect(html).not.toContain("\\n"); expect(html).not.toContain("**");
  });
  it("retains English placeholders and explicit ordered item numbers", () => {
    const html = render("## Payment\n3. Pay **[AMOUNT]** via [METHOD].\n5. Due [DATE].", "en");
    expect(html).toContain("<strong>Payment</strong>");
    expect(html).toContain('<li value="3">Pay <strong>[AMOUNT]</strong> via [METHOD].</li>');
    expect(html).toContain('<li value="5">Due [DATE].</li>');
  });
  it("collapses only identical standalone preliminary labels", () => {
    const label = legalAssistantCopy.en.draft;
    expect(assistantDisplayLines(`${label}\n\n**${label}**\nPayment\nPayment`, label).filter(x => x === label)).toHaveLength(1);
    expect(render(`${label}\nPayment\nPayment`, "en").match(/>Payment</g)).toHaveLength(2);
  });
  it("escapes untrusted HTML and never creates model-supplied links/images", () => {
    const html = render('<script>alert(1)</script>\n[click](javascript:alert(1))\n![x](https://example.test/track)');
    expect(html).toContain("&lt;script&gt;"); expect(html).not.toMatch(/<(script|a |img)/);
  });
  it("keeps one preliminary marker while preserving the clause heading", () => {
    expect(render(`${legalAssistantCopy.en.draft}\n\n**Payment (preliminary)**\nPay [AMOUNT].`, "en")).toContain("<strong>Payment</strong>");
    expect(render("**Payment (preliminary)**\nPay [AMOUNT].", "en")).toContain("<strong>Payment (preliminary)</strong>");
    expect(render(`${legalAssistantCopy.en.draft}\n\n**Payment (preliminary)**\nPay [AMOUNT].`, "ar")).toContain("<strong>Payment</strong>");
  });
  it("keeps paths and inline/fenced literal escapes intact", () => {
    const body = 'C:\\notes\\new\\report.txt\n`literal\\n- code`\n```text\na\\n- b\n```';
    const html = render(body);
    expect(html).toContain('C:\\notes\\new\\report.txt');
    expect(html).toContain('<code>literal\\n- code</code>');
    expect(html).toContain('<code>a\\n- b</code>');
  });
});
