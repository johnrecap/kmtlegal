import { test, expect, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { directBookingCopy } from "../../src/content/direct-booking-copy";
import { conversationCopy } from "../../src/content/conversation-copy";
import { fixtureBookingAvailability } from "./helpers/booking-availability";

const faults=new WeakMap<Page,string[]>();
test.beforeEach(async({page},info)=>{
  const errors:string[]=[];faults.set(page,errors);
  // Local HTTP production harness only: WebKit upgrades loopback assets to HTTPS.
  // Retain every other CSP directive; deployed headers/source remain untouched.
  await page.route("**/*",async route=>{
    const url=new URL(route.request().url());
    if(route.request().resourceType()!=="document" || url.protocol!=="http:" || url.hostname!=="127.0.0.1")return route.fallback();
    const response=await route.fetch(),headers=response.headers();
    if(headers["content-security-policy"])headers["content-security-policy"]=headers["content-security-policy"].split(";").filter(part=>part.trim()!=="upgrade-insecure-requests").join(";");
    await route.fulfill({response,headers});
  });
  const expected=(url:string,status:number)=>url.endsWith("/api/auth/me")&&status===401 || (info.title.includes("long history")&&status===503 || info.title.includes("old guest cookie")&&status===401)&&url.endsWith("/api/public/assistant/conversation");
  page.on("pageerror",error=>errors.push(error.message));
  page.on("response",response=>{if(response.status()>=400&&!expected(response.url(),response.status()))errors.push(`${response.status()} ${new URL(response.url()).pathname}`);});
  page.on("console",message=>{if(message.type()==="error"&&!expected(message.location().url,Number(message.text().match(/\b(4\d\d|5\d\d)\b/)?.[1])))errors.push(message.text());});
});
test.afterEach(async({page})=>{expect(faults.get(page)).toEqual([]);});

for (const locale of ["ar", "en"] as const) for (const theme of ["dark", "light"]) {
  test(`${locale}-${theme}: short phone keyboard leaves usable booking body and retains values`, async ({ page }, info) => {
    const copy = directBookingCopy[locale];
    await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
    const snapshot = { locale, revision: 1, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
      dialogue: { mode: "BOOKING", offerShown: false, consentAt: new Date().toISOString(), accountAccess: false }, turns: [] };
    await page.route("**/api/auth/me", route => route.fulfill({status:401,json:{error:{code:"AUTH_REQUIRED"}}}));
    await page.route("**/api/analytics/events", route => route.fulfill({status:202,json:{data:{accepted:true}}}));
    await page.route("**/api/public/assistant/conversation", route => {
      const body = route.request().method() === "POST" ? route.request().postDataJSON() : null;
      return route.fulfill({json:{data:body?.action === "booking_slots" ? fixtureBookingAvailability({date:body.date}) : snapshot}});
    });
    await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, {waitUntil:"networkidle"});
    const dialog=page.getByRole("dialog",{name:copy.dialogTitle,exact:true}), name=dialog.getByLabel(copy.name,{exact:true});
    await expect(dialog.getByRole("radio").first()).toBeVisible();
    await name.fill(locale === "ar" ? "اسم تجربة آيفون" : "iPhone retained input");
    const normal=(await dialog.boundingBox())!, width=page.viewportSize()!.width;
    expect(normal.x).toBeCloseTo(0,0);expect(normal.y).toBeCloseTo(0,0);
    expect(normal.width).toBeCloseTo(width,0); expect(normal.height).toBeCloseTo(page.viewportSize()!.height,0);
    await page.screenshot({path:`.playwright/plan40/soak-${info.project.name}-${locale}-${theme}-normal.png`});
    // Headless engines cannot summon an OS keyboard. Exercise the real viewport event/scroll path.
    await page.evaluate(()=>{Object.defineProperty(visualViewport!,"height",{configurable:true,value:320});Object.defineProperty(visualViewport!,"offsetTop",{configurable:true,value:44});visualViewport!.dispatchEvent(new Event("resize"));});
    await expect.poll(async()=>(await dialog.boundingBox())!.height).toBeLessThanOrEqual(321);
    await name.focus(); await name.scrollIntoViewIfNeeded();
    const body=dialog.locator(":scope > div").nth(1), bodyBox=(await body.boundingBox())!;
    await writeFile(`.playwright/plan40/soak-${info.project.name}-${locale}-${theme}-metrics.json`,JSON.stringify({engine:info.project.use.browserName,device:info.project.name,viewport:page.viewportSize(),normal,keyboardBody:bodyBox,keyboardDialog:await dialog.boundingBox(),physicalKeyboard:false},null,2));
    await page.screenshot({path:`.playwright/plan40/soak-${info.project.name}-${locale}-${theme}-keyboard.png`});
    expect.soft(bodyBox.height).toBeGreaterThanOrEqual(140);
    const focused=(await name.boundingBox())!;
    expect.soft(focused.y).toBeGreaterThanOrEqual(bodyBox.y-1); expect.soft(focused.y+focused.height).toBeLessThanOrEqual(bodyBox.y+bodyBox.height+1);
    const action=(await dialog.getByRole("button",{name:copy.confirm,exact:true}).boundingBox())!;
    expect.soft(action.y+action.height).toBeLessThanOrEqual(365);
    expect.soft(await name.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    expect.soft(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    const value=await name.inputValue(), viewport=page.viewportSize()!;
    await page.evaluate(()=>{delete (visualViewport as any).height;delete (visualViewport as any).offsetTop;visualViewport!.dispatchEvent(new Event("resize"));});
    await page.setViewportSize({width:viewport.height,height:viewport.width});
    await expect.poll(async()=>(await dialog.boundingBox())!.height).toBeLessThanOrEqual(viewport.width+1);
    for(let i=0;i<5;i++){
      await dialog.getByRole("button",{name:copy.closeForm,exact:true}).tap();await expect(dialog).not.toBeVisible();
      await page.getByRole("button",{name:copy.openForm,exact:true}).tap();await expect(name).toHaveValue(value);
    }
    await page.setViewportSize(viewport);
    await dialog.evaluate(element=>{
      const entries=[...element.querySelectorAll<HTMLElement>("*")].map(node=>[node,parseFloat(getComputedStyle(node).fontSize)] as const);
      for(const[node,size]of entries)node.style.fontSize=`${size*2}px`;
    });
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await page.screenshot({path:`.playwright/plan40/soak-${info.project.name}-${locale}-${theme}-text200.png`});
  });
}

for (const locale of ["ar", "en"] as const) test(`${locale}: long history quota offers explicit restart without losing an unsent draft`, async ({page})=>{
  const copy=conversationCopy[locale], text=locale==="ar"?"سؤالي التالي لم يرسل بعد":"My next unsent question";
  let restarts=0, sends=0;
  let snapshot={locale,revision:60,handoffState:"NONE",booking:null,draft:{},accountReady:false,humanOwned:false,submitted:false,messageLimitReached:true,
    dialogue:{mode:"INQUIRY",offerShown:false,consentAt:null,accountAccess:false},
    turns:Array.from({length:60},(_,i)=>({messageId:`synthetic-${i}`,recipient:"ASSISTANT",userText:`Synthetic question ${i}`,assistantText:"Synthetic office answer. ".repeat(180),status:"COMPLETED",createdAt:new Date(Date.now()-60000+i*100).toISOString()}))};
  await page.route("**/api/analytics/events",route=>route.fulfill({status:202,json:{data:{accepted:true}}}));
  await page.route("**/api/public/assistant/conversation",route=>{
    const body=route.request().method()==="POST"?route.request().postDataJSON():null;
    if(body?.action==="restart"){
      if(++restarts===1)return route.fulfill({status:503,json:{error:{code:"SERVICE_UNAVAILABLE"}}});
      snapshot={...snapshot,revision:0,messageLimitReached:false,turns:[]};
    }
    if(body?.action==="message"){
      sends++; snapshot={...snapshot,revision:1,turns:[{messageId:body.messageId,recipient:body.recipient,userText:body.message,assistantText:"Synthetic recovered reply",status:"COMPLETED",createdAt:new Date().toISOString()}]};
    }
    return route.fulfill({json:{data:snapshot}});
  });
  await page.goto(`${locale==="ar"?"/ar":""}/book-consultation`,{waitUntil:"networkidle"});
  const input=page.getByLabel(copy.message,{exact:true});await input.fill(text);
  await expect(page.getByText(copy.messageLimit,{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:copy.send,exact:true})).toBeDisabled();
  const restart=page.getByRole("button",{name:copy.newConversation,exact:true});
  await restart.tap();await expect(input).toHaveValue(text);expect(sends).toBe(0);
  await restart.tap();await expect(input).toHaveValue(text);await expect(restart).not.toBeVisible();
  await page.getByRole("button",{name:copy.send,exact:true}).tap();
  await expect(page.getByRole("log").getByText(text,{exact:true})).toHaveCount(1);expect(sends).toBe(1);
});

for(const locale of ["ar","en"] as const) for(const trigger of ["availability","explicit-booking"] as const)test(`${locale}: ${trigger} reopens full-screen form once, preserving entered details`,async({page},info)=>{
  const copy=conversationCopy[locale],direct=directBookingCopy[locale],question=trigger==="explicit-booking"?(locale==="ar"?"عايز احجز استشارة":"I want to book a consultation"):(locale==="ar"?"امتي الاوقات المتاحه":"What appointment times are available?");
  const writes:string[]=[];
  let snapshot={locale,revision:1,handoffState:"QUEUED",officeThreadStatus:"WAITING_STAFF",booking:null,draft:{},accountReady:false,humanOwned:false,submitted:false,
    dialogue:{mode:"BOOKING",offerShown:false,consentAt:new Date().toISOString(),accountAccess:false,bookingFormRequestId:undefined as string|undefined},
    turns:[] as Array<{messageId:string,userText:string,assistantText:string,status:string}>};
  await page.route("**/api/auth/me",route=>route.fulfill({status:401,json:{error:{code:"AUTH_REQUIRED"}}}));
  await page.route("**/api/analytics/events",route=>route.fulfill({status:202,json:{data:{accepted:true}}}));
  await page.route("**/api/public/assistant/conversation",route=>{
    const body=route.request().method()==="POST"?route.request().postDataJSON():null;
    if(body){
      writes.push(body.action);
      if(body.action==="booking_slots")return route.fulfill({json:{data:fixtureBookingAvailability({date:body.date})}});
      if(body.action==="message")snapshot={...snapshot,revision:snapshot.revision+1,dialogue:{...snapshot.dialogue,...(body.message===question?{bookingFormRequestId:body.messageId}:{})},turns:[...snapshot.turns,{messageId:body.messageId,userText:body.message,assistantText:direct.intro,status:"COMPLETED"}]};
    }
    return route.fulfill({json:{data:snapshot}});
  });
  await page.goto(`${locale==="ar"?"/ar":""}/book-consultation`,{waitUntil:"networkidle"});
  const dialog=page.getByRole("dialog",{name:direct.dialogTitle,exact:true}),name=dialog.getByLabel(direct.name,{exact:true});
  await expect(dialog).toBeVisible();await name.fill("Synthetic retained name");
  await dialog.getByRole("button",{name:direct.closeForm,exact:true}).tap();
  await page.getByLabel(copy.message,{exact:true}).fill(question);await page.getByRole("button",{name:copy.send,exact:true}).tap();
  await expect(dialog).toBeVisible();await expect(name).toHaveValue("Synthetic retained name");
  const bounds=(await dialog.boundingBox())!;expect(bounds.width).toBeCloseTo(page.viewportSize()!.width,0);expect(bounds.height).toBeCloseTo(page.viewportSize()!.height,0);
  await page.screenshot({path:`.playwright/plan40/direct-booking-${info.project.name}-${locale}-${trigger}.png`});
  await dialog.getByRole("button",{name:direct.closeForm,exact:true}).tap();
  const refresh=page.waitForResponse(response=>response.url().endsWith("/api/public/assistant/conversation")&&response.request().method()==="GET");
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));await refresh;await expect(dialog).not.toBeVisible();
  expect(writes).not.toContain("confirm_booking");expect(writes).not.toContain("request_callback");
});

for(const locale of ["ar","en"] as const)test(`${locale}: old guest cookie permits explicit anonymous restart without login or lost text`,async({page})=>{
  const copy=conversationCopy[locale],text=locale==="ar"?"سؤال تجريبي بعد الجلسة القديمة":"Synthetic question after an old session";
  let recovered=false,sends=0,restarts=0;
  let release!:()=>void;const denialGate=new Promise<void>(resolve=>{release=resolve;});
  let readStarted!:()=>void;const hydratedRead=new Promise<void>(resolve=>{readStarted=resolve;});
  const snapshot={locale,revision:0,handoffState:"NONE",booking:null,draft:{},accountReady:false,humanOwned:false,submitted:false,
    dialogue:{mode:"INQUIRY",offerShown:false,consentAt:null,accountAccess:false},turns:[] as Array<Record<string,unknown>>};
  await page.route("**/api/analytics/events",route=>route.fulfill({status:202,json:{data:{accepted:true}}}));
  await page.route("**/api/public/assistant/conversation",async route=>{
    const body=route.request().method()==="POST"?route.request().postDataJSON():null;
    if(body?.action==="restart"){recovered=true;restarts++;return route.fulfill({json:{data:snapshot}});}
    if(!recovered){readStarted();await denialGate;return route.fulfill({status:401,json:{error:{code:"AUTH_REQUIRED"}}});}
    if(body?.action==="message"){sends++;snapshot.turns=[{messageId:body.messageId,userText:body.message,assistantText:"Synthetic visitor reply",status:"COMPLETED"}];}
    return route.fulfill({json:{data:snapshot}});
  });
  await page.goto(`${locale==="ar"?"/ar":""}/book-consultation`,{waitUntil:"domcontentloaded"});
  await hydratedRead;const input=page.getByLabel(copy.message,{exact:true});try{await input.fill(text);}finally{release();}
  const restart=page.getByRole("button",{name:copy.newConversation,exact:true});await expect(restart).toBeVisible();
  await restart.tap();await expect(input).toHaveValue(text);expect(restarts).toBe(1);expect(sends).toBe(0);
  await page.getByRole("button",{name:copy.send,exact:true}).tap();
  await expect(page.getByRole("log").getByText("Synthetic visitor reply",{exact:true})).toBeVisible();expect(sends).toBe(1);
  await expect(page.getByRole("log").getByText(text,{exact:true})).toHaveCount(1);
});
