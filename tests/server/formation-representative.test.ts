import {expect,it} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {formationPdf} from '@/server/services/formation-pdf';
import {formationDraftSchema,formationReview} from '@/lib/business-formation';
it('preserves a sole-founder factual intake and renders both PDF languages without legal-form advice',async()=>{
 mkdirSync('.playwright/formation-samples',{recursive:true});
 const draft=formationDraftSchema.parse({activity:'تأسيس شركة لتطوير البرامج Software development',founders:[{name:'عميل تجريبي',nationality:'مصر',ownership:100}],existingBusiness:'NEW',capital:'100000 EGP',management:'المؤسس يدير المشروع',location:'القاهرة',timing:'خلال ثلاثة أشهر',regulated:'UNSURE'});
 expect(formationReview(draft).legalOptionsEnabled).toBe(false);
 for(const locale of ['ar','en'] as const){const bytes=await formationPdf({draft,locale},1);const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(0);expect(pdf.getAuthor()).toBe('KMT Legal');writeFileSync(`.playwright/formation-samples/formation-sample-${locale}.pdf`,bytes);}
});
