import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {practiceDefinitions,practiceServices} from '@/content/practice-content';
import {publicHub} from '@/content/public-hubs';
import {publicServiceSlugs} from '@/content/public-service-registry';
import {z} from 'zod';
import {referenceFields,referenceReady} from '@/lib/legal-reference';
import {knowledgeWhere} from '@/server/public/knowledge-service';
const source=JSON.parse(readFileSync('tests/fixtures/site-completion/source-practices.json','utf8')) as {page:number;englishServices:string[]}[];
const normalize=(v:string)=>v.replace('Old and New Tenancy Matters','TenancyDisputes').toLowerCase().replace(/[^a-z0-9]/g,'');
it('covers every original practice subservice in order with bilingual parity',()=>{
 expect(practiceDefinitions).toHaveLength(18);
 for(const p of practiceDefinitions){expect(p.services.en.split('|').map(normalize),p.slug).toEqual(source.find(v=>v.page===p.page)!.englishServices.map(normalize));expect(p.services.ar.split('|').length,p.slug).toBe(p.services.en.split('|').length);for(const locale of ['ar','en'] as const){const service=practiceServices(locale).find(s=>s.slug===p.slug)!;expect(service.requiredDocuments.length).toBeGreaterThan(0);expect(service.audience.length).toBeGreaterThan(0);expect(service.steps).toHaveLength(3);}}
});
it('maps all twelve daily service intents to real canonical service pages',()=>{for(const locale of ['ar','en'] as const){const hub=publicHub('how-can-we-help',locale);for(const section of hub.sections)expect(publicServiceSlugs).toContain(section.href);for(const slug of ['contracts','claims-collections','civil-law','real-estate-legal-support','family-personal-status','compensation-insurance','corporate-business-services','company-formation','criminal-law','litigation-appeals'])expect(hub.sections.some(s=>s.href===slug)).toBe(true);}});
it('requires source/review/reference metadata and rejects unsafe URLs and impossible dates',()=>{const schema=z.object(referenceFields);expect(schema.parse({}).aiApproved).toBe(false);for(const sourceUrl of ['javascript:alert(1)','http://example.com'])expect(schema.safeParse({sourceUrl}).success).toBe(false);expect(schema.safeParse({reviewedAt:'2026-02-31'}).success).toBe(false);const v=schema.parse({contentType:'JUDGMENT',sourceTitle:'Official source',sourceUrl:'https://example.invalid/ref',reviewedAt:'2026-01-01'});expect(referenceReady(v)).toBe(false);expect(referenceReady({...v,referenceNumber:'1',referenceYear:2026,referenceDate:'2026-01-01'})).toBe(true);});
it('search remains scoped to published reviewed reference content',()=>{expect(knowledgeWhere('ar',{type:'LEGISLATION',reference:'123',year:'2026',topic:'corporate'})).toMatchObject({locale:'ar',contentType:'LEGISLATION',status:'PUBLISHED',reviewedById:{not:null},sourceUrl:{not:null},referenceYear:2026,referenceNumber:{contains:'123',mode:'insensitive'}});});
