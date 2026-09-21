import { expect, test } from "@playwright/test";
import { getPublicContent } from "../../src/content/public-content";
for(const locale of ["en","ar"] as const){
 const contact={fullName:"Hala Samir",phone:"+201000009911",email:"hala@example.test",city:"Cairo",summary:"A supplier contract needs a document review meeting.",serviceCategory:"corporate-business-services",preferredMode:"ONLINE",urgency:"NORMAL",startsAt:""};
 test(`${locale}: restores unprocessed message on network and service failure`,async({page})=>{
  let stage=0;const requests:any[]=[];
  await page.route("**/api/public/consultations/assistant",async route=>{requests.push(route.request().postDataJSON());stage++;if(stage===2)return route.abort("failed");if(stage===3)return route.fulfill({status:503,json:{error:{code:"AI_PROVIDER_UNAVAILABLE"}}});return route.fulfill({json:{data:{message:"Review retained data",draft:contact}}});});
  await page.goto(locale==="ar"?"/ar/book-consultation":"/book-consultation");await page.getByTestId(`booking-language-${locale}`).click();
  const input=page.locator('input[name="chatMessage"]');const submit=page.getByTestId("booking-chat-composer").locator('button[type="submit"]');
  await input.fill("Book a consultation");await submit.click();await expect(input).toBeEnabled();
  const correction=locale==="ar"?"بريدي الجديد new@example.test":"My email is new@example.test";
  await input.fill(correction);await submit.click();await expect(input).toHaveValue(correction);await expect(input).toBeEnabled();
  await submit.click();await expect(input).toHaveValue(correction);await expect(input).toBeEnabled();
  await submit.click();await expect(input).toBeEnabled();expect(requests).toHaveLength(4);for(const r of requests.slice(1)){expect(r.draft.phone).toBe(contact.phone);expect(r.message).toBe(correction);}
 });
 test(`${locale}: public language navigation retains contact and unsent text without persisting a confirmation`,async({page})=>{
  let received:any;
  await page.route("**/api/public/consultations/assistant",async route=>{received=route.request().postDataJSON();return route.fulfill({json:{data:{message:"Review retained data",draft:contact}}});});
  await page.goto(locale==="ar"?"/ar/book-consultation":"/book-consultation");await page.getByTestId(`booking-language-${locale}`).click();
  const input=page.locator('input[name="chatMessage"]');const submit=page.getByTestId("booking-chat-composer").locator('button[type="submit"]');await input.fill("Book consultation");await submit.click();await expect(input).toBeEnabled();await input.fill("Unsent question");
  await page.getByTestId("public-language-switch").click();await expect(input).toHaveValue("Unsent question");await expect(input).toBeEnabled();await submit.click();await expect(input).toBeEnabled();expect(received.draft.phone).toBe(contact.phone);expect(received.draft.fullName).toBe(contact.fullName);expect(received.locale).toBe(locale==="ar"?"en":"ar");expect(received.confirmBooking).not.toBe(true);expect(received.selectedSlot).toBe("");
  expect(await page.evaluate(()=>sessionStorage.getItem("kmt.booking.language-transfer"))).toBeNull();
 });
}
test("expired or malformed language handoffs are discarded",async({page})=>{
 const valid={destination:"/book-consultation",flow:null,result:null,selectedSlot:"",freeMessage:"",draft:{fullName:"Example Client",phone:"+201000009911",preferredMode:"ONLINE",urgency:"NORMAL",availabilityPreference:{date:"",label:"",fromTime:"",toTime:"",timeWindow:""}}};
 await page.goto("/book-consultation");
 for(const payload of [{...valid,createdAt:Date.now()-360000},{...valid,createdAt:Date.now(),draft:{fullName:{bad:"object"}}}]){
  await page.evaluate(value=>sessionStorage.setItem("kmt.booking.language-transfer",JSON.stringify(value)),payload);
  await page.reload();await expect(page.getByTestId("booking-language-en")).toBeEnabled();expect(await page.evaluate(()=>sessionStorage.getItem("kmt.booking.language-transfer"))).toBeNull();
 }
});

test("blocked session storage keeps the current draft and prevents losing it through navigation",async({page})=>{
 await page.route("**/api/public/consultations/assistant",route=>route.fulfill({json:{data:{message:"Stored draft",draft:{fullName:"Hala Samir",phone:"+201000009911"}}}}));
 await page.goto("/book-consultation");await page.getByTestId("booking-language-en").click();const input=page.locator('input[name="chatMessage"]');await input.fill("Book");await page.getByTestId("booking-chat-composer").locator('button[type="submit"]').click();await expect(input).toBeEnabled();await input.fill("Still here");
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException("Blocked","SecurityError")}});await page.getByTestId("public-language-switch").click();await expect(page).toHaveURL(/\/book-consultation$/);await expect(input).toHaveValue("Still here");await expect(page.getByTestId("booking-chat-log")).toContainText(getPublicContent("en").bookingChat.fallbackError);
});
for(const locale of ["en","ar"] as const){
 const path=locale==="ar"?"/ar/book-consultation":"/book-consultation";const other=locale==="ar"?"en":"ar";
 test(`${locale}: language retains reviewed slot and completed booking reference without auto-booking`,async({page})=>{
  const requests:any[]=[];const draft={fullName:"Hala Samir",phone:"+201000009911",summary:"A supplier contract needs a scheduled review.",serviceCategory:"corporate-business-services",preferredMode:"ONLINE",urgency:"NORMAL",startsAt:"2099-09-20T10:00:00.000Z"};
  await page.route("**/api/public/consultations/assistant",route=>{const body=route.request().postDataJSON();requests.push(body);return route.fulfill({json:{data:body.confirmBooking?{reference:"CONS-1234ABCD",appointment:{title:"Consultation fixture",startsAt:draft.startsAt,status:"SCHEDULED"}}:{message:"Current review",draft,readyToConfirm:true}}});});
  await page.goto(path);await page.getByTestId(`booking-language-${locale}`).click();await page.locator('input[name="chatMessage"]').fill("Arrange consultation");await page.getByTestId("booking-chat-composer").locator('button[type="submit"]').click();await expect(page.getByTestId("booking-confirm-booking")).toBeVisible();
  await page.getByTestId("public-language-switch").click();await expect.poll(()=>requests.length).toBe(2);expect(requests[1].selectedSlot).toBe(draft.startsAt);expect(requests[1].confirmBooking).not.toBe(true);expect(requests[1].locale).toBe(other);await expect(page.getByTestId("booking-confirm-booking")).toBeVisible();
  await page.getByTestId("booking-confirm-booking").click();await expect(page.getByTestId("booking-chat-log")).toContainText("CONS-1234ABCD");await expect(page.locator('input[name="chatMessage"]')).toBeEnabled();expect(requests).toHaveLength(3);
  await page.getByTestId("public-language-switch").click();await expect(page.getByTestId("booking-chat-log")).toContainText("CONS-1234ABCD");await expect(page.getByTestId("booking-confirm-booking")).toHaveCount(0);expect(requests).toHaveLength(3);
 });
 test(`${locale}: language preserves inquiry and blocks oversized unsent transfer`,async({page})=>{
  await page.goto(path);await page.getByTestId(`booking-language-${locale}`).click();await page.getByTestId("booking-quick-inquiry").click();const input=page.locator('input[name="chatMessage"]');await input.fill("My pending question");await page.getByTestId("public-language-switch").click();await expect(page.getByTestId("booking-chat-log")).toContainText(getPublicContent(other).bookingChat.inquiryPrompt);await expect(input).toHaveValue("My pending question");
  const long="x".repeat(20001);await input.fill(long);const before=page.url();await page.getByTestId("public-language-switch").click();await expect(page).toHaveURL(before);await expect(input).toHaveValue(long);expect(await page.evaluate(()=>sessionStorage.getItem("kmt.booking.language-transfer"))).toBeNull();
 });
}
test("oversized language transfer stays on the current page with its complete unsent text",async({page})=>{
 await page.goto("/book-consultation");await page.getByTestId("booking-language-en").click();const input=page.locator('input[name="chatMessage"]');const long="x".repeat(20001);await input.fill(long);const before=page.url();await page.getByTestId("public-language-switch").click();await expect(page).toHaveURL(before);await expect(input).toHaveValue(long);await expect(page.getByTestId("booking-chat-log")).toContainText(getPublicContent("en").bookingChat.languageTransferTooLarge);expect(await page.evaluate(()=>sessionStorage.getItem("kmt.booking.language-transfer"))).toBeNull();
 const shorter="x".repeat(19000);await input.fill(shorter);await page.getByTestId("public-language-switch").click();await expect(page).toHaveURL(/\/ar\/book-consultation$/);await expect(input).toHaveValue(shorter);
});

for (const locale of ["en", "ar"] as const) {
  const path = locale === "ar" ? "/ar/book-consultation" : "/book-consultation";
  const contact = { fullName: "Hala Samir", phone: "+201000009911", serviceCategory: "corporate-business-services", preferredMode: "ONLINE", urgency: "NORMAL", startsAt: "" };

  test(`${locale}: keeps a selected category after a failed request`, async ({ page }) => {
    const requests: Array<Record<string, any>> = [];
    await page.route("**/api/analytics/events", (route) => route.fulfill({ status: 202, body: "" }));
    await page.route("**/api/public/consultations/assistant", async (route) => {
      const request = route.request().postDataJSON() as Record<string, any>;
      requests.push(request);
      if (requests.length === 1) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { message: "Try again" } }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { message: "Name recorded", draft: { ...contact, serviceCategory: request.draft.serviceCategory }, intake: { status: "understood", progressed: true, nextField: "phone" } } })
      });
    });

    await page.goto(path);
    await page.getByTestId(`booking-language-${locale}`).click();
    await page.getByTestId("booking-quick-book").click();
    await page.getByTestId("booking-matter-chip").nth(1).click();
    await expect(page.locator('input[name="chatMessage"]')).toBeEnabled();
    await page.locator('input[name="chatMessage"]').fill("Hala Samir");
    await page.getByTestId("booking-chat-composer").locator('button[type="submit"]').click();
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[0]).toMatchObject({ event: "select_category", draft: { serviceCategory: "corporate-business-services" } });
    expect(requests[1]).toMatchObject({ event: "message", draft: { serviceCategory: "corporate-business-services" }, message: "Hala Samir" });
  });

  test(`${locale}: offers one contact link for an HTTP 200 degraded loop and resets after progress`, async ({ page }) => {
    let stage = 0;
    await page.route("**/api/analytics/events", (route) => route.fulfill({ status: 202, body: "" }));
    await page.route("**/api/public/consultations/assistant", async (route) => {
      stage += 1;
      const degraded = stage === 1 || stage === 2 || stage === 4;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: degraded
            ? { message: "Please clarify", draft: contact, intake: { status: "needs_clarification", progressed: false, nextField: "fullName" } }
            : { message: "Name understood", draft: contact, intake: { status: "understood", progressed: true, nextField: "phone" } }
        })
      });
    });

    await page.goto(path);
    await page.getByTestId(`booking-language-${locale}`).click();
    const input = page.locator('input[name="chatMessage"]');
    const submit = page.getByTestId("booking-chat-composer").locator('button[type="submit"]');
    await input.fill("First detail"); await submit.click(); await expect(input).toBeEnabled();
    await input.fill("Second detail"); await submit.click(); await expect(input).toBeEnabled();
    const contactLink = page.getByRole("link", { name: getPublicContent(locale).bookingChat.whatsappFallbackLabel });
    await expect(contactLink).toHaveCount(1);
    await input.fill("Hala Samir"); await submit.click(); await expect(input).toBeEnabled();
    await input.fill("Still clarifying"); await submit.click(); await expect(input).toBeEnabled();
    await expect(contactLink).toHaveCount(1);
  });

  test(`${locale}: sends an explicit category choice after a server suggestion`, async ({ page }) => {
    const requests: Array<Record<string, any>> = [];
    await page.route("**/api/analytics/events", (route) => route.fulfill({ status: 202, body: "" }));
    await page.route("**/api/public/consultations/assistant", async (route) => {
      const request = route.request().postDataJSON() as Record<string, any>;
      requests.push(request);
      const followUp = requests.length > 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            message: followUp ? "Category updated" : "This may fit another area",
            draft: followUp
              ? { ...request.draft, serviceCategory: "corporate-business-services" }
              : { summary: request.message, serviceCategory: "legal-consultation", startsAt: "2099-10-01T09:00:00.000Z" },
            readyToConfirm: !followUp,
            intake: { status: "understood", progressed: true, nextField: "fullName" },
            ...(followUp ? {} : { categorySuggestion: { current: "legal-consultation", suggested: "corporate-business-services" } })
          }
        })
      });
    });

    await page.goto(path);
    await page.getByTestId(`booking-language-${locale}`).click();
    const input = page.locator('input[name="chatMessage"]');
    await input.fill(locale === "ar" ? "أحتاج مراجعة عقد شراكة." : "I need a partnership contract reviewed.");
    await page.getByTestId("booking-chat-composer").locator('button[type="submit"]').click();
    const suggestion = page.getByTestId("booking-category-suggestion");
    await expect(suggestion).toBeVisible();
    await suggestion.getByRole("button", { name: new RegExp(getPublicContent(locale).bookingChat.useSuggestedCategory) }).click();
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1]).toMatchObject({
      event: "select_category",
      selectedSlot: "",
      draft: { serviceCategory: "corporate-business-services", summary: requests[0].message, startsAt: "" }
    });
    await expect(suggestion).toHaveCount(0);
  });
  test(`${locale}: carries a description into a later plain-name turn`, async ({ page }) => {
    const requests: Array<Record<string, any>> = [];
    await page.route("**/api/analytics/events", (route) => route.fulfill({ status: 202, body: "" }));
    await page.route("**/api/public/consultations/assistant", async (route) => {
      const request = route.request().postDataJSON() as Record<string, any>;
      requests.push(request);
      const first = requests.length === 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            message: first ? "Please add your name" : "Name recorded",
            draft: first ? { summary: request.message, serviceCategory: "legal-consultation" } : { summary: request.draft.summary, fullName: request.message, serviceCategory: "legal-consultation" },
            intake: { status: "understood", progressed: true, nextField: first ? "fullName" : "phone" }
          }
        })
      });
    });

    await page.goto(path);
    await page.getByTestId(`booking-language-${locale}`).click();
    const input = page.locator('input[name="chatMessage"]');
    const submit = page.getByTestId("booking-chat-composer").locator('button[type="submit"]');
    const description = locale === "ar" ? "أحتاج مراجعة عقد توريد قبل التوقيع الأسبوع القادم." : "I need a supplier contract reviewed before signing next week.";
    await input.fill(description); await submit.click(); await expect(input).toBeEnabled();
    await input.fill("Hala Samir"); await submit.click();
    await expect.poll(() => requests.length).toBe(2);
    expect(requests[1]).toMatchObject({ message: "Hala Samir", draft: { summary: description } });
  });
}