import { expect, test, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "../../src/server/db/prisma";
import { manualCaseRequestHash } from "../../src/server/admin/manual-case-service";

const origin = "http://127.0.0.1:3111";
const marker = `BATCH7-${randomUUID().slice(0,8)}`;
const actors: Array<{id:string;email:string;api:APIRequestContext}> = [];
const clients: Array<{id:string;fullName:string}> = [];
const cases: Array<{id:string;title:string}> = [];
const post = (api:APIRequestContext,url:string,data:unknown) => api.post(url,{headers:{Origin:origin},data});
const patch = (api:APIRequestContext,url:string,data:unknown) => api.patch(url,{headers:{Origin:origin},data});
let slotIndex=0;
async function consultation(past=false) {
  const startsAt=new Date(Date.now()+(past?-10:20)*86400000+(++slotIndex)*7200000);
  const row=await prisma.consultationRequest.create({data:{clientId:clients[0].id,fullName:clients[0].fullName,phone:`+201${Date.now().toString().slice(-9)}`,summary:`${marker} synthetic consultation`,serviceCategory:"legal-consultation",preferredMode:"ONLINE",status:"SCHEDULED",outcomeStatus:past?"AWAITING_RESULT":"PENDING",assignedLawyerId:actors[1].id,secretaryReviewedAt:new Date()}});
  const appointment=await prisma.appointment.create({data:{clientId:clients[0].id,lawyerId:actors[1].id,consultationRequestId:row.id,title:`${marker} consultation appointment`,type:"CONSULTATION",mode:"ONLINE",startsAt,endsAt:new Date(startsAt.getTime()+3600000),status:"SCHEDULED"}});
  return {row,appointment};
}
function manualBody() {return {requestToken:randomUUID(),clientId:clients[0].id,assignedLawyerId:actors[1].id,title:`${marker} manual case`,caseType:"Synthetic contract",courtName:null,externalCaseNumber:null,summary:"Synthetic summary",parties:[]};}

test.describe("batch7 isolated office network",()=>{
  test.skip(process.env.BATCH7_ISOLATED_DB!=="true","Requires guarded disposable batch7 PostgreSQL");
  test.beforeAll(async({playwright})=>{
    const url=new URL(process.env.DATABASE_URL||"");
    expect([url.hostname,url.port,url.pathname,process.env.APP_ENV]).toEqual(["127.0.0.1","55438","/kmt_batch7","local"]);
    const identity=await prisma.$queryRaw<Array<{directory:string;port:number}>>`SELECT current_setting('data_directory') AS directory,inet_server_port() AS port`;
    expect(path.resolve(identity[0].directory)).toBe(path.resolve("_workspace/batch7-postgres/data"));expect(identity[0].port).toBe(55438);
    const seed=await prisma.user.findUniqueOrThrow({where:{email:"office.admin@kmt.local"}});
    for(const [index,roleName] of ["Office Admin","Lawyer","Lawyer","Client","Client","Marketing Staff"].entries()) {
      const role=await prisma.role.findUniqueOrThrow({where:{name:roleName}});
      const user=await prisma.user.create({data:{name:`${marker} actor ${index}`,email:`${marker.toLowerCase()}-${index}@example.test`,passwordHash:seed.passwordHash,roleId:role.id,status:"ACTIVE",locale:"ar"}});
      const api=await playwright.request.newContext({baseURL:origin});
      expect((await post(api,"/api/auth/login",{email:user.email,password:"KmtLocalDev!2026"})).status()).toBe(200);
      actors.push({id:user.id,email:user.email,api});
    }
    for(let index=0;index<2;index++) clients.push(await prisma.client.create({data:{fullName:`${marker} client ${index}`,phone:`+201${Date.now().toString().slice(-8)}${index}`,userId:actors[3+index].id,assignedLawyerId:actors[index+1].id,status:"ACTIVE",source:marker}}));
    for(let index=0;index<3;index++) cases.push(await prisma.legalCase.create({data:{internalFileNumber:`${marker}-${index}`,clientId:clients[index===2?1:0].id,assignedLawyerId:actors[index===0?1:2].id,title:`${marker} case ${index}`,caseType:`${marker} type ${index}`,summary:"Synthetic client-safe summary",status:"ACTIVE",parties:{create:{name:"Synthetic party",partyType:"OTHER",notes:`${marker} INTERNAL PARTY NOTE`}}}}));
    await prisma.internalNote.create({data:{caseId:cases[0].id,authorId:actors[1].id,content:`${marker} INTERNAL CASE NOTE`}});
  });
  test.beforeEach(async()=>{await prisma.rateLimitCounter.deleteMany();});
  test.afterAll(async()=>{await Promise.all(actors.map(actor=>actor.api.dispose()));await prisma.$disconnect();});

  test("client cannot retrieve the staff-only detail of their own case",async()=>{
    const response=await actors[3].api.get(`/api/admin/cases/${cases[0].id}`);
    expect([403,404],await response.text()).toContain(response.status());
  });
  test("client cannot retrieve the staff-only CRM detail of their own profile",async()=>{
    const response=await actors[3].api.get(`/api/admin/clients/${clients[0].id}`);
    expect([403,404],await response.text()).toContain(response.status());
  });
  test("assigned client CRM does not reveal another lawyer's case through nested summaries",async()=>{
    expect([403,404]).toContain((await actors[1].api.get(`/api/admin/cases/${cases[1].id}`)).status());
    const response=await actors[1].api.get(`/api/admin/clients/${clients[0].id}`);expect(response.status()).toBe(200);
    const data=(await response.json()).data;expect(data.cases.map((item:{id:string})=>item.id)).toContain(cases[0].id);
    expect(data.cases.map((item:{id:string})=>item.id)).not.toContain(cases[1].id);
    expect(data._count.cases).toBe(1);
  });

  test("assignment accepts an active lawyer and synchronizes resources while revoking former assigned access",async()=>{
    const {row,appointment}=await consultation();const url=`/api/admin/consultations/${row.id}/assign`;
    expect((await post(actors[1].api,url,{assignedLawyerId:actors[2].id})).status()).toBe(403);
    for(const invalidId of [actors[3].id,randomUUID()]) expect((await post(actors[0].api,url,{assignedLawyerId:invalidId})).status()).toBe(400);
    await prisma.user.update({where:{id:actors[2].id},data:{deletedAt:new Date()}});
    try {expect((await post(actors[0].api,url,{assignedLawyerId:actors[2].id})).status()).toBe(400);} finally {await prisma.user.update({where:{id:actors[2].id},data:{deletedAt:null}});}
    expect((await post(actors[0].api,url,{assignedLawyerId:actors[2].id})).status()).toBe(200);
    const current=await prisma.consultationRequest.findUniqueOrThrow({where:{id:row.id},include:{client:true,appointments:true}});
    expect([current.assignedLawyerId,current.client!.assignedLawyerId,current.appointments.find(a=>a.id===appointment.id)!.lawyerId]).toEqual([actors[2].id,actors[2].id,actors[2].id]);
    expect((await actors[1].api.get(`/api/admin/consultations/${row.id}`)).status()).toBe(403);
    expect((await actors[2].api.get(`/api/admin/consultations/${row.id}`)).status()).toBe(200);
    const old=(await(await actors[1].api.get(`/api/admin/consultations?view=all&q=${marker}`)).json()).data;
    expect(old.items.map((c:{id:string})=>c.id)).not.toContain(row.id);
    expect((await actors[1].api.get(`/api/admin/clients/${clients[0].id}`)).status()).toBe(403);
    await prisma.client.update({where:{id:clients[0].id},data:{assignedLawyerId:actors[1].id}});
  });

  test("past outcome correction rejects stale editors and concurrent conversion creates one linked case",async()=>{
    const {row,appointment}=await consultation(true);const url=`/api/admin/consultations/${row.id}/outcome`;
    const result={status:"SUCCESSFUL",expectedOutcomeVersion:0,reasonCode:"COMPLETED_AS_SCHEDULED",note:"Synthetic internal outcome note"};
    expect((await post(actors[1].api,url,result)).status()).toBe(403);
    expect((await post(actors[0].api,url,result)).status()).toBe(200);
    expect((await post(actors[0].api,url,{...result,status:"NO_SHOW",reasonCode:"CLIENT_NO_SHOW"})).status()).toBe(409);
    expect((await post(actors[0].api,url,{status:"NO_SHOW",expectedOutcomeVersion:1,reasonCode:"CORRECTED_AFTER_VERIFICATION"})).status()).toBe(200);
    expect((await post(actors[0].api,url,{status:"SUCCESSFUL",expectedOutcomeVersion:2,reasonCode:"CORRECTED_AFTER_VERIFICATION"})).status()).toBe(200);
    expect(await prisma.auditLog.count({where:{resourceId:row.id,action:"consultation.outcome.confirmed"}})).toBe(1);
    expect(await prisma.auditLog.count({where:{resourceId:row.id,action:"consultation.outcome.corrected"}})).toBe(2);
    const beforeClients=await prisma.client.count();const convert=`/api/admin/consultations/${row.id}/convert`;
    const conversion={caseTitle:`${marker} converted`,assignedLawyerId:actors[1].id,appointmentStartsAt:new Date(Date.now()+35*86400000).toISOString(),appointmentMode:"ONLINE"};
    const results=await Promise.all([post(actors[0].api,convert,conversion),post(actors[0].api,convert,conversion)]);
    expect(results.map(r=>r.status()).sort()).toEqual([200,409]);expect((await post(actors[0].api,convert,{})).status()).toBe(409);
    const legalCases=await prisma.legalCase.findMany({where:{consultationRequestId:row.id}});expect(legalCases).toHaveLength(1);expect(await prisma.client.count()).toBe(beforeClients);
    expect([legalCases[0].clientId,legalCases[0].assignedLawyerId]).toEqual([clients[0].id,actors[1].id]);
    const followups=await prisma.appointment.findMany({where:{caseId:legalCases[0].id}});expect(followups).toHaveLength(1);expect([followups[0].clientId,followups[0].lawyerId,followups[0].consultationRequestId]).toEqual([clients[0].id,actors[1].id,row.id]);
    const current=await prisma.appointment.findUniqueOrThrow({where:{id:appointment.id}});expect([current.status,current.clientId,current.lawyerId]).toEqual(["COMPLETED",clients[0].id,actors[1].id]);
  });

  test("future appointments reject completed outcomes and cancel through the existing rejection action",async()=>{
    const {row,appointment}=await consultation();const base=`/api/admin/consultations/${row.id}`;
    expect((await post(actors[0].api,`${base}/outcome`,{status:"SUCCESSFUL",expectedOutcomeVersion:0,reasonCode:"COMPLETED_AS_SCHEDULED"})).status()).toBe(409);
    expect((await post(actors[0].api,`${base}/reject`,{expectedOutcomeVersion:0,reasonCode:"CANCELLED_BY_OFFICE",reason:"Synthetic cancellation"})).status()).toBe(200);
    expect((await prisma.appointment.findUniqueOrThrow({where:{id:appointment.id}})).status).toBe("CANCELLED");
  });

  test("manual case token is idempotent and edits enforce versions and reassignment boundaries",async()=>{
    const body=manualBody();let hash=manualCaseRequestHash(body);
    for(let i=0;i<10000&&!/(?<!\d)\d{10,15}(?!\d)/.test(hash);i++){body.title=`${marker} manual digest ${i}`;hash=manualCaseRequestHash(body);}
    expect(hash).toMatch(/(?<!\d)\d{10,15}(?!\d)/);
    const created=await Promise.all([post(actors[0].api,"/api/admin/cases",body),post(actors[0].api,"/api/admin/cases",body)]);
    expect(created.map(r=>r.status()).sort(),JSON.stringify(await Promise.all(created.map(r=>r.json())))).toEqual([200,201]);expect(await prisma.legalCase.count({where:{id:body.requestToken}})).toBe(1);
    expect((await post(actors[0].api,"/api/admin/cases",body)).status()).toBe(200);
    const audit=await prisma.auditLog.findFirstOrThrow({where:{resourceId:body.requestToken,action:"case.manual_create"}});expect((audit.metadata as {requestHash:string}).requestHash).toBe(hash);
    expect((await post(actors[0].api,"/api/admin/cases",{...body,title:"Changed payload"})).status()).toBe(409);
    expect((await post(actors[1].api,"/api/admin/cases",manualBody())).status()).toBe(403);
    const url=`/api/admin/cases/${body.requestToken}`;const existing=(await(await actors[0].api.get(url)).json()).data;
    expect((await patch(actors[2].api,url,{title:"Unauthorized edit",updatedAt:existing.updatedAt})).status()).toBe(404);
    expect((await patch(actors[1].api,url,{assignedLawyerId:actors[2].id,updatedAt:existing.updatedAt})).status()).toBe(403);
    expect((await patch(actors[1].api,url,{title:`${marker} fresh title`,updatedAt:existing.updatedAt})).status()).toBe(200);
    expect((await patch(actors[0].api,url,{title:"Stale edit",updatedAt:existing.updatedAt})).status()).toBe(409);
    const latest=(await(await actors[0].api.get(url)).json()).data;
    expect((await patch(actors[0].api,url,{assignedLawyerId:actors[2].id,updatedAt:latest.updatedAt})).status()).toBe(200);
    expect((await actors[1].api.get(url)).status()).toBe(403);expect((await actors[2].api.get(url)).status()).toBe(200);
  });

  test("other clients and unprivileged staff cannot access lists details writes or internal notes",async()=>{
    for(const index of [4,5]) {
      expect((await actors[index].api.get(`/api/admin/clients/${clients[0].id}`)).status()).toBe(403);
      expect((await actors[index].api.get(`/api/admin/cases/${cases[0].id}`)).status()).toBe(403);
      for(const url of ["/api/admin/cases","/api/admin/clients","/api/admin/consultations"]) expect((await actors[index].api.get(url)).status()).toBe(403);
      expect((await patch(actors[index].api,`/api/admin/cases/${cases[0].id}`,{title:"Forbidden",updatedAt:new Date().toISOString()})).status()).toBe(403);
    }
    const own=await actors[3].api.get(`/client/cases/${cases[0].id}`);expect(own.status()).toBe(200);const html=await own.text();expect(html).toContain(cases[0].title);expect(html).not.toContain("INTERNAL PARTY NOTE");expect(html).not.toContain("INTERNAL CASE NOTE");
    const other=await actors[4].api.get(`/client/cases/${cases[0].id}`);expect(await other.text()).not.toContain(cases[0].title);
    const list=await actors[4].api.get("/client/cases");expect(await list.text()).not.toContain(cases[0].title);
  });

  test("archival preserves historical access but blocks new manual cases for archived clients",async()=>{
    expect((await post(actors[0].api,`/api/admin/clients/${clients[0].id}/archive`,{reason:"Synthetic archive",confirmArchive:true})).status()).toBe(200);
    try {expect((await post(actors[0].api,"/api/admin/cases",manualBody())).status()).toBe(400);expect((await actors[3].api.get(`/client/cases/${cases[0].id}`)).status()).toBe(200);} finally {await prisma.client.update({where:{id:clients[0].id},data:{status:"ACTIVE"}});}
    expect((await post(actors[0].api,`/api/admin/cases/${cases[0].id}/status`,{status:"ARCHIVED",confirmStatusChange:true})).status()).toBe(200);
    expect((await actors[1].api.get(`/api/admin/cases/${cases[0].id}`)).status()).toBe(200);
    const deleted=await prisma.legalCase.update({where:{id:cases[0].id},data:{deletedAt:new Date()}});
    try {expect((await actors[1].api.get(`/api/admin/cases/${deleted.id}`)).status()).toBe(404);expect(await(await actors[3].api.get(`/client/cases/${deleted.id}`)).text()).not.toContain(deleted.title);} finally {await prisma.legalCase.update({where:{id:deleted.id},data:{deletedAt:null}});}
  });

  test("CRM related appointments requests and counts match independent scopes, including a client-only reader",async({playwright})=>{
    test.setTimeout(120000);
    const own=await consultation(),hidden=await consultation();
    await prisma.consultationRequest.update({where:{id:hidden.row.id},data:{assignedLawyerId:actors[2].id}});
    await prisma.appointment.update({where:{id:hidden.appointment.id},data:{lawyerId:actors[2].id}});
    await prisma.document.create({data:{ownerClientId:clients[0].id,uploadedById:actors[0].id,fileName:`${marker}-metadata-only.pdf`,fileKey:`batch7/${randomUUID()}.pdf`,fileType:"application/pdf",fileSize:0,visibility:"STAFF_ONLY"}});
    const crm=(await(await actors[1].api.get(`/api/admin/clients/${clients[0].id}`)).json()).data;
    expect(crm.appointments.map((a:{id:string})=>a.id)).toContain(own.appointment.id);expect(crm.appointments.map((a:{id:string})=>a.id)).not.toContain(hidden.appointment.id);
    expect(crm.consultationRequests.map((a:{id:string})=>a.id)).toContain(own.row.id);expect(crm.consultationRequests.map((a:{id:string})=>a.id)).not.toContain(hidden.row.id);
    const requests=(await(await actors[1].api.get(`/api/admin/consultations?view=all&q=${marker}`)).json()).data;
    expect(requests.items.map((a:{id:string})=>a.id)).not.toContain(hidden.row.id);expect(crm._count.consultationRequests).toBe(requests.total);
    const from=new Date(Date.now()-20*86400000).toISOString().slice(0,10),to=new Date(Date.now()+50*86400000).toISOString().slice(0,10);
    const calendarResponse=await actors[1].api.get(`/api/admin/calendar?from=${from}&to=${to}`);expect(calendarResponse.status()).toBe(200);
    const calendar=(await calendarResponse.json()).data;expect(JSON.stringify(calendar)).toContain(own.appointment.id);expect(JSON.stringify(calendar)).not.toContain(hidden.appointment.id);expect(crm._count.appointments).toBe(calendar.items.length);
    const documents=(await(await actors[1].api.get(`/api/admin/documents?q=${marker}`)).json()).data;expect(crm._count.documents).toBe(documents.total);
    const seed=await prisma.user.findUniqueOrThrow({where:{id:actors[0].id}});
    const role=await prisma.role.create({data:{name:`${marker} client-only`,status:"ACTIVE",permissions:{create:{permission:{connect:{key:"client.read.any"}}}}}});
    const user=await prisma.user.create({data:{name:"Synthetic client-only reader",email:`${randomUUID()}@example.test`,passwordHash:seed.passwordHash,roleId:role.id,status:"ACTIVE"}});
    const api=await playwright.request.newContext({baseURL:origin});
    try {
      expect((await post(api,"/api/auth/login",{email:user.email,password:"KmtLocalDev!2026"})).status()).toBe(200);
      const response=await api.get(`/api/admin/clients/${clients[0].id}`);expect(response.status()).toBe(200);const data=(await response.json()).data;
      expect(data.cases).toEqual([]);expect(data.appointments).toEqual([]);expect(data.consultationRequests).toEqual([]);expect(data._count).toEqual({cases:0,appointments:0,documents:0,consultationRequests:0});
      const list=(await(await api.get(`/api/admin/clients?q=${marker}`)).json()).data;expect(list.items.find((c:{id:string})=>c.id===clients[0].id)._count).toEqual(data._count);
    } finally {await api.dispose();}
  });

  test("lawyer search and rendered filter choices cannot widen resource scope",async()=>{
    test.setTimeout(120000);
    const api=actors[1].api;
    const result=await api.get(`/api/admin/cases?q=${marker}&assignedLawyerId=${actors[2].id}`);expect(result.status()).toBe(200);
    const ids=(await result.json()).data.items.map((c:{id:string})=>c.id);expect(ids).toContain(cases[0].id);expect(ids).not.toContain(cases[1].id);expect(ids).not.toContain(cases[2].id);
    const casePage=await api.get(`/admin/cases?q=${marker}`);expect(casePage.status()).toBe(200);const caseHtml=await casePage.text();
    expect(caseHtml).toContain(`${marker} type 0`);expect(caseHtml).not.toContain(`${marker} type 1`);expect(caseHtml).not.toContain(cases[1].title);
    const hiddenSource=`${marker} other source`;await prisma.client.update({where:{id:clients[1].id},data:{source:hiddenSource}});
    const clientList=(await(await api.get(`/api/admin/clients?q=${marker}&assignedLawyerId=${actors[2].id}`)).json()).data;
    expect(clientList.items.map((c:{id:string})=>c.id)).toEqual([clients[0].id]);
    const clientPage=await api.get(`/admin/clients?q=${marker}`);expect(clientPage.status()).toBe(200);const html=await clientPage.text();expect(html).not.toContain(hiddenSource);expect(html).not.toContain(clients[1].fullName);
  });

  for(const width of [390,768,1440]) test(`manual case browser journey preserves invalid input and opens scoped results at ${width}px`,async({page})=>{
    test.setTimeout(150000);const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
    await page.setViewportSize({width,height:900});
    expect((await post(page.request,"/api/auth/login",{email:actors[0].email,password:"KmtLocalDev!2026"})).status()).toBe(200);
    await page.goto(`/admin/cases/new?clientId=${clients[0].id}`);
    const form=page.locator("form").filter({has:page.locator('input[name="title"]')});
    const title=`${marker} browser ${width}`;await form.locator('input[name="title"]').fill(title);
    await form.locator('input[name="title"]').focus();await page.keyboard.press("Tab");await expect(form.locator('input[name="caseType"]')).toBeFocused();
    await form.locator('button[type="submit"]').click();await expect(form.locator('input[name="title"]')).toHaveValue(title);
    await expect(form.locator('[aria-live="polite"]')).not.toHaveText("");
    await form.locator('input[name="caseType"]').fill("Synthetic browser contract");await form.locator('select[name="assignedLawyerId"]').selectOption(actors[1].id);
    const response=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/admin/cases"&&r.request().method()==="POST");
    const detailResponse=page.waitForResponse(r=>/^\/admin\/cases\/[a-f0-9-]{36}$/.test(new URL(r.url()).pathname)&&r.request().method()==="GET");
    await form.locator('button[type="submit"]').click();const created=await response;expect(created.status()).toBe(201);const data=(await created.json()).data.case;
    const detail=await detailResponse;expect(detail.status()).toBe(200);expect(new URL(detail.url()).pathname).toBe(`/admin/cases/${data.id}`);
    await expect(page).toHaveURL(new RegExp(`/admin/cases/${data.id}`));await expect(page.locator("body")).toContainText(title);
    await page.goto(`/admin/cases?q=${encodeURIComponent(title)}`);const link=page.locator(`a[href="/admin/cases/${data.id}"]`).filter({visible:true}).first();await expect(link).toBeVisible();await link.click();
    await expect(page).toHaveURL(new RegExp(`/admin/cases/${data.id}`));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({path:`_workspace/batch7-review/manual-case-${width}.png`});
    expect((await post(page.request,"/api/auth/login",{email:actors[3].email,password:"KmtLocalDev!2026"})).status()).toBe(200);
    await page.goto("/client/cases");const own=page.locator(`a[href="/client/cases/${data.id}"]`).filter({visible:true}).first();await own.scrollIntoViewIfNeeded();
    const assertNeutralContrast = async () => {
      const badges=page.locator('span.bg-white').filter({visible:true});expect(await badges.count()).toBeGreaterThanOrEqual(2);
      for(const badge of await badges.all()) {
        const colors=await badge.evaluate(el=>({foreground:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
        expect(colors).toEqual({foreground:"rgb(100, 116, 139)",background:"rgb(255, 255, 255)"});
      }
    };
    await assertNeutralContrast();await page.screenshot({path:`_workspace/batch7-review/client-list-${width}.png`});await own.click();await expect(page).toHaveURL(new RegExp(`/client/cases/${data.id}`));await expect(page.locator("body")).toContainText(title);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
    await assertNeutralContrast();await page.screenshot({path:`_workspace/batch7-review/client-case-${width}.png`});expect(errors).toEqual([]);
  });
});
