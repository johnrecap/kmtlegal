import { expect, test, type APIRequestContext } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { randomUUID, createHmac } from "node:crypto";
import path from "node:path";
import { prisma } from "../../src/server/db/prisma";
import { defaultConsultationAvailability } from "../../src/server/consultations/consultation-availability-service";
import { paymentReviewCopy } from "../../src/lib/ui-copy";
import { getPublicContent } from "../../src/content/public-content";
import { getClientContent } from "../../src/content/client-content";

let server: Server;
let mode: "ok" | "malformed" | "timeout" = "ok";
let serial = Date.now()*100;
let calls=0;
let day=20;
const attempts: Array<{order:number;attemptId:string;expiration:number}> = [];
const origin="http://127.0.0.1:3109";
const post=(request:APIRequestContext,url:string,data:unknown)=>request.post(url,{headers:{Origin:origin},data});
async function review(request:APIRequestContext) {
  const date=new Date(Date.now()+(++day)*86400000).toISOString().slice(0,10);
  const slots=await request.get(`/api/public/consultations/slots?date=${date}&limit=2`);
  expect(slots.status()).toBe(200);const selectedSlot=(await slots.json()).data.slots[0].startsAt;
  const draft={fullName:"Synthetic HTTP Payment Client",phone:`+201${String(++serial).slice(-9)}`,email:`${randomUUID()}@example.test`,city:"Cairo",serviceCategory:"corporate-business-services",summary:"A synthetic supplier contract review consultation.",preferredMode:"ONLINE",urgency:"NORMAL"};
  const result=await post(request,"/api/public/consultations/assistant",{locale:"en",message:"Confirm",draft,selectedSlot,consent:true,confirmBooking:true});
  expect(result.status(),await result.text()).toBe(200);const data=(await result.json()).data;expect(data.readyToCheckout,JSON.stringify(data)).toBe(true);
  return {locale:"en",message:"Pay",draft,selectedSlot,consent:true,confirmPayment:true,expectedPrice:data.paymentReview};
}
async function checkout(request:APIRequestContext) {
  const body=await review(request);const response=await post(request,"/api/public/consultations/checkout",body);
  expect(response.status()).toBe(201);const data=(await response.json()).data;
  const attempt=await prisma.paymentAttempt.findUniqueOrThrow({where:{id:data.paymentAttempt.id}});
  expect(attempt.providerOrderId).toBeTruthy();const providerCall=attempts.find(row=>row.attemptId===attempt.id)!;expect(providerCall.expiration).toBeGreaterThan(0);expect(providerCall.expiration).toBeLessThanOrEqual(900);return {body,data,attempt};
}
function event(attempt:{id:string;providerOrderId:string|null;amount: {toString():string};currency:string},success=true){
  return {type:"TRANSACTION",attemptId:attempt.id,obj:{amount_cents:Math.round(Number(attempt.amount.toString())*100),created_at:"2026-09-12T10:00:00Z",currency:attempt.currency,error_occured:false,has_parent_transaction:false,id:++serial,integration_id:1,is_3d_secure:true,is_auth:false,is_capture:false,is_refunded:false,is_standalone_payment:true,is_voided:false,order:{id:Number(attempt.providerOrderId),merchant_order_id:attempt.id},owner:1,pending:false,source_data:{pan:"1234",sub_type:"MasterCard",type:"card"},success}};
}
type Event=ReturnType<typeof event>;
function signature(body:Event){const o=body.obj;return createHmac("sha512",process.env.PAYMOB_HMAC_SECRET!).update([o.amount_cents,o.created_at,o.currency,o.error_occured,o.has_parent_transaction,o.id,o.integration_id,o.is_3d_secure,o.is_auth,o.is_capture,o.is_refunded,o.is_standalone_payment,o.is_voided,o.order.id,o.owner,o.pending,o.source_data.pan,o.source_data.sub_type,o.source_data.type,o.success].map(String).join("")).digest("hex");}
const deliver=(request:APIRequestContext,body:Event,hmac=signature(body))=>request.post(`/api/webhooks/paymob?hmac=${hmac}`,{data:body});

test.describe("batch6 isolated HTTP payments",()=>{
  test.beforeEach(async()=>{await prisma.rateLimitCounter.deleteMany();});
  test.skip(process.env.BATCH6_ISOLATED_DB!=="true","Disposable batch6 only");
  test.beforeAll(async()=>{
    const url=new URL(process.env.DATABASE_URL||"");expect([url.hostname,url.port,url.pathname,process.env.APP_ENV,process.env.PAYMOB_API_BASE_URL]).toEqual(["127.0.0.1","55437","/kmt_batch6","local","http://127.0.0.1:3110"]);
    const rows=await prisma.$queryRaw<Array<{directory:string;port:number}>>`SELECT current_setting('data_directory') AS directory,inet_server_port() AS port`;
    expect(path.resolve(rows[0].directory)).toBe(path.resolve("_workspace/batch6-postgres/data"));expect(rows[0].port).toBe(55437);
    await prisma.systemSetting.upsert({where:{key:"consultation.booking"},create:{key:"consultation.booking",value:{mode:"AI_CHAT_PAID"}},update:{value:{mode:"AI_CHAT_PAID"}}});
    await prisma.systemSetting.upsert({where:{key:"payment.gateway"},create:{key:"payment.gateway",value:{activeProvider:"paymob"}},update:{value:{activeProvider:"paymob"}}});
    await prisma.consultationPricingRule.create({data:{serviceCategory:"corporate-business-services",mode:"ONLINE",amount:750,currency:"EGP",version:1,active:true,label:"Synthetic local test price"}});
    const value={...defaultConsultationAvailability,minLeadHours:0,slotDurationMinutes:15,bookingWindowDays:60,days:defaultConsultationAvailability.days.map(d=>({...d,enabled:true,start:"00:00",end:"24:00"}))};
    await prisma.systemSetting.upsert({where:{key:"consultation.availability"},create:{key:"consultation.availability",value},update:{value}});
    server=createServer(async(req,res)=>{
      if(req.url!=="/v1/intention/"){res.writeHead(404).end();return;}
      let raw="";for await(const chunk of req)raw+=chunk;
      const body=JSON.parse(raw);calls++;const order=++serial;attempts.push({order,attemptId:body.extras.attemptId,expiration:body.expiration});
      const send=()=>{res.setHeader("Content-Type","application/json");res.writeHead(201).end(JSON.stringify(mode==="malformed"?{id:`fixture-${order}`}:{id:`fixture-${order}`,intention_order_id:order,checkout_url:body.redirection_url,client_secret:"synthetic"}));};
      if(mode==="timeout")setTimeout(send,3500);else send();
    });await new Promise<void>((resolve,reject)=>{server.once("error",reject);server.listen(3110,"127.0.0.1",resolve);});
  });
  test.afterAll(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));await prisma.$disconnect();});
  test("return success is not payment; canonical tampering is rejected and legitimate payment produces a receipt",async({page,request})=>{
    test.setTimeout(240000);
    const a=await checkout(request),b=await checkout(request),body=event(a.attempt),hmac=signature(body);
    await page.goto(`${a.attempt.checkoutUrl}&success=true&status=paid`);expect((await prisma.paymentAttempt.findUniqueOrThrow({where:{id:a.attempt.id}})).status).toBe("PENDING");
    expect((await deliver(request,{...body,attemptId:b.attempt.id},hmac)).status()).toBe(409);
    expect(await prisma.payment.count({where:{paymentAttemptId:b.attempt.id}})).toBe(0);
    expect((await deliver(request,body,hmac)).status()).toBe(200);
    const row=await prisma.paymentAttempt.findUniqueOrThrow({where:{id:a.attempt.id},include:{payment:true,appointment:true}});
    expect([row.status,row.appointment.status,row.payment!.status]).toEqual(["PAID","SCHEDULED","PAID"]);
    await page.reload();await expect(page.locator("body")).toContainText(row.payment!.invoiceNumber);
    const receipt=page.locator('a[href*="/payment/consultation/receipt"]');await expect(receipt).toHaveCount(1);await receipt.click();await expect(page.locator("body")).toContainText(row.payment!.invoiceNumber);
    const owner=await prisma.user.findUniqueOrThrow({where:{email:"client@kmt.local"}});await prisma.client.update({where:{id:a.attempt.clientId},data:{user:{create:{name:"Synthetic Payment Client",email:a.body.draft.email,passwordHash:owner.passwordHash,roleId:owner.roleId,status:"ACTIVE",locale:"en"}}}});
    expect((await post(page.request,"/api/auth/login",{email:a.body.draft.email,password:"KmtLocalDev!2026"})).status()).toBe(200);
    await page.goto("/client/payments");await expect(page.locator("body")).toContainText(row.payment!.invoiceNumber);
    expect((await post(page.request,"/api/auth/login",{email:"office.admin@kmt.local",password:"KmtLocalDev!2026"})).status()).toBe(200);
    await page.goto(`/admin/finance?q=${row.payment!.invoiceNumber}`);await expect(page.locator("body")).toContainText(row.payment!.invoiceNumber);
    body.obj.is_refunded=true;expect((await deliver(request,body)).status()).toBe(200);
    await page.reload();const adminRow=page.getByRole("row").filter({hasText:row.payment!.invoiceNumber});await expect(adminRow).toContainText(paymentReviewCopy.ar.review);
    await page.goto("/admin/reports");await expect(page.locator("body")).toContainText(paymentReviewCopy.ar.totals);
    expect((await post(page.request,"/api/auth/login",{email:a.body.draft.email,password:"KmtLocalDev!2026"})).status()).toBe(200);
    await page.goto("/client/payments");const clientRow=page.getByRole("row").filter({hasText:row.payment!.invoiceNumber});await expect(clientRow).toContainText(paymentReviewCopy.en.review);await expect(clientRow.locator('a[href*="/payment/consultation/receipt"]')).toHaveCount(0);
    await page.setViewportSize({width:390,height:844});const badge=page.getByText(paymentReviewCopy.en.review,{exact:true}).filter({visible:true}).first();await expect(badge).toHaveClass(/text-kmt-danger/);
    await page.screenshot({path:"_workspace/batch6-review/client-review-390.png",fullPage:true});
    expect((await post(page.request,"/api/auth/login",{email:"office.admin@kmt.local",password:"KmtLocalDev!2026"})).status()).toBe(200);await page.goto(`/admin/finance?q=${row.payment!.invoiceNumber}`);
    await expect(page.getByText(paymentReviewCopy.ar.review,{exact:true}).filter({visible:true}).first()).toHaveClass(/text-kmt-danger/);await page.getByText(paymentReviewCopy.ar.review,{exact:true}).filter({visible:true}).first().scrollIntoViewIfNeeded();await page.screenshot({path:"_workspace/batch6-review/admin-review-390-viewport.png"});
  });
  test("unsigned paid status remains pending over HTTP and then accepts signed capture",async({request})=>{
    const a=await checkout(request),body=event(a.attempt,false);body.obj.pending=true;const hmac=signature(body);
    expect((await deliver(request,{...body,obj:{...body.obj,status:"paid"}} as Event,hmac)).status()).toBe(200);
    expect(await prisma.payment.count({where:{paymentAttemptId:a.attempt.id}})).toBe(0);
    body.obj.pending=false;body.obj.success=true;expect((await deliver(request,body)).status()).toBe(200);
    expect(await prisma.payment.count({where:{paymentAttemptId:a.attempt.id}})).toBe(1);
  });
  test("late trusted collection keeps actual money for review without another payment invitation",async({request,page})=>{
    test.setTimeout(120000);
    const a=await checkout(request);await prisma.paymentAttempt.update({where:{id:a.attempt.id},data:{expiresAt:new Date(Date.now()-1000)}});
    const body=event(a.attempt);expect((await deliver(request,body)).status()).toBe(200);
    const row=await prisma.paymentAttempt.findUniqueOrThrow({where:{id:a.attempt.id},include:{transactions:true,appointment:true,payment:true}});
    expect([row.status,row.appointment.status,row.failureCode,row.transactions[0].status]).toEqual(["EXPIRED","CANCELLED","PAYMENT_COLLECTION_REVIEW_REQUIRED","PAID"]);expect(row.payment).toBeNull();expect(row.transactions[0].amount.toString()).toBe("750");
    await page.goto(a.attempt.checkoutUrl!);await expect(page.getByRole("heading",{level:1})).toHaveText(paymentReviewCopy.en.review);
    const section=page.locator("section").filter({has:page.getByRole("heading",{level:1})});const copy=getPublicContent("en").paymentReturn;
    await expect(section.getByRole("link",{name:copy.actions.newBooking,exact:true})).toHaveCount(0);await expect(section.getByRole("link",{name:copy.actions.pay,exact:true})).toHaveCount(0);
    await expect(section.locator('a[href*="resumeAttemptId="]')).toHaveCount(0);await expect(section).toContainText(paymentReviewCopy.en.description);
    const unpaid=await checkout(request);await prisma.paymentAttempt.update({where:{id:unpaid.attempt.id},data:{expiresAt:new Date(Date.now()-1000)}});await page.goto(unpaid.attempt.checkoutUrl!);
    await expect(section.getByRole("link",{name:copy.actions.newBooking,exact:true})).toHaveCount(1);await expect(section.locator('a[href*="resumeAttemptId="]')).toHaveCount(1);
  });
  test("legacy checkout is held for order verification in public and client views until trusted binding",async({request,page})=>{
    test.setTimeout(150000);const a=await checkout(request);
    await prisma.paymentAttempt.update({where:{id:a.attempt.id},data:{providerOrderId:null}});await page.goto(a.attempt.checkoutUrl!);
    await expect(page.getByRole("heading",{level:1})).toHaveText(paymentReviewCopy.en.orderVerification);
    const section=page.locator("section").filter({has:page.getByRole("heading",{level:1})});const copy=getPublicContent("en").paymentReturn;
    await expect(section.getByRole("link",{name:copy.actions.pay,exact:true})).toHaveCount(0);await expect(section.getByRole("link",{name:copy.actions.newBooking,exact:true})).toHaveCount(0);
    const owner=await prisma.user.findUniqueOrThrow({where:{email:"client@kmt.local"}});await prisma.client.update({where:{id:a.attempt.clientId},data:{user:{create:{name:"Synthetic Legacy Client",email:a.body.draft.email,passwordHash:owner.passwordHash,roleId:owner.roleId,status:"ACTIVE",locale:"en"}}}});
    await post(page.request,"/api/auth/login",{email:a.body.draft.email,password:"KmtLocalDev!2026"});await page.goto("/client/payments");await expect(page.getByText(paymentReviewCopy.en.orderVerification,{exact:true})).toBeVisible();await expect(page.getByRole("link",{name:getClientContent("en").payments.continuePayment,exact:true})).toHaveCount(0);
    for (const locale of ["en", "ar"] as const) {
      await prisma.user.update({where:{email:a.body.draft.email},data:{locale}});
      await page.goto("/client/payments");await page.setViewportSize({width:390,height:844});
      const follow=page.getByRole("link",{name:getClientContent(locale).payments.followStatus,exact:true});
      await follow.scrollIntoViewIfNeeded();await expect(follow).toBeVisible();
      await page.screenshot({path:`_workspace/batch6-review/client-status-${locale}-390.png`});
      if (locale === "en") { await follow.focus();await expect(follow).toBeFocused();await page.keyboard.press("Enter"); }
      else { await follow.click(); }
      await expect(page).toHaveURL(new RegExp(`/payment/consultation/return\\?attemptId=${a.attempt.id}`));
      await expect(page.getByRole("heading",{level:1})).toHaveText(new RegExp(`${paymentReviewCopy.en.orderVerification}|${paymentReviewCopy.ar.orderVerification}`));
    }
    await prisma.user.update({where:{email:a.body.draft.email},data:{locale:"en"}});
    await prisma.paymentAttempt.update({where:{id:a.attempt.id},data:{providerOrderId:a.attempt.providerOrderId}});await page.goto("/client/payments");await expect(page.getByRole("link",{name:getClientContent("en").payments.continuePayment,exact:true})).toHaveCount(1);
    await page.goto(a.attempt.checkoutUrl!);await expect(section.getByRole("link",{name:copy.actions.pay,exact:true})).toHaveCount(1);
  });
  test("duplicate checkout clicks cannot create duplicate local reservations or payments",async({request})=>{
    const body=await review(request);const before=calls;
    const responses=await Promise.all([post(request,"/api/public/consultations/checkout",body),post(request,"/api/public/consultations/checkout",body)]);
    expect(responses.filter(r=>r.status()===201)).toHaveLength(1);
    expect(await prisma.consultationRequest.count({where:{phone:body.draft.phone}})).toBe(1);
    expect(await prisma.paymentAttempt.count({where:{client:{phone:body.draft.phone}}})).toBe(1);
    expect(calls-before).toBeGreaterThanOrEqual(1);expect(calls-before).toBeLessThanOrEqual(2);
    await test.info().attach("checkout-concurrency-observation",{body:JSON.stringify({providerCalls:calls-before,localAttempts:1,localConsultations:1}),contentType:"application/json"});
  });
  test("changed reviewed price, service, mode or free setting blocks provider calls",async({request})=>{
    const body=await review(request),before=calls;
    for(const expectedPrice of [{...body.expectedPrice,amount:"0.01"},{...body.expectedPrice,priceVersion:9999},{...body.expectedPrice,serviceCategory:"legal-consultation"},{...body.expectedPrice,mode:"PHONE"}]){
      expect((await post(request,"/api/public/consultations/checkout",{...body,expectedPrice})).status()).toBe(409);
    }
    await prisma.systemSetting.update({where:{key:"consultation.booking"},data:{value:{mode:"AI_CHAT_FREE"}}});
    try{expect((await post(request,"/api/public/consultations/checkout",body)).status()).toBe(409);}finally{await prisma.systemSetting.update({where:{key:"consultation.booking"},data:{value:{mode:"AI_CHAT_PAID"}}});}
    expect(calls).toBe(before);expect(await prisma.consultationRequest.count({where:{phone:body.draft.phone}})).toBe(0);
  });
  test("malformed provider response and timeout roll back local reservations; retry is explicit",async({request})=>{
    test.setTimeout(60000);
    for(const failure of ["malformed","timeout"] as const){
      const body=await review(request);mode=failure;
      try{const result=await post(request,"/api/public/consultations/checkout",body);expect([502,504]).toContain(result.status());}finally{mode="ok";}
      expect(await prisma.consultationRequest.count({where:{phone:body.draft.phone}})).toBe(0);
      const retry=await post(request,"/api/public/consultations/checkout",body);expect(retry.status()).toBe(201);
      expect(await prisma.consultationRequest.count({where:{phone:body.draft.phone}})).toBe(1);
    }
  });
  test("browser preserves intake after a changed fee and requires a new explicit confirmation",async({page})=>{
    test.setTimeout(180000);
    const contact=`+201${String(++serial).slice(-9)}`,email=`${randomUUID()}@example.test`;
    await page.goto("/book-consultation");await page.getByTestId("booking-language-en").click();
    const intake=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");
    await page.locator('input[name="chatMessage"]').fill(`My name is Example Payment Client, phone ${contact}, email ${email}, city Cairo, corporate contract review appointment online tomorrow afternoon`);
    await page.getByTestId("booking-chat-composer").locator('button[type="submit"]').click();await intake;
    const slot=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");await page.getByTestId("booking-slot-chip").first().click();await slot;
    const reviewed=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");await page.getByTestId("booking-confirm-booking").click();const price=(await(await reviewed).json()).data.paymentReview;
    expect(price).toBeTruthy();await prisma.consultationPricingRule.update({where:{id:price.pricingRuleId},data:{amount:751,version:{increment:1}}});
    const declined=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/checkout");
    const recovery=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant",{timeout:60000});
    await page.getByTestId("booking-pay-booking").click();expect((await declined).status()).toBe(409);
    const recovered=await recovery;expect(recovered.status()).toBe(200);expect((await recovered.json()).data.readyToConfirm).toBe(true);
    await expect(page.getByTestId("booking-confirm-booking")).toBeVisible();expect(await prisma.consultationRequest.count({where:{phone:contact}})).toBe(0);
    const refresh=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");await page.getByTestId("booking-confirm-booking").click();const latest=(await(await refresh).json()).data;expect(latest.paymentReview.amount).toBe("751");expect(latest.draft.phone).toBe(contact);
    const accepted=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/checkout");await page.getByTestId("booking-pay-booking").click();expect((await accepted).status()).toBe(201);
    await expect(page).toHaveURL(/\/payment\/consultation\/return/);const row=await prisma.consultationRequest.findFirstOrThrow({where:{phone:contact},include:{paymentAttempts:true}});
    expect(row.paymentAttempts).toHaveLength(1);expect(row.paymentAttempts[0].amount.toString()).toBe("751");expect(row.status).toBe("PAYMENT_PENDING");
  });
});
