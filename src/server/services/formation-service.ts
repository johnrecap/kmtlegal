import {assessFormation} from "./formation-assessment";
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/server/db/prisma';
import { ownAssistantSession } from '@/server/consultations/conversation-session-service';
import type { Principal } from '@/server/auth/policy';
import { ApiError } from '@/server/http/errors';
import { formationDraftSchema,formationReview } from '@/lib/business-formation';
import { formationCopy } from '@/content/business-formation-copy';
import { assertActiveServiceClient,intakeSchema } from './service-request-service';
import { appendAuditLog } from '@/server/audit/audit-service';

export const formationActionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('start'),locale:z.enum(['ar','en']),consent:z.literal(true)}).strict(),
 z.object({action:z.literal('save'),revision:z.number().int().nonnegative(),draft:formationDraftSchema}).strict(),
 z.object({action:z.literal('report'),revision:z.number().int().nonnegative()}).strict(),
 z.object({action:z.literal('submit'),revision:z.number().int().nonnegative(),confirmed:z.literal(true)}).strict()
]);
function conflict(){return new ApiError(409,'CONFLICT','Refresh the interview before continuing.');}
export async function readFormation(token:string,actor?:Principal|null){
 const session=await ownAssistantSession(token,actor);
 const row=await prisma.formationInterview.findUnique({where:{sessionId:session.id},include:{reports:{orderBy:{version:'desc'},take:1}}});
 return row;
}
export async function actOnFormation(token:string,actor:Principal|null|undefined,input:z.infer<typeof formationActionSchema>){
 const session=await ownAssistantSession(token,actor);
 if(input.action==='start')return prisma.formationInterview.upsert({where:{sessionId:session.id},update:{},create:{sessionId:session.id,locale:input.locale,consentAt:new Date(),draft:formationDraftSchema.parse({})}});
 const serviceClient=input.action==='submit'&&actor?await assertActiveServiceClient(actor):null;
 if(input.action==='submit'&&!serviceClient)throw new ApiError(401,'AUTH_REQUIRED','An active client account is required.');
 let assessment:Awaited<ReturnType<typeof assessFormation>>|null=null;
 if(input.action==='report'){const saved=await prisma.formationInterview.findUnique({where:{sessionId:session.id},include:{reports:{where:{version:input.revision}}}});if(!saved||saved.revision!==input.revision)throw conflict();if(!saved.reports.length)assessment=await assessFormation(formationDraftSchema.parse(saved.draft),saved.locale==='en'?'en':'ar',actor?.id);}
 return prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT "id" FROM "assistant_sessions" WHERE "id"=${session.id}::uuid FOR UPDATE`;
  const currentSession=await tx.assistantSession.findUnique({where:{id:session.id}});
  if(!currentSession||currentSession.expiresAt<=new Date()||(currentSession.clientId&&currentSession.clientId!==actor?.clientId))throw new ApiError(401,'AUTH_REQUIRED','Session unavailable.');
  const row=await tx.formationInterview.findUnique({where:{sessionId:session.id}});if(!row)throw new ApiError(404,'NOT_FOUND','Interview not found.');
  // A retried submit returns the same request without creating another invoice or thread.
  if(row.serviceRequestId){if(input.action==='submit')return row;throw conflict();}
  if(row.revision!==input.revision)throw conflict();
  if(input.action==='save')return tx.formationInterview.update({where:{id:row.id},data:{draft:input.draft,revision:{increment:1}}});
  const draft=formationDraftSchema.parse(row.draft);const review=formationReview(draft);
  if(input.action==='report'){
   await tx.formationReport.upsert({where:{interviewId_version:{interviewId:row.id,version:row.revision}},update:{},create:{interviewId:row.id,version:row.revision,snapshot:{draft,review,assessment,locale:row.locale,consentAt:row.consentAt.toISOString()}}});return row;
  }
  if(draft.activity.length<10)throw new ApiError(400,'VALIDATION_ERROR','Describe the proposed activity.');
  const report=await tx.formationReport.findUnique({where:{interviewId_version:{interviewId:row.id,version:row.revision}}});if(!report)throw conflict();
  const c=formationCopy[row.locale==='en'?'en':'ar'];
  const thread=await tx.conversationThread.create({data:{clientId:serviceClient!.id,subject:c.title,status:'WAITING_STAFF'}});
  const request=await tx.serviceRequest.create({data:{clientId:serviceClient!.id,kind:'COMPANY_FORMATION',locale:row.locale,reference:'FORMATION-'+randomUUID().replaceAll('-','').toUpperCase(),idempotencyKey:row.id,status:'RECEIVED',conversationThreadId:thread.id,intake:{...intakeSchema.parse({title:c.title,purpose:draft.activity,language:row.locale}),formation:draft}}});
  await tx.assistantSession.update({where:{id:session.id},data:{clientId:serviceClient!.id}});
  await tx.serviceRequestEvent.create({data:{requestId:request.id,actorId:actor!.id,action:'submit',internal:false}});
  await appendAuditLog({client:tx,actorId:actor!.id,action:'formation.submit',resourceType:'ServiceRequest',resourceId:request.id,clientId:serviceClient!.id,metadata:{reportVersion:row.revision}});
  return tx.formationInterview.update({where:{id:row.id},data:{serviceRequestId:request.id}});
 });
}
