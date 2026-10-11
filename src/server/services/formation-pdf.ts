import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {PDFDocument,rgb,type PDFFont} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {formationDraftSchema,formationFieldKeys,formationReview} from '@/lib/business-formation';
import {formationCopy} from '@/content/business-formation-copy';
import type {PublicLocale} from '@/lib/public-locale';

/** Generates only the immutable client snapshot; no staff notes are accepted. */
export async function formationPdf(snapshot:unknown,version:number){
 const value=snapshot as {draft:unknown;locale:PublicLocale;assessment?:{questionKeys:(typeof formationFieldKeys)[number][];references:{title:string;sourceUrl:string|null;reviewedAt:string|null}[]}};const locale=value.locale==='en'?'en':'ar';const draft=formationDraftSchema.parse(value.draft),c=formationCopy[locale],review=formationReview(draft);
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);doc.setTitle(c.title);doc.setAuthor('KMT Legal');
 const fonts=await Promise.all(['arabic','latin'].map(async subset=>doc.embedFont(await readFile(path.join(process.cwd(),'public','fonts',`formation-${subset}.woff`)),{subset:true})));
 let page=doc.addPage([595.28,841.89]),y=792;
 const runs=(text:string)=>text.match(/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+(?:[\s\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]*[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff])?|[^\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+/gu)??[];
 const fontFor=(text:string):PDFFont=>/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u.test(text)?fonts[0]:fonts[1];
 const safe=(text:string)=>text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[\u202a-\u202e\u2066-\u2069]/g,'');
 const partsFor=(text:string)=>runs(text).map(run=>run.trim()).filter(Boolean);
 const width=(text:string,size:number)=>partsFor(text).reduce((n,run)=>n+fontFor(run).widthOfTextAtSize(run,size),0)+Math.max(0,partsFor(text).length-1)*fonts[1].widthOfTextAtSize(" ",size);
 function line(text:string,size:number){if(y<55){page=doc.addPage([595.28,841.89]);y=792;}const parts=partsFor(text);if(locale==='ar')parts.reverse();let x=locale==='ar'?545-width(text,size):50;for(const run of parts){const font=fontFor(run);page.drawText(run,{x,y,size,font,color:rgb(.08,.08,.08)});x+=font.widthOfTextAtSize(run,size)+fonts[1].widthOfTextAtSize(" ",size);}y-=size*1.8;}
 function paragraph(text:string,size=12){for(const part of safe(text).split('\n')){let current='';for(const word of part.split(/\s+/)){if(width(current+' '+word,size)>495&&current){line(current,size);current='';}if(width(word,size)>495){for(const char of word){if(width(current+char,size)>495){line(current,size);current='';}current+=char;}}else current+=(current?' ':'')+word;}if(current)line(current,size);}y-=6;}
 paragraph('KMT Legal · '+c.title,18);paragraph('v'+version);paragraph(c.disclaimer);
 for(const key of formationFieldKeys){paragraph(c.fields[key],14);const text=key==='founders'?draft.founders.map(f=>`${f.name} · ${f.nationality} · ${f.ownership??c.unknown}%`).join('\n'):key==='existingBusiness'?draft[key]==='NEW'?c.new:draft[key]==='EXISTING'?c.existing:c.unsure:key==='regulated'?draft[key]==='YES'?c.yes:draft[key]==='NO'?c.no:c.unsure:draft[key];paragraph(text||c.unknown);}
 paragraph(c.missing,14);for(const key of review.missing)paragraph(c.fields[key]);paragraph(c.flagsTitle,14);for(const flag of review.flags)paragraph(c.flags[flag as keyof typeof c.flags]);paragraph(c.nextSteps);
 if(value.assessment){paragraph(c.questions,14);for(const key of value.assessment.questionKeys)if(formationFieldKeys.includes(key))paragraph(c.fields[key]);if(value.assessment.references.length){paragraph(c.references,14);paragraph(c.referenceNote);for(const ref of value.assessment.references){paragraph(ref.title);paragraph(ref.sourceUrl??'');paragraph(ref.reviewedAt?.slice(0,10)??'');}}}
 return doc.save();
}
