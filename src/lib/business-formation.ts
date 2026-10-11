import { z } from 'zod';
const text=(max:number)=>z.string().trim().max(max).default('');
export const formationDraftSchema=z.object({
 activity:text(2000),existingBusiness:z.enum(['NEW','EXISTING','UNSURE']).default('UNSURE'),
 founders:z.array(z.object({name:text(160),nationality:text(100),ownership:z.number().min(0).max(100).nullable().default(null)}).strict()).max(30).default([]),
 capital:text(200),management:text(1000),location:text(500),timing:text(300),regulated:z.enum(['YES','NO','UNSURE']).default('UNSURE'),notes:text(2000)
}).strict();
export type FormationDraft=z.infer<typeof formationDraftSchema>;
export const formationFieldKeys=['activity','existingBusiness','founders','capital','management','location','timing','regulated','notes'] as const;
export function formationReview(draft:FormationDraft) {
 const missing=formationFieldKeys.filter(key=>key!=='notes'&&(key==='founders'?!draft.founders.length||draft.founders.some(f=>!f.name||!f.nationality||f.ownership===null):key==='existingBusiness'||key==='regulated'?draft[key]==='UNSURE':!draft[key]));
 const flags:string[]=[];
 if(draft.founders.some(f=>f.nationality&&!/^(egypt|egyptian|مصر|مصري|مصرية)$/i.test(f.nationality)))flags.push('foreign');
 if(draft.regulated!=='NO')flags.push('regulated');
 if(draft.founders.length&&draft.founders.every(f=>f.ownership!==null)&&Math.abs(draft.founders.reduce((sum,f)=>sum+(f.ownership??0),0)-100)>0.01)flags.push('ownership');
 if(new Set(draft.founders.map(f=>f.name.toLowerCase()).filter(Boolean)).size<draft.founders.filter(f=>f.name).length)flags.push('duplicate');
 return {missing,flags,humanReviewRequired:true as const,legalOptionsEnabled:false as const};
}
