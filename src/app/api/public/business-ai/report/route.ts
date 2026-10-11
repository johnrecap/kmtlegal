import {assistantCapability} from '@/server/consultations/conversation-session-service';
import {getAuthContextFromRequest} from '@/server/auth/session-store';
import {readFormation} from '@/server/services/formation-service';
import {formationPdf} from '@/server/services/formation-pdf';
import {phaseFiveErrorResponse} from '@/server/http/phase-five-errors';
import {ApiError} from '@/server/http/errors';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const token=assistantCapability(request);if(!token)throw new ApiError(401,'AUTH_REQUIRED','Authentication required.');const auth=await getAuthContextFromRequest(request);const row=await readFormation(token,auth?.principal);const version=Number(new URL(request.url).searchParams.get('version'));const report=row?.reports.find(r=>r.version===version);if(!report)throw new ApiError(404,'NOT_FOUND','Report not found.');return new Response(Buffer.from(await formationPdf(report.snapshot,report.version)),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="KMT-formation-v${report.version}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(error){return phaseFiveErrorResponse(error,request);}}
