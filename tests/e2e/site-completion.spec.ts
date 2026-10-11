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

test('public repair keeps dropdowns reachable and the service search usable', async ({page}) => {
 test.setTimeout(240000);
 for (const [path, label, child] of [['/services','Expertise','Explore practices'],['/ar/services','مجالات الخبرة','استعرض التخصصات']] as const) {
  for (const width of [1280,1920]) {
   await page.setViewportSize({width,height:900});
   await page.emulateMedia({reducedMotion:width===1280?'reduce':'no-preference'});
   await page.goto(path,{waitUntil:'networkidle'});
   await expect(page.getByTestId('public-header')).toHaveCount(1);
   const trigger=page.getByRole('button',{name:label,exact:true});
   const target=page.getByRole('link',{name:child,exact:true});
   await trigger.click();await expect(target).toBeVisible();
   const from=await trigger.boundingBox(),to=await target.boundingBox();
   expect(from).toBeTruthy();expect(to).toBeTruthy();
   for(let step=1;step<=6;step++){await page.mouse.move(from!.x+from!.width/2+(to!.x+to!.width/2-from!.x-from!.width/2)*step/6,from!.y+from!.height/2+(to!.y+to!.height/2-from!.y-from!.height/2)*step/6,{steps:2});await expect(trigger).toHaveAttribute('aria-expanded','true');}
   await page.waitForTimeout(180);await expect(target).toBeVisible();
   await target.click();await expect(page).toHaveURL(path);
   await trigger.click();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(trigger).toHaveAttribute('aria-expanded','false');
   await page.evaluate(()=>window.scrollTo(0,650));await page.waitForTimeout(250);await page.evaluate(()=>window.scrollTo(0,620));await page.waitForTimeout(250);
   await trigger.click();const before=await trigger.boundingBox();await page.waitForTimeout(250);const after=await trigger.boundingBox();expect(Math.abs(before!.x-after!.x)+Math.abs(before!.y-after!.y)).toBeLessThan(3);await expect(target).toBeVisible();
  }
 }
 await page.setViewportSize({width:1280,height:900});await page.goto('/services',{waitUntil:'networkidle'});
 const filter=page.getByTestId('public-directory-filter'),input=filter.getByRole('textbox'),select=filter.getByRole('combobox');
 expect((await input.boundingBox())!.width).toBeGreaterThan(280);
 await expect(select.locator('option')).toHaveCount(19);
 await input.fill('zzzz-no-practice');await expect(page.getByText('No matching services',{exact:true})).toBeVisible();
 await filter.getByRole('button',{name:'Clear Filters',exact:true}).click();await expect(input).toHaveValue('');
 for(const path of ['/services','/team','/contact','/services/claims-collections','/ar/services','/ar/team','/ar/contact','/ar/services/claims-collections']){const response=await page.request.get(path);expect(response.status(),path).toBe(200);const html=await response.text();expect(html,path).toContain('kmt-official-logo-');expect(html,path).toContain('name="kmt-release"');}
});

test('public account, login, payment and fallback pages share one current header', async ({page}) => {
 test.setTimeout(120000);
 for(const path of ['/login?next=%2Fclient%2Frequests&reason=expired&locale=en','/client-account/setup','/payment/consultation/return','/account/verify#token='+ 'a'.repeat(64) +'&locale=ar','/page-that-does-not-exist-kmt']){
  await page.goto(path,{waitUntil:'networkidle'});
  await expect(page.getByTestId('public-header'),path).toHaveCount(1);
  await expect(page.getByRole('main'),path).toHaveCount(1);
  await expect(page.getByTestId('public-header').locator('img[src*="kmt-official-logo-"]'),path).toHaveCount(2);
  if(path.startsWith('/login')){
   const href=await page.getByTestId('public-language-switch').first().getAttribute('href');const url=new URL(href!,'http://localhost');
   expect(url.searchParams.get('next')).toBe('/client/requests');expect(url.searchParams.get('reason')).toBe('expired');expect(url.searchParams.get('locale')).toBe('ar');
  }
  if(path.startsWith('/account/verify')){
   await expect(page.locator('html')).toHaveAttribute('dir','rtl');
   expect(await page.getByTestId('public-language-switch').first().getAttribute('href')).toContain('token='+ 'a'.repeat(64));
  }
 }
});

test('repaired public shell fits Arabic and English from phone to wide desktop', async ({page}) => {
 test.setTimeout(240000);
 await page.goto('/',{waitUntil:'domcontentloaded'});
 for(const locale of ['en','ar'] as const)for(const theme of ['light','dark'])for(const width of [360,768,1024,1280,1920]){
  await page.setViewportSize({width,height:900});await page.evaluate(t=>localStorage.setItem('kmt-theme',t),theme);
  for(const route of ['/services','/contact']){
   await page.goto((locale==='ar'?'/ar':'')+route,{waitUntil:'networkidle'});
   await expect(page.getByTestId('public-header')).toHaveCount(1);
   await expect(page.getByRole('main')).toHaveCount(1);
   if(route==='/contact')await expect(page.getByTestId('public-floating-dock')).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${locale} ${theme} ${width} ${route}`).toBe(true);
   if(route==='/services'){
    const box=await page.getByTestId('public-directory-filter').getByRole('textbox').boundingBox();
    expect(box!.width,`${locale} ${theme} ${width} search`).toBeGreaterThan(width<768?220:280);
   }
  }
 }
 await page.setViewportSize({width:360,height:780});await page.goto('/ar/services',{waitUntil:'networkidle'});
 const open=page.getByRole('button',{name:'التنقل المختصر',exact:true});await open.click();
 const group=page.getByRole('button',{name:'مجالات الخبرة',exact:true});await group.click();
 await expect(page.getByRole('link',{name:'استعرض التخصصات',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'إغلاق القائمة',exact:true}).click();await expect(open).toBeFocused();
});

test('every desktop dropdown retains first and last links through mouse and keyboard travel', async ({page}) => {
 test.setTimeout(180000);await page.setViewportSize({width:1440,height:900});
 for(const locale of ['en','ar'] as const){
  const prefix=locale==='ar'?'/ar':'';
  const groups=locale==='ar'?
   [{name:'عن المكتب',first:'/our-firm',last:'/careers'},{name:'مجالات الخبرة',first:'/services',last:'/how-can-we-help'},{name:'خدمات الشركات',first:'/corporate-services',last:'/business-ai'},{name:'المعرفة',first:'/articles',last:'/legal-intelligence'}]:
   [{name:'Our firm',first:'/our-firm',last:'/careers'},{name:'Expertise',first:'/services',last:'/how-can-we-help'},{name:'Corporate services',first:'/corporate-services',last:'/business-ai'},{name:'Knowledge',first:'/articles',last:'/legal-intelligence'}];
  await page.goto(prefix||'/',{waitUntil:'networkidle'});
  for(const group of groups){
   const header=page.getByTestId('public-header'),trigger=header.getByRole('button',{name:group.name,exact:true});
   for(const destination of [group.first,group.last]){
    await trigger.click();const link=header.locator(`a[href="${prefix+destination}"]`).first();await expect(link).toBeVisible();
    const from=await trigger.boundingBox(),to=await link.boundingBox();expect(from).toBeTruthy();expect(to).toBeTruthy();
    await page.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2);
    await page.mouse.move(to!.x+to!.width/2,to!.y+to!.height/2,{steps:12});
    await page.waitForTimeout(120);await expect(trigger).toHaveAttribute('aria-expanded','true');await link.click();
    await expect(page).toHaveURL(prefix+destination);
   }
   await trigger.click();await page.keyboard.press('Tab');await expect(header.locator(`a[href="${prefix+group.first}"]`).first()).toBeFocused();
   await page.keyboard.press('Shift+Tab');await expect(trigger).toBeFocused();
   await page.keyboard.press('Escape');await expect(trigger).toHaveAttribute('aria-expanded','false');
  }
 }
});

test('desktop menus close on explicit actions and mobile groups close after navigation', async ({page}) => {
 test.setTimeout(120000);await page.setViewportSize({width:1440,height:900});await page.goto('/',{waitUntil:'networkidle'});
 const header=page.getByTestId('public-header'),firm=header.getByRole('button',{name:'Our firm',exact:true}),expertise=header.getByRole('button',{name:'Expertise',exact:true});
 await firm.click();await expect(firm).toHaveAttribute('aria-expanded','true');
 await firm.click();await expect(firm).toHaveAttribute('aria-expanded','false');
 await firm.click();await expertise.click();await expect(firm).toHaveAttribute('aria-expanded','false');await expect(expertise).toHaveAttribute('aria-expanded','true');
 await page.getByRole('heading',{level:1}).click();await expect(expertise).toHaveAttribute('aria-expanded','false');
 await firm.focus();await page.keyboard.press('Enter');await expect(firm).toHaveAttribute('aria-expanded','true');
 await header.getByRole('link',{name:'Request a Consultation',exact:true}).focus();await expect(firm).toHaveAttribute('aria-expanded','false');
 await page.setViewportSize({width:390,height:780});await page.goto('/ar/services',{waitUntil:'networkidle'});
 const open=page.getByRole('button',{name:'التنقل المختصر',exact:true});await open.click();
 const group=page.getByRole('button',{name:'مجالات الخبرة',exact:true});await group.click();
 await page.getByRole('link',{name:'كيف يمكننا مساعدتك؟',exact:true}).click();
 await expect(page).toHaveURL('/ar/how-can-we-help');await expect(open).toHaveAttribute('aria-expanded','false');
});
