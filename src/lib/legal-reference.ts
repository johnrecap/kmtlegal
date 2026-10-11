import { z } from 'zod';
export const referenceTypeSchema=z.enum(['ARTICLE','JUDGMENT','LEGISLATION']);
const optionalText=(max:number)=>z.string().trim().max(max).default('');
const date=z.string().trim().refine(value=>!value||(/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(new Date(value).getTime())&&new Date(value).toISOString().slice(0,10)===value),'Invalid date.').default('');
export const referenceFields={
 contentType:referenceTypeSchema.default('ARTICLE'),sourceTitle:optionalText(300),
 sourceUrl:z.string().trim().max(2000).refine(value=>!value||/^https:\/\//.test(value)&&URL.canParse(value),'Use an HTTPS source URL.').default(''),
 referenceNumber:optionalText(120),referenceYear:z.number().int().min(1800).max(2200).nullable().default(null),referenceDate:date,reviewedAt:date,
 aiApproved:z.boolean().default(false)
};
export function referenceReady(value:{contentType:string;sourceTitle:string;sourceUrl:string;referenceNumber:string;referenceYear:number|null;reviewedAt:string;referenceDate:string}) {
 return Boolean(value.sourceTitle&&value.sourceUrl&&value.reviewedAt&&(value.contentType==='ARTICLE'||value.referenceNumber&&value.referenceYear&&value.referenceDate));
}
