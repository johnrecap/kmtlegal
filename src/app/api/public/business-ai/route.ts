import { getAuthContextFromRequest,getIpAddress } from '@/server/auth/session-store';
import { shouldUseSecureCookie } from '@/server/auth/session';
import { ASSISTANT_COOKIE,assistantCapability,createAssistantSession,ownAssistantSession } from '@/server/consultations/conversation-session-service';
import { actOnFormation,formationActionSchema,readFormation } from '@/server/services/formation-service';
import { ApiError,jsonOk } from '@/server/http/errors';
import { phaseFiveErrorResponse } from '@/server/http/phase-five-errors';
import { parseJsonRequest } from '@/server/validation/schemas';
import { enforceRateLimit,rateLimiters } from '@/server/rate-limit/memory-rate-limit';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const token=assistantCapability(request);const auth=await getAuthContextFromRequest(request);return jsonOk(token?await readFormation(token,auth?.principal):null);}catch(error){return phaseFiveErrorResponse(error,request);}}
export async function POST(request:Request){try{
 const body=await parseJsonRequest(request,formationActionSchema);const auth=await getAuthContextFromRequest(request);
 await enforceRateLimit(body.action==='submit'?rateLimiters.booking:body.action==='report'?rateLimiters.ai:rateLimiters.conversation,'formation:'+(auth?.principal.id??getIpAddress(request)??'unknown'));
 let token=assistantCapability(request);let created=false;
 if(token&&body.action==='start'){try{await ownAssistantSession(token,auth?.principal);}catch(error){if(error instanceof ApiError&&error.code==='AUTH_REQUIRED')token=null;else throw error;}}
 if(!token&&body.action==='start'){token=await createAssistantSession(body.locale,auth?.principal,'company-formation');created=true;}
 if(!token)throw new ApiError(401,'AUTH_REQUIRED','Start an interview first.');
 await actOnFormation(token,auth?.principal,body);const response=jsonOk(await readFormation(token,auth?.principal));
 if(created)response.cookies.set(ASSISTANT_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:shouldUseSecureCookie(),path:'/',maxAge:7*86400});
 return response;
 }catch(error){return phaseFiveErrorResponse(error,request);}}
