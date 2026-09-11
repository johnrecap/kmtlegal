import { expect, test, type APIRequestContext } from "@playwright/test";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/server/db/prisma";
import { defaultConsultationAvailability } from "../../src/server/consultations/consultation-availability-service";
import { formatDateTime } from "../../src/lib/legal-format";
import { getClientContent } from "../../src/content/client-content";
import { plan36ConsultationOutcomeCopy } from "../../src/lib/ui-copy";
const marker = randomUUID();
let sequence = 0;
const phone = () => `+201${String(Date.now()).slice(-7)}${String(++sequence).padStart(2,"0")}`;
const dateAfter = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0,10);
const draftFor = (contact = phone()) => ({ fullName: "Example Booking Client", phone: contact, email: `${randomUUID()}@example.test`, city: "Cairo", serviceCategory: "corporate-business-services", summary: "A supplier contract requires a scheduled document review meeting.", preferredMode: "ONLINE", urgency: "NORMAL" });
let browserContact: string, browserEmail: string, browserClientId: string;

test.describe("batch4 isolated booking", () => {
  test.skip(process.env.BATCH4_ISOLATED_DB !== "true", "Disposable batch4 only");
  test.beforeAll(async ({ baseURL }) => {
    const url = new URL(process.env.DATABASE_URL || "");
    expect([url.hostname,url.port,url.pathname,process.env.APP_ENV,baseURL,process.env.AI_PROVIDER]).toEqual(["127.0.0.1","55437","/kmt_batch4","local","http://127.0.0.1:3109","mock"]);
    expect(path.resolve(process.env.UPLOADS_DIR || "")).toBe(path.resolve("_workspace/batch4-postgres/uploads"));
    const rows = await prisma.$queryRaw<Array<{ directory:string;port:number }>>`SELECT current_setting('data_directory') AS directory,inet_server_port() AS port`;
    expect(path.resolve(rows[0].directory)).toBe(path.resolve("_workspace/batch4-postgres/data"));expect(rows[0].port).toBe(55437);
    await prisma.systemSetting.upsert({where:{key:"consultation.booking"},create:{key:"consultation.booking",value:{mode:"AI_CHAT_FREE"}},update:{value:{mode:"AI_CHAT_FREE"}}});
    const value={...defaultConsultationAvailability,minLeadHours:0,slotDurationMinutes:15,bookingWindowDays:60,days:defaultConsultationAvailability.days.map(day=>({...day,enabled:true,start:"00:00",end:"24:00"}))};
    await prisma.systemSetting.upsert({where:{key:"consultation.availability"},create:{key:"consultation.availability",value},update:{value}});
    const owner=await prisma.user.findUniqueOrThrow({where:{email:"client@kmt.local"}});
    browserContact=phone();browserEmail=`browser-${marker}@example.test`;
    const user=await prisma.user.create({data:{name:"Browser Booking Client",email:browserEmail,passwordHash:owner.passwordHash,roleId:owner.roleId,status:"ACTIVE",locale:"en"}});
    browserClientId=(await prisma.client.create({data:{fullName:"Browser Booking Client",phone:browserContact,phoneCanonical:browserContact,email:browserEmail,userId:user.id}})).id;
  });
  test.afterAll(async()=>{await prisma.$disconnect();});

  test("late-day displayed slot confirms over HTTP only after explicit confirmation and retry does not duplicate",async({request,baseURL})=>{
    const date=dateAfter(40);const slots=await slotsFor(request,date);expect(slots.length).toBeGreaterThan(0);
    const draft=draftFor();const body={locale:"en",message:"Confirm",draft,selectedSlot:slots[0].startsAt};
    const review=await assistant(request,baseURL!,body);expect(review.data.readyToConfirm).toBe(true);
    expect(await prisma.consultationRequest.count({where:{phone:draft.phone}})).toBe(0);
    const results=await Promise.all([1,2].map(()=>assistant(request,baseURL!,{...body,confirmBooking:true})));
    expect(results.filter(r=>r.data?.reference)).toHaveLength(1);
    expect(await prisma.consultationRequest.count({where:{phone:draft.phone}})).toBe(1);
    const record=await prisma.consultationRequest.findFirstOrThrow({where:{phone:draft.phone},include:{appointments:true}});
    expect(record.appointments).toHaveLength(1);expect(record.appointments[0].startsAt.toISOString()).toBe(slots[0].startsAt);
  });

  test("impossible filters and working times return 400; 24:00 remains an end only",async({request,baseURL})=>{
    for(const query of ["date=2026-13-01","date=2026-02-31","fromTime=25:90","fromTime=24:00","toTime=24:01"]) expect((await request.get(`/api/public/consultations/slots?${query}`)).status()).toBe(400);
    expect((await request.get(`/api/public/consultations/slots?date=${dateAfter(3)}&fromTime=23:45&toTime=24:00`)).status()).toBe(200);
    await login(request,"office.admin@kmt.local",baseURL!);
    const value=(await prisma.systemSetting.findUniqueOrThrow({where:{key:"consultation.availability"}})).value as typeof defaultConsultationAvailability;
    const response=await request.patch("/api/admin/consultation-availability",{headers:{Origin:baseURL!},data:{...value,days:value.days.map(d=>({...d,end:"25:90"}))}});
    expect(response.status()).toBe(400);
  });

  test("staff reschedule enforces authorization and conflicts and releases the old slot",async({request,baseURL})=>{
    const slots=await slotsFor(request,dateAfter(8));
    const booked=await assistant(request,baseURL!,{locale:"en",message:"Confirm",draft:draftFor(),selectedSlot:slots[0].startsAt,confirmBooking:true});
    const appointment=await prisma.appointment.findUniqueOrThrow({where:{id:booked.data.appointment.id}});
    const url=`/api/admin/calendar/${appointment.id}/reschedule`;const data={startsAt:slots[1].startsAt,durationMinutes:15,mode:"ONLINE",reason:"Disposable reschedule"};
    expect((await request.post(url,{headers:{Origin:baseURL!},data})).status()).toBe(401);
    await login(request,"client@kmt.local",baseURL!);expect((await request.post(url,{headers:{Origin:baseURL!},data})).status()).toBe(403);
    await login(request,"marketing@kmt.local",baseURL!);expect((await request.post(url,{headers:{Origin:baseURL!},data})).status()).toBe(403);
    await login(request,"office.admin@kmt.local",baseURL!);expect((await request.post(url,{headers:{Origin:baseURL!},data})).status()).toBe(200);
    const available=await slotsFor(request,dateAfter(8));expect(available.some(s=>s.startsAt===slots[0].startsAt)).toBe(true);expect(available.some(s=>s.startsAt===slots[1].startsAt)).toBe(false);
    await assistant(request,baseURL!,{locale:"en",message:"Confirm",draft:draftFor(),selectedSlot:slots[2].startsAt,confirmBooking:true});
    expect((await request.post(url,{headers:{Origin:baseURL!},data:{...data,startsAt:slots[2].startsAt}})).status()).toBe(409);
  });

  test("reschedule racing a public confirmation never creates overlapping active appointments",async({request,baseURL})=>{
    const slots=await slotsFor(request,dateAfter(10));
    const first=await assistant(request,baseURL!,{locale:"en",message:"Confirm",draft:draftFor(),selectedSlot:slots[0].startsAt,confirmBooking:true});
    await login(request,"office.admin@kmt.local",baseURL!);
    const [move,book]=await Promise.all([
      request.post(`/api/admin/calendar/${first.data.appointment.id}/reschedule`,{headers:{Origin:baseURL!},data:{startsAt:slots[1].startsAt,durationMinutes:15,mode:"ONLINE"}}),
      assistant(request,baseURL!,{locale:"en",message:"Confirm",draft:draftFor(),selectedSlot:slots[1].startsAt,confirmBooking:true})
    ]);
    expect(Number(move.status()===200)+Number(Boolean(book.data?.reference))).toBe(1);
    expect(await prisma.appointment.count({where:{type:"CONSULTATION",status:{in:["RESERVED","SCHEDULED","RESCHEDULED"]},startsAt:new Date(slots[1].startsAt)}})).toBe(1);
  });

  test("future cancellation through reject enforces roles and version, closes the record and releases the slot",async({request,baseURL})=>{
    const date=dateAfter(12);const slots=await slotsFor(request,date);
    const result=await assistant(request,baseURL!,{locale:"en",message:"Confirm",draft:draftFor(),selectedSlot:slots[0].startsAt,confirmBooking:true});
    const appointment=await prisma.appointment.findUniqueOrThrow({where:{id:result.data.appointment.id}});
    const url=`/api/admin/consultations/${appointment.consultationRequestId}/reject`;
    const data={expectedOutcomeVersion:0,reasonCode:"CANCELLED_BY_CLIENT"};
    expect((await request.post(url,{headers:{Origin:baseURL!},data})).status()).toBe(401);
    for(const email of ["client@kmt.local","marketing@kmt.local","lawyer@kmt.local"]){await login(request,email,baseURL!);expect((await request.post(url,{headers:{Origin:baseURL!},data})).status()).toBe(403);}
    await login(request,"office.admin@kmt.local",baseURL!);
    expect((await request.post(url,{headers:{Origin:baseURL!},data:{...data,expectedOutcomeVersion:1}})).status()).toBe(409);
    expect((await request.post(url,{headers:{Origin:baseURL!},data})).status()).toBe(200);
    const closed=await prisma.consultationRequest.findUniqueOrThrow({where:{id:appointment.consultationRequestId!}});
    expect([closed.status,closed.outcomeStatus,closed.outcomeVersion]).toEqual(["REJECTED","CANCELLED",1]);
    expect((await prisma.appointment.findUniqueOrThrow({where:{id:appointment.id}})).status).toBe("CANCELLED");
    expect((await slotsFor(request,date)).some(slot=>slot.startsAt===slots[0].startsAt)).toBe(true);
    expect((await request.post(url,{headers:{Origin:baseURL!},data:{...data,expectedOutcomeVersion:1}})).status()).toBe(409);
    expect((await request.post(`/api/admin/calendar/${appointment.id}/reschedule`,{headers:{Origin:baseURL!},data:{startsAt:slots[1].startsAt,durationMinutes:15,mode:"ONLINE"}})).status()).toBe(409);
    const replacement=await assistant(request,baseURL!,{locale:"en",message:"Confirm",draft:draftFor(),selectedSlot:slots[0].startsAt,confirmBooking:true});expect(replacement.data.reference).toBeTruthy();
  });

  test("bilingual invalid chat dates recover without poisoned drafts; date-only and time-only preferences work",async({request,baseURL})=>{
    for(const [locale,message] of [["en","Book on 2026-13-01"],["ar","موعد يوم ٢٠٢٦-٠٢-٣١"]]){
      const draft=draftFor();
      const result=await assistant(request,baseURL!,{locale,message,draft});
      expect(result.data.draft.phone).toBe(draft.phone);expect(result.data.draft.fullName).toBe(draft.fullName);
      expect(result.data.draft.availabilityPreference.date).toBe("");expect(result.data.needsAvailabilityPreference).toBe(true);
      expect(result.data.reference).toBeUndefined();
      const next=await assistant(request,baseURL!,{locale,message:dateAfter(4),draft:result.data.draft});
      expect(next.data.availableSlots.length).toBeGreaterThan(0);expect(next.data.draft.phone).toBe(draft.phone);
      expect(next.data.draft.availabilityPreference.date).toBe(dateAfter(4));
      expect(await prisma.consultationRequest.count({where:{phone:draft.phone}})).toBe(0);
    }
    const timeOnly=await assistant(request,baseURL!,{locale:"en",message:"afternoon",draft:{...draftFor(),availabilityPreference:{date:" ",fromTime:" ",toTime:" ",timeWindow:"",label:" "}}});
    expect(timeOnly.data.draft.availabilityPreference.date).toBe("");expect(timeOnly.data.draft.availabilityPreference.fromTime).toBe("12:00");expect(timeOnly.data.availableSlots.length).toBeGreaterThan(0);
  });

  test("browser free booking preserves data after slot loss and appears for staff and client",async({page,browser,baseURL})=>{
    test.setTimeout(180000);
    await page.goto("/book-consultation",{waitUntil:"domcontentloaded"});
    await page.getByTestId("booking-language-en").click();
    const message=`My name is Browser Booking Client, phone ${browserContact}, email ${browserEmail}, city Cairo, corporate contract review appointment online tomorrow afternoon`;
    const responsePromise=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");
    await page.locator('input[name="chatMessage"]').fill(message);await page.getByTestId("booking-chat-composer").locator('button[type="submit"]').click();
    const intake=await (await responsePromise).json();expect(intake.data.draft.phone).toBe(browserContact);
    await expect(page.getByTestId("booking-slot-chip").first()).toBeVisible();
    const selected=intake.data.availableSlots[0].startsAt;
    const reviewPromise=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");
    await page.getByTestId("booking-slot-chip").first().click();const review=await(await reviewPromise).json();expect(review.data.readyToConfirm).toBe(true);
    expect(await prisma.consultationRequest.count({where:{phone:browserContact}})).toBe(0);
    await assistant(page.request,baseURL!,{locale:"en",message:"Confirm",draft:draftFor(),selectedSlot:selected,confirmBooking:true});
    const lossPromise=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");
    await page.getByTestId("booking-confirm-booking").click();const loss=await(await lossPromise).json();
    expect(loss.data.reference).toBeUndefined();expect(loss.data.draft.phone).toBe(browserContact);expect(loss.data.draft.startsAt).toBe("");expect(loss.data.availableSlots.length).toBeGreaterThan(0);
    const nextReview=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");await page.getByTestId("booking-slot-chip").first().click();await nextReview;
    const donePromise=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/public/consultations/assistant");await page.getByTestId("booking-confirm-booking").click();const done=await(await donePromise).json();expect(done.data.reference).toBeTruthy();
    expect(await prisma.consultationRequest.count({where:{phone:browserContact}})).toBe(1);
    await assistant(page.request,baseURL!,{locale:"en",message:"Confirm",draft:loss.data.draft,selectedSlot:done.data.appointment.startsAt,confirmBooking:true});
    expect(await prisma.consultationRequest.count({where:{phone:browserContact}})).toBe(1);
    const saved=await prisma.consultationRequest.findFirstOrThrow({where:{phone:browserContact},include:{appointments:true}});
    expect(saved.clientId).toBe(browserClientId);expect(saved.appointments).toHaveLength(1);const bookedAppointment=saved.appointments[0];expect(bookedAppointment.clientId).toBe(browserClientId);
    const staff=await browser.newContext({baseURL});try{await login(staff.request,"office.admin@kmt.local",baseURL!);const tab=await staff.newPage();await tab.goto(`/admin/consultations/${saved.id}`);await expect(tab.locator("body")).toContainText("Browser Booking Client");await expect(tab.locator("body")).toContainText(formatDateTime(bookedAppointment.startsAt));await expect(tab.locator("body")).toContainText(plan36ConsultationOutcomeCopy.statuses[saved.outcomeStatus]);}finally{await staff.close();}
    await login(page.request,browserEmail,baseURL!);await page.goto("/client/court-dates");const row=page.getByRole("row").filter({hasText:bookedAppointment.title});await expect(row).toHaveCount(1);await expect(row).toContainText(formatDateTime(bookedAppointment.startsAt,"en"));await expect(row).toContainText(getClientContent("en").common.pendingOfficeReview);
  });
});
async function login(request:APIRequestContext,email:string,origin:string){expect((await request.post("/api/auth/login",{headers:{Origin:origin},data:{email,password:"KmtLocalDev!2026"}})).status()).toBe(200);}
async function assistant(request:APIRequestContext,origin:string,data:unknown){const response=await request.post("/api/public/consultations/assistant",{headers:{Origin:origin},data});expect([200,409]).toContain(response.status());return await response.json();}
async function slotsFor(request:APIRequestContext,date:string):Promise<Array<{startsAt:string;endsAt:string}>>{const response=await request.get(`/api/public/consultations/slots?date=${date}&limit=50`);expect(response.status()).toBe(200);return(await response.json()).data.slots;}

