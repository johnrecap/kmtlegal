import { randomBytes, randomUUID, createHmac } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { POST } from "@/app/api/webhooks/paymob/route";
import { POST as paytabsPOST } from "@/app/api/webhooks/paytabs/route";
import { normalizeProviderWebhookPayload, verifyWebhookSignature, paytabsPaymentStatus, mapProviderPaymentStatus } from "@/server/payments/payment-provider";
import { expireOpenConsultationPaymentAttempts, getPublicPaymentAttemptStatus, replayAdminPaymentWebhookEvent } from "@/server/payments/payment-service";
import { createPaymentReceiptToken, createPaymentStatusToken, getPublicConsultationPaymentReceipt } from "@/server/payments/payment-receipt-service";
import { getAdminReports, listAdminPayments } from "@/server/admin/finance-report-service";
import { listPortalPayments } from "@/server/portal/client-portal-service";

const secret = randomBytes(32).toString("hex");
const enabled = process.env.BATCH6_ISOLATED_DB === "true";
let serial = Date.now()*1000;
function callback(attemptId: string, success = true) {
  return { type: "TRANSACTION", attemptId, obj: {
    amount_cents: 75000, created_at: "2026-09-12T10:00:00Z", currency: "EGP", error_occured: false,
    has_parent_transaction: false, id: ++serial, integration_id: 1, is_3d_secure: true,
    is_auth: false, is_capture: false, is_refunded: false, is_standalone_payment: true, is_voided: false,
    order: { id: ++serial, merchant_order_id: attemptId }, owner: 1, pending: false,
    source_data: { pan: "1234", sub_type: "MasterCard", type: "card" }, success
  }};
}
type Callback = ReturnType<typeof callback>;
// Independent fixture implementation of Paymob's documented ordered HMAC fields.
function sign(body: Callback) {
  const o = body.obj;
  return createHmac("sha512", secret).update([
    o.amount_cents,o.created_at,o.currency,o.error_occured,o.has_parent_transaction,o.id,o.integration_id,
    o.is_3d_secure,o.is_auth,o.is_capture,o.is_refunded,o.is_standalone_payment,o.is_voided,o.order.id,
    o.owner,o.pending,o.source_data.pan,o.source_data.sub_type,o.source_data.type,o.success
  ].map(String).join("")).digest("hex");
}
async function deliver(body: Callback, signature = sign(body)) {
  return POST(new Request(`http://127.0.0.1:3109/api/webhooks/paymob?hmac=${signature}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  }));
}
async function fixture() {
  const client = await prisma.client.create({data:{fullName:"Synthetic Payment Client",phone:`+201${++serial}`}});
  const consultation = await prisma.consultationRequest.create({data:{clientId:client.id,fullName:client.fullName,phone:client.phone,serviceCategory:"legal-consultation",summary:"Synthetic payment verification",preferredMode:"ONLINE",status:"PAYMENT_PENDING"}});
  const startsAt = new Date(Date.now()+86400000 + (serial%1000000)*60000), endsAt = new Date(startsAt.getTime()+1800000);
  const appointment = await prisma.appointment.create({data:{clientId:client.id,consultationRequestId:consultation.id,title:"Synthetic payment",type:"CONSULTATION",mode:"ONLINE",startsAt,endsAt,status:"RESERVED"}});
  return prisma.paymentAttempt.create({data:{provider:"paymob",clientId:client.id,consultationRequestId:consultation.id,appointmentId:appointment.id,priceVersion:1,serviceCategory:"legal-consultation",mode:"ONLINE",amount:750,currency:"EGP",startsAt,endsAt,expiresAt:new Date(Date.now()+900000),idempotencyKey:randomUUID(),status:"PENDING"}});
}
async function bind(attempt: Awaited<ReturnType<typeof fixture>>, body: Callback) {
  await prisma.paymentAttempt.update({where:{id:attempt.id},data:{providerOrderId:String(body.obj.order.id)}});
}
const state = (id:string) => prisma.paymentAttempt.findUniqueOrThrow({where:{id},include:{payment:true,appointment:true,transactions:true,consultationRequest:true}});
describe("batch6 canonical signature boundary",()=>{
  it.each([["D","sale","FAILED"],["E","sale","FAILED"],["H","sale","PENDING"],["P","refund","PENDING"],["V","sale","CANCELLED"],["X","sale","EXPIRED"],["A","sale","PAID"],["A","capture","PAID"],["A","auth","PENDING"],["A","refund","REFUNDED"],["A","void","CANCELLED"],["A","","PENDING"]])("PayTabs %s with %s means %s",(code,type,status)=>{
    expect(paytabsPaymentStatus(code,type)).toBe(status);
    expect(normalizeProviderWebhookPayload({cart_id:randomUUID(),tran_ref:"synthetic",tran_type:type,payment_result:{response_status:code},cart_amount:"750",cart_currency:"EGP"},"paytabs","fixture").status).toBe(status);
  });
  it("stored internal DISPUTED is distinct from PayTabs decline D",()=>{expect(mapProviderPaymentStatus("DISPUTED")).toBe("DISPUTED");expect(paytabsPaymentStatus("D","sale")).toBe("FAILED");});
  it("does not derive paid status from an unsigned status override",()=>{
    const body=callback(randomUUID(),false);
    const signature=sign(body);
    const changed={...body,obj:{...body.obj,status:"paid"}};
    expect(verifyWebhookSignature({rawBody:JSON.stringify(changed),parsedBody:changed,provider:"paymob",secret,signature})).toBe(true);
    expect(normalizeProviderWebhookPayload(changed,"paymob","fixture").status).toBe("FAILED");
  });
});
describe.skipIf(!enabled)("batch6 disposable payment database trust",()=>{
  beforeAll(async()=>{
    const url=new URL(process.env.DATABASE_URL||"");
    expect([url.hostname,url.port,url.pathname]).toEqual(["127.0.0.1","55437","/kmt_batch6"]);
    const rows=await prisma.$queryRaw<Array<{directory:string;port:number}>>`SELECT current_setting('data_directory') AS directory,inet_server_port() AS port`;
    expect(path.resolve(rows[0].directory)).toBe(path.resolve("_workspace/batch6-postgres/data"));expect(rows[0].port).toBe(55437);
    process.env.PAYMOB_HMAC_SECRET=secret;process.env.PAYMENT_REQUIRE_WEBHOOK_SIGNATURE="true";
    process.env.PAYTABS_WEBHOOK_SECRET=secret;
  });
  afterAll(async()=>{await prisma.$disconnect();});
  it("rejects an unsigned attempt substitution without consuming the legitimate callback",async()=>{
    const a=await fixture(), b=await fixture();const original=callback(a.id);const signature=sign(original);
    await bind(a,original);
    const changed={...original,attemptId:b.id};
    const response=await deliver(changed,signature);
    const other=await prisma.paymentAttempt.findUniqueOrThrow({where:{id:b.id},include:{payment:true,appointment:true}});
    expect({http:response.status,status:other.status,payments:other.payment?1:0,appointment:other.appointment.status}).toEqual({http:409,status:"PENDING",payments:0,appointment:"RESERVED"});
    expect((await deliver(original,signature)).status).toBe(200);
    expect((await state(a.id)).status).toBe("PAID");expect((await state(b.id)).status).toBe("PENDING");
    expect(await prisma.payment.count({where:{paymentAttemptId:a.id}})).toBe(1);
  });
  it("unsigned paid override cannot collect money or poison a subsequent signed success",async()=>{
    const a=await fixture(),body=callback(a.id);body.obj.pending=true;body.obj.success=false;await bind(a,body);
    expect((await deliver({...body,obj:{...body.obj,status:"paid"}} as Callback)).status).toBe(200);
    expect((await state(a.id)).status).toBe("PENDING");expect((await state(a.id)).payment).toBeNull();
    body.obj.pending=false;body.obj.success=true;expect((await deliver(body)).status).toBe(200);
    expect((await state(a.id)).status).toBe("PAID");
  });
  it("bad signatures and unknown signed orders do not consume genuine events",async()=>{
    const a=await fixture(),body=callback(a.id);await bind(a,body);
    expect((await deliver(body,"0".repeat(128))).status).toBe(400);
    expect((await deliver({...body,obj:{...body.obj,order:{...body.obj.order,id:++serial}}})).status).toBe(409);
    expect((await state(a.id)).status).toBe("PENDING");expect((await deliver(body)).status).toBe(200);
  });
  it("legacy unbound attempts stay unconfirmed until independently verified order binding",async()=>{
    const a=await fixture(),body=callback(a.id);await prisma.paymentAttempt.update({where:{id:a.id},data:{checkoutUrl:"https://provider.example.test/legacy"}});expect((await deliver(body)).status).toBe(409);
    expect((await state(a.id)).payment).toBeNull();expect(await prisma.paymentWebhookEvent.count({where:{attemptId:a.id}})).toBe(0);
    const token=createPaymentStatusToken({attemptId:a.id});const legacy=await getPublicPaymentAttemptStatus({attemptId:a.id,token});expect(legacy.requiresOrderVerification).toBe(true);expect(legacy.checkoutUrl).toBeNull();expect(legacy.resumeDraft).toBeNull();
    await bind(a,body);expect((await deliver(body)).status).toBe(200);
    expect((await getPublicPaymentAttemptStatus({attemptId:a.id,token})).requiresOrderVerification).toBe(false);
  });
  it("concurrent canonical callbacks create one collection and preserve paid state after pending or failure",async()=>{
    const a=await fixture(),body=callback(a.id);await bind(a,body);
    const responses=await Promise.all([deliver(body),deliver(body),deliver(body)]);expect(responses.map(r=>r.status)).toEqual([200,200,200]);
    const paid=await state(a.id);expect(paid.transactions).toHaveLength(1);expect(paid.payment).not.toBeNull();
    expect(await prisma.payment.count({where:{paymentAttemptId:a.id}})).toBe(1);
    for(const pending of [true,false]) expect((await deliver({...body,obj:{...body.obj,pending,success:false}})).status).toBe(200);
    const late=await state(a.id);expect([late.status,late.transactions[0].status,late.payment!.status,late.appointment.status]).toEqual(["PAID","PAID","PAID","SCHEDULED"]);
    expect(late.transactions[0].paidAt).toEqual(paid.transactions[0].paidAt);
  });
  it("an authorization remains pending until a signed capture",async()=>{
    const a=await fixture(),body=callback(a.id);body.obj.is_auth=true;body.obj.is_standalone_payment=false;await bind(a,body);
    expect((await deliver(body)).status).toBe(200);expect((await state(a.id)).payment).toBeNull();
    body.obj.id=++serial;body.obj.is_auth=false;body.obj.is_capture=true;expect((await deliver(body)).status).toBe(200);expect((await state(a.id)).status).toBe("PAID");expect((await state(a.id)).failureCode).toBeNull();
  });
  it.each(["amount","currency","provider"])("rejects mismatched %s without collecting",async(kind)=>{
    const a=await fixture(),body=callback(a.id);await bind(a,body);
    if(kind==="amount")body.obj.amount_cents=74999;
    if(kind==="currency")body.obj.currency="USD";
    if(kind==="provider")await prisma.paymentAttempt.update({where:{id:a.id},data:{provider:"paytabs"}});
    await deliver(body);const row=await state(a.id);expect(row.payment).toBeNull();expect(row.appointment.status).not.toBe("SCHEDULED");
    if(kind!=="provider") {expect(row.failureCode).toBe("PAYMENT_COLLECTION_REVIEW_REQUIRED");expect(row.transactions[0].status).toBe("PAID");expect(row.transactions[0].amount.toString()).toBe(kind==="amount"?"749.99":"750");expect(row.transactions[0].currency).toBe(kind==="currency"?"USD":"EGP");}
  });
  it("expiry rechecks a stale selection after a trusted payment wins",async()=>{
    const a=await fixture(),body=callback(a.id);await bind(a,body);
    const future=new Date(Date.now()+3600000);
    const find=prisma.paymentAttempt.findMany.bind(prisma.paymentAttempt);
    const intercepted = async(args: Parameters<typeof find>[0])=>{
      const rows=await find(args);expect(rows.some(r=>r.id===a.id)).toBe(true);
      expect((await deliver(body)).status).toBe(200);return rows;
    };
    const spy=vi.spyOn(prisma.paymentAttempt,"findMany").mockImplementationOnce(intercepted as unknown as typeof prisma.paymentAttempt.findMany);
    try {expect(await expireOpenConsultationPaymentAttempts(future,{attemptId:a.id})).toBe(0);}finally{spy.mockRestore();}
    const row=await state(a.id);expect([row.status,row.payment!.status,row.appointment.status,row.consultationRequest.status]).toEqual(["PAID","PAID","SCHEDULED","SCHEDULED"]);
  });
  it("expiry or cancellation releases an unpaid reservation and late success cannot rebook",async()=>{
    for(const cancelled of [false,true]){
      const a=await fixture(),body=callback(a.id);await bind(a,body);
      if(cancelled){body.obj.is_voided=true;await deliver(body);body.obj.is_voided=false;}
      else await expireOpenConsultationPaymentAttempts(new Date(Date.now()+3600000),{attemptId:a.id});
      expect((await deliver(body)).status).toBe(200);const row=await state(a.id);
      expect(row.payment).toBeNull();expect(row.appointment.status).toBe("CANCELLED");expect(row.status).toBe(cancelled?"CANCELLED":"EXPIRED");
      expect(row.failureCode).toBe("PAYMENT_COLLECTION_REVIEW_REQUIRED");expect(row.transactions[0].status).toBe("PAID");expect(row.transactions[0].amount.toString()).toBe("750");
      const token=createPaymentStatusToken({attemptId:a.id});const status=await getPublicPaymentAttemptStatus({attemptId:a.id,token});expect(status.requiresFinancialReview).toBe(true);expect(status.resumeDraft).toBeNull();expect(status.checkoutUrl).toBeNull();
    }
  });
  it("a second distinct trusted collection requires review without another invoice or appointment",async()=>{
    const a=await fixture(),body=callback(a.id);await bind(a,body);await deliver(body);
    const first=await state(a.id);const token=createPaymentReceiptToken({attemptId:a.id,paymentId:first.payment!.id});
    await deliver(body);expect((await state(a.id)).failureCode).toBeNull();
    const second={...body,obj:{...body.obj,id:body.obj.id+100000}};
    expect((await deliver(second)).status).toBe(200);
    const row=await state(a.id);expect(row.transactions).toHaveLength(2);
    expect(row.transactions.every(t=>t.status==="PAID"&&t.amount.toString()==="750")).toBe(true);
    expect(row.payment!.id).toBe(first.payment!.id);expect(row.appointment.id).toBe(first.appointment.id);expect(row.appointment.status).toBe("SCHEDULED");
    expect(row.failureCode).toBe("PAYMENT_COLLECTION_REVIEW_REQUIRED");
    await expect(getPublicConsultationPaymentReceipt({attemptId:a.id,token})).rejects.toMatchObject({status:404});
    const status=await getPublicPaymentAttemptStatus({attemptId:a.id,token:createPaymentStatusToken({attemptId:a.id})});
    expect(status.requiresFinancialReview).toBe(true);expect(status.payment!.receiptUrl).toBeNull();expect(status.checkoutUrl).toBeNull();
    const staff={id:randomUUID(),roleName:"Office Admin",clientId:null,permissions:["finance.read.any","report.read.any"]};
    const list=await listAdminPayments({actor:staff,query:{clientId:a.clientId}});expect(list.items[0].paymentAttempt?.failureCode).toBe("PAYMENT_COLLECTION_REVIEW_REQUIRED");
    const client=await listPortalPayments({id:randomUUID(),roleName:"Client",clientId:a.clientId,permissions:["client.read.self"]});expect(client[0].paymentAttempt?.failureCode).toBe("PAYMENT_COLLECTION_REVIEW_REQUIRED");
  });
  it("refund signal requires review, preserves historical collection and revokes an issued receipt",async()=>{
    const a=await fixture(),body=callback(a.id);await bind(a,body);await deliver(body);const paid=await state(a.id);
    const token=createPaymentReceiptToken({attemptId:a.id,paymentId:paid.payment!.id});
    expect((await getPublicConsultationPaymentReceipt({attemptId:a.id,token})).id).toBe(paid.payment!.id);
    body.obj.is_refunded=true;expect((await deliver(body)).status).toBe(200);
    const row=await state(a.id);expect(row.status).toBe("REFUNDED");expect(row.failureCode).toBe("PAYMENT_REVERSAL_REVIEW_REQUIRED");
    expect(row.transactions[0].status).toBe("REFUNDED");expect(row.payment!.id).toBe(paid.payment!.id);
    await expect(getPublicConsultationPaymentReceipt({attemptId:a.id,token})).rejects.toMatchObject({status:404});
  });
  it("a trusted void after collection revokes the receipt while late failure does not",async()=>{
    const a=await fixture(),body=callback(a.id);await bind(a,body);await deliver(body);const paid=await state(a.id);
    const token=createPaymentReceiptToken({attemptId:a.id,paymentId:paid.payment!.id});
    await deliver({...body,obj:{...body.obj,success:false}});expect((await state(a.id)).status).toBe("PAID");
    body.obj.is_voided=true;await deliver(body);const row=await state(a.id);
    expect([row.status,row.transactions[0].status,row.failureCode]).toEqual(["CANCELLED","CANCELLED","PAYMENT_REVERSAL_REVIEW_REQUIRED"]);
    await expect(getPublicConsultationPaymentReceipt({attemptId:a.id,token})).rejects.toMatchObject({status:404});
  });
  it("client, staff and report distinguish a reversal review from historical gross collections",async()=>{
    const a=await fixture(),body=callback(a.id);await bind(a,body);await deliver(body);
    const staff={id:randomUUID(),roleName:"Office Admin",clientId:null,permissions:["finance.read.any","report.read.any"]};
    const before=await getAdminReports({actor:staff,query:{currency:"EGP"}});
    body.obj.is_refunded=true;await deliver(body);
    const after=await getAdminReports({actor:staff,query:{currency:"EGP"}});
    expect(after.finance.summary.paidAmount).toBe(before.finance.summary.paidAmount);expect(after.finance.summary.reviewCount).toBe(before.finance.summary.reviewCount+1);
    const list=await listAdminPayments({actor:staff,query:{clientId:a.clientId}});expect(list.items[0].paymentAttempt?.failureCode).toBe("PAYMENT_REVERSAL_REVIEW_REQUIRED");
    const client=await listPortalPayments({id:randomUUID(),roleName:"Client",clientId:a.clientId,permissions:["client.read.self"]});expect(client[0].paymentAttempt?.failureCode).toBe("PAYMENT_REVERSAL_REVIEW_REQUIRED");
  });
  it("status tokens are attempt-bound and unprivileged replay cannot mutate an event",async()=>{
    const a=await fixture(),b=await fixture();const body=callback(a.id);await bind(a,body);await deliver(body);
    const token=createPaymentStatusToken({attemptId:a.id});
    expect((await getPublicPaymentAttemptStatus({attemptId:a.id,token})).access.verified).toBe(true);
    expect((await getPublicPaymentAttemptStatus({attemptId:b.id,token})).access.verified).toBe(false);
    const expiredToken=createPaymentStatusToken({attemptId:a.id,issuedAt:new Date(Date.now()-86400000)});expect((await getPublicPaymentAttemptStatus({attemptId:a.id,token:expiredToken})).access.verified).toBe(false);
    const event=await prisma.paymentWebhookEvent.findFirstOrThrow({where:{attemptId:a.id}});
    await expect(replayAdminPaymentWebhookEvent({actor:{id:randomUUID(),roleName:"Client",clientId:a.clientId,permissions:[]},eventId:event.id})).rejects.toMatchObject({status:403});
    expect((await prisma.paymentWebhookEvent.findUniqueOrThrow({where:{id:event.id}})).replayCount).toBe(0);
  });
  it("PayTabs decline is failure, signed void needs review, and changed event payload cannot replace the original",async()=>{
    for(const code of ["D","V"]){
      const a=await fixture();await prisma.paymentAttempt.update({where:{id:a.id},data:{provider:"paytabs"}});
      const base={eventId:randomUUID(),cart_id:a.id,tran_ref:randomUUID(),tran_type:"sale",cart_amount:"750",cart_currency:"EGP",payment_result:{response_status:"A"}};
      const send=async(body:typeof base)=>{const raw=JSON.stringify(body);return paytabsPOST(new Request("http://127.0.0.1:3109/api/webhooks/paytabs",{method:"POST",headers:{signature:createHmac("sha256",secret).update(raw).digest("hex")},body:raw}));};
      if(code==="V")expect((await send(base)).status).toBe(200);
      const changed={...base,eventId:randomUUID(),payment_result:{response_status:code}};expect((await send(changed)).status).toBe(200);
      const row=await state(a.id);expect(row.status).toBe(code==="D"?"FAILED":"CANCELLED");
      if(code==="D")expect(row.payment).toBeNull();else expect(row.failureCode).toBe("PAYMENT_REVERSAL_REVIEW_REQUIRED");
      expect((await send({...changed,cart_amount:"749"})).status).toBe(409);
      expect((await state(a.id)).status).toBe(row.status);
    }
  });
});
