import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {publicServiceSlugs,contentHubSlugs} from '../../src/content/public-service-registry';
import {formationCopy} from '../../src/content/business-formation-copy';
test.describe.configure({mode:'serial'});
test.skip(process.env.RUN_SITE_COMPLETION_FIXTURES!=='true','Requires isolated synthetic database.');
const fixtures=()=>JSON.parse(readFileSync('.playwright/phase-five/fixtures.json','utf8')) as {users:Record<string,{id:string;token:string}>};
test('public bilingual route inventory, aliases, layout, navigation and branding',async({page,baseURL})=>{
 test.setTimeout(1200000);if(new URL(baseURL!).hostname!=='127.0.0.1')throw Error('Local only');await page.goto('/',{waitUntil:'networkidle'});
 for(const locale of ['en','ar']){
  const prefix=locale==='ar'?'/ar':'';
  for(const route of ['/','/our-firm','/services','/industries','/team','/contact',...contentHubSlugs.map(s=>'/'+s),...publicServiceSlugs.map(s=>'/services/'+s)]){
   const response=await page.request.get(prefix+(route==='/'?'':route));expect(response.status(),prefix+route).toBe(200);const html=await response.text();expect(html).toContain('rel="canonical"');expect(html).not.toContain('Maryam Khaled');
  }
  for(const [from,to]of [['about','our-firm'],['insights','articles'],['services/criminal-defense','services/criminal-law']]){const response=await page.request.get(prefix+'/'+from,{maxRedirects:0});expect([307,308]).toContain(response.status());expect(response.headers().location).toContain(prefix+'/'+to);}
  for(const theme of ['light','dark'])for(const width of [390,768,1440]){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>localStorage.setItem('kmt-theme',t),theme);await page.emulateMedia({reducedMotion:'reduce'});
   for(const route of ['/','/services','/services/corporate-business-services','/our-firm','/industries','/contact','/corporate-services','/how-can-we-help','/business-ai','/legal-intelligence']){
    await page.goto(prefix+(route==='/'?'':route),{waitUntil:'networkidle'});await expect(page.locator('html')).toHaveClass(new RegExp(theme));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${prefix}${route} ${width} ${theme}`).toBe(true);await expect(page.locator('h1')).toHaveCount(1);if(route==='/business-ai')await expect(page.getByRole('button',{name:formationCopy[locale as 'en'|'ar'].start,exact:true})).toBeVisible({timeout:20000});
    if(['/','/services/corporate-business-services','/business-ai'].includes(route))await page.screenshot({path:`.playwright/site-completion/${locale}-${theme}-${width}-${route==='/'?'home':route.split('/').at(-1)}.png`,fullPage:true});
   }
  }
 }
 await page.setViewportSize({width:1440,height:900});await page.goto('/',{waitUntil:'networkidle'});const trigger=page.getByRole('button',{name:'Our firm',exact:true});await trigger.focus();await page.keyboard.press('Enter');await expect(page.getByRole('link',{name:'Careers',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');
});
test('formation interview saves, resumes, generates private PDF, submits once and isolates internal notes',async({page,browser,baseURL})=>{
 test.setTimeout(480000);const users=fixtures().users,c=formationCopy.en;
 await page.goto('/business-ai',{waitUntil:'networkidle'});await page.getByLabel(c.consent,{exact:true}).check();await page.getByRole('button',{name:c.start,exact:true}).click();await expect(page.getByLabel(c.fields.activity,{exact:true})).toBeVisible();
 await page.getByLabel(c.fields.activity,{exact:true}).fill('Synthetic company for software development');await page.getByRole('button',{name:c.next,exact:true}).click();await expect(page.getByLabel(c.fields.existingBusiness,{exact:true})).toBeVisible();await page.reload({waitUntil:'networkidle'});await expect(page.getByLabel(c.fields.activity,{exact:true})).toHaveValue('Synthetic company for software development');
 // Fill remaining fields through the same authenticated session API; UI above proves save/resume.
 let row=(await (await page.request.get('/api/public/business-ai')).json()).data;
 const post=async(data:unknown)=>page.request.post('/api/public/business-ai',{headers:{Origin:baseURL!},data});
 let response=await post({action:'save',revision:row.revision,draft:{...row.draft,existingBusiness:'NEW',founders:[{name:'Synthetic founder',nationality:'France',ownership:70},{name:'Second founder',nationality:'Egypt',ownership:20}],capital:'100000 EGP',management:'Founders',location:'Cairo',timing:'Three months',regulated:'YES'}});expect(response.status()).toBe(200);row=(await response.json()).data;
 response=await post({action:'report',revision:row.revision});expect(response.status()).toBe(200);row=(await response.json()).data;expect(row.reports[0].snapshot.review.flags).toEqual(expect.arrayContaining(['foreign','regulated','ownership']));
 const pdf=await page.request.get('/api/public/business-ai/report?version='+row.revision);expect(pdf.status()).toBe(200);expect(pdf.headers()['cache-control']).toContain('no-store');expect((await pdf.body()).subarray(0,4).toString()).toBe('%PDF');
 expect((await post({action:'submit',revision:row.revision,confirmed:true})).status()).toBe(401);
 await page.context().addCookies([{name:'kmt_session',value:users.en.token,url:baseURL!}]);response=await post({action:'submit',revision:row.revision,confirmed:true});expect(response.status()).toBe(200);const id=(await response.json()).data.serviceRequestId;expect(id).toBeTruthy();expect((await (await post({action:'submit',revision:row.revision,confirmed:true})).json()).data.serviceRequestId).toBe(id);
 const staff=await browser.newContext({baseURL,extraHTTPHeaders:{Origin:baseURL!}});await staff.addCookies([{name:'kmt_session',value:users.admin.token,url:baseURL!}]);let record=(await (await staff.request.get('/api/service-requests/'+id)).json()).data;
 expect((await staff.request.post('/api/service-requests/'+id,{data:{action:'message',revision:record.revision,body:'Synthetic internal-only formation note',internal:true}})).status()).toBe(200);
 record=(await (await page.request.get('/api/service-requests/'+id)).json()).data;expect(JSON.stringify(record)).not.toContain('internal-only');expect((await page.request.get('/api/service-requests/'+id+'/formation-report')).status()).toBe(200);
 for(const action of [{action:'assign',lawyerId:users.lawyer.id},{action:'transition',status:'NEEDS_INFORMATION',body:'Please clarify the ownership shares.'},{action:'quote',quote:{amount:'1000',currency:'EGP',scope:'Synthetic formation review scope only',durationDays:10}}]){record=(await (await staff.request.get('/api/service-requests/'+id)).json()).data;expect((await staff.request.post('/api/service-requests/'+id,{data:{...action,revision:record.revision}})).status()).toBe(200);}
 record=(await (await page.request.get('/api/service-requests/'+id)).json()).data;expect(record.status).toBe('AWAITING_ACCEPTANCE');expect(record.paymentId).toBeNull();
 const other=await browser.newContext({baseURL});await other.addCookies([{name:'kmt_session',value:users.other.token,url:baseURL!}]);expect((await other.request.get('/api/service-requests/'+id+'/formation-report')).status()).toBe(404);
 const guest=await browser.newContext({baseURL});expect((await guest.request.get('/api/public/business-ai/report?version='+row.revision)).status()).toBe(401);
 await page.goto('/client/requests/services/'+id,{waitUntil:'networkidle'});if(process.env.SITE_COMPLETION_EXPECT_LAUNCH_GATE==='true'){await expect(page.locator('main')).toContainText('APP_ORIGIN_HTTPS_REQUIRED');}else{await expect(page.locator('main')).toContainText('Synthetic company');}await page.screenshot({path:'.playwright/site-completion/formation-client.png',fullPage:true});await other.close();await guest.close();await staff.close();
});
test('sourced reference publication and public article separation',async({browser,baseURL})=>{
 test.setTimeout(300000);const users=fixtures().users;const staff=await browser.newContext({baseURL,extraHTTPHeaders:{Origin:baseURL!}});await staff.addCookies([{name:'kmt_session',value:users.admin.token,url:baseURL!}]);
 const suffix=Date.now().toString();const body={title:'Synthetic reference '+suffix,slug:'synthetic-formation-reference-'+suffix,locale:'en',excerpt:'Synthetic source reference for isolated tests only.',content:'This synthetic text verifies source metadata and publication routing. It is not a real judgment.',category:'corporate',contentType:'JUDGMENT',status:'PUBLISHED',publishedAt:'2026-01-01',sourceTitle:'Synthetic test source',sourceUrl:'https://example.invalid/synthetic',referenceNumber:'SYN-'+suffix,referenceYear:2026,referenceDate:'2026-01-01',reviewedAt:'2026-01-02',aiApproved:true};
 const denied=await staff.request.post('/api/admin/content/articles',{data:{...body,sourceUrl:''}});expect(denied.status()).toBe(400);
 const response=await staff.request.post('/api/admin/content/articles',{data:body});expect(response.status()).toBe(201);
 const page=await staff.newPage();await page.goto('/legal-intelligence?reference='+body.referenceNumber,{waitUntil:'networkidle'});await expect(page.getByRole('link',{name:body.title})).toBeVisible();await page.getByRole('link',{name:body.title}).click();await page.waitForURL('**/legal-intelligence/'+body.slug,{timeout:30000});await expect(page.getByRole('link',{name:/Synthetic test source/})).toHaveAttribute('href',body.sourceUrl,{timeout:30000});
 await page.goto('/articles',{waitUntil:'networkidle'});await expect(page.getByRole('link',{name:body.title})).toHaveCount(0);await staff.close();
});

test('selected practice survives an existing session and callback persistence',async({page,baseURL})=>{
 test.setTimeout(180000);const api='/api/public/assistant/conversation';const post=(data:unknown)=>page.request.post(api,{headers:{Origin:baseURL!},data});
 expect((await post({action:'start',locale:'en',service:'contracts'})).status()).toBe(200);
 await page.goto('/book-consultation?service=criminal-law',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Start a consultation request',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible({timeout:30000});
 const state=(await (await page.request.get(api)).json()).data;expect(state.draft.service).toBe('criminal-law');
 const response=await post({action:'request_callback',key:crypto.randomUUID(),revision:state.revision,confirmed:true,fullName:'Synthetic practice client',phone:'01011119999',contactChannel:'PHONE'});expect(response.status()).toBe(200);const booking=(await response.json()).data.booking;expect(booking.serviceCategory).toBe('legal-consultation');
 const {Client}=await import('pg');const f=JSON.parse(readFileSync('.playwright/phase-five/fixtures.json','utf8'));if(new URL(f.databaseUrl).hostname!=='127.0.0.1')throw Error('Local fixture only');const db=new Client({connectionString:f.databaseUrl});await db.connect();try{expect((await db.query('SELECT marker FROM phase_five_fixture_marker')).rows[0].marker).toBe('synthetic-memory-only');const row=(await db.query('SELECT "publicServiceSlug","serviceCategory","confirmationSource" FROM consultation_requests WHERE "publicReference"=$1',[booking.publicReference])).rows[0];expect(row).toEqual({publicServiceSlug:'criminal-law',serviceCategory:'legal-consultation',confirmationSource:'CALLBACK_REQUEST'});}finally{await db.end();}
});

test('mobile grouped navigation, source cache boundaries and nonduplicated page analytics',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:390,height:900});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const views:unknown[]=[];page.on('request',r=>{if(r.url().endsWith('/api/analytics/events')){views.push(r.url());}});
 for(const locale of ['en','ar']){await page.goto(locale==='ar'?'/ar':'/',{waitUntil:'networkidle'});const open=page.getByRole('button',{name:locale==='ar'?'التنقل المختصر':'Compact navigation',exact:true});await open.click();const group=page.getByRole('button',{name:locale==='ar'?'عن المكتب':'Our firm',exact:true});await group.click();await expect(group).toHaveAttribute('aria-expanded','true');await expect(page.getByRole('link',{name:locale==='ar'?'الوظائف':'Careers',exact:true})).toBeVisible();await page.getByRole('button',{name:locale==='ar'?'إغلاق القائمة':'Close navigation',exact:true}).click();await expect(open).toBeFocused();}
 expect(views).toHaveLength(2);expect(errors).toEqual([]);
 for(const path of ['/business-ai','/ar/business-ai','/legal-intelligence','/ar/legal-intelligence'])expect((await page.request.get(path)).headers()['cache-control'],path).toContain('no-store');
});
