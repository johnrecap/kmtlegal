import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import type { PublicLocale } from '@/lib/public-locale';
export const knowledgeQuerySchema=z.object({
 q:z.string().trim().max(120).default(''),type:z.enum(['','JUDGMENT','LEGISLATION']).default(''),topic:z.string().trim().max(80).default(''),reference:z.string().trim().max(120).default(''),year:z.string().regex(/^$|^(18|19|20|21)\d{2}$/).default(''),from:z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/).default(''),to:z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/).default('')
});
export function knowledgeWhere(locale:PublicLocale,input:unknown):Prisma.ArticleWhereInput {
 const v=knowledgeQuerySchema.parse(input);
 const validDate=(value:string)=>Boolean(value)&&Number.isFinite(new Date(value).getTime());
 return {locale,contentType:v.type||{in:['JUDGMENT','LEGISLATION']},status:'PUBLISHED',publishedAt:{not:null,lte:new Date()},reviewedAt:{not:null,lte:new Date()},reviewedById:{not:null},sourceUrl:{not:null},sourceTitle:{not:null},referenceNumber:v.reference?{contains:v.reference,mode:'insensitive'}:{not:null},referenceYear:v.year?Number(v.year):{not:null},
 ...(v.topic?{category:{contains:v.topic,mode:'insensitive'}}:{}),
 ...(v.q?{OR:[{title:{contains:v.q,mode:'insensitive'}},{excerpt:{contains:v.q,mode:'insensitive'}},{content:{contains:v.q,mode:'insensitive'}}]}:{}),
 referenceDate:{not:null,...(validDate(v.from)?{gte:new Date(v.from)}:{}),...(validDate(v.to)?{lte:new Date(v.to+'T23:59:59.999Z')}:{})}};
}
export async function listKnowledge(locale:PublicLocale,input:unknown={}) {
 if(!process.env.DATABASE_URL)return [];
 const {prisma}=await import('@/server/db/prisma');
 return prisma.article.findMany({where:knowledgeWhere(locale,input),orderBy:[{referenceDate:'desc'},{id:'asc'}],take:100,select:{id:true,slug:true,title:true,excerpt:true,contentType:true,category:true,referenceNumber:true,referenceYear:true,referenceDate:true,sourceTitle:true,sourceUrl:true,reviewedAt:true}});
}
export async function getKnowledge(locale:PublicLocale,slug:string) {
 if(!process.env.DATABASE_URL)return null;
 const {prisma}=await import('@/server/db/prisma');
 return prisma.article.findFirst({where:{...knowledgeWhere(locale,{}),slug}});
}
/** Reference material only; never enables legal-form recommendations on its own. */
export async function approvedBusinessReferences(locale:PublicLocale) {
 if(!process.env.DATABASE_URL)return [];
 const {prisma}=await import('@/server/db/prisma');
 return prisma.article.findMany({where:{aiApproved:true,OR:[knowledgeWhere(locale,{}),{locale,contentType:'ARTICLE',status:'PUBLISHED',publishedAt:{not:null,lte:new Date()},reviewedAt:{not:null,lte:new Date()},reviewedById:{not:null},sourceUrl:{not:null},sourceTitle:{not:null}}]},take:20,orderBy:{reviewedAt:'desc'},select:{title:true,excerpt:true,sourceUrl:true,sourceTitle:true,reviewedAt:true,referenceNumber:true}});
}
