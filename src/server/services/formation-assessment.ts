import {z} from 'zod';
import {formationFieldKeys,formationReview,type FormationDraft} from '@/lib/business-formation';
import {generateStructured} from '@/server/ai/gateway';
import {approvedBusinessReferences} from '@/server/public/knowledge-service';
import type {PublicLocale} from '@/lib/public-locale';
const schema=z.object({questionKeys:z.array(z.enum(formationFieldKeys)).max(9),reviewRequired:z.literal(true)}).strict();
/** The provider can prioritize questions only, never alter facts or select a legal form. */
export async function assessFormation(draft:FormationDraft,locale:PublicLocale,actorId?:string){
 const review=formationReview(draft);
 const references=await approvedBusinessReferences(locale).catch(()=>[]);
 try{
  const result=await generateStructured({task:'formation_review',locale,actorId,recordRun:true,schema,input:{instruction:'Identify fields needing clarification. Return field keys only. Do not suggest a legal form, infer facts, or provide legal advice.',draft:{...draft,founders:draft.founders.map(({nationality,ownership})=>({nationality,ownership}))},missing:review.missing,approvedReferences:references.map(({title,excerpt,sourceUrl,reviewedAt})=>({title,excerpt,sourceUrl,reviewedAt:reviewedAt?.toISOString()??null}))}});
  return {providerAvailable:result.provider!=='mock',questionKeys:[...new Set([...review.missing,...result.output.questionKeys])],references:references.map(r=>({...r,reviewedAt:r.reviewedAt?.toISOString()??null}))};
 }catch{return {providerAvailable:false,questionKeys:review.missing,references:references.map(r=>({...r,reviewedAt:r.reviewedAt?.toISOString()??null}))};}
}
