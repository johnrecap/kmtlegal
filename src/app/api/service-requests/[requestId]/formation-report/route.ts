import {getAuthContextFromRequest} from '@/server/auth/session-store';
import {getServiceRequest} from '@/server/services/service-request-service';
import {formationPdf} from '@/server/services/formation-pdf';
import {prisma} from '@/server/db/prisma';
import {phaseFiveErrorResponse} from '@/server/http/phase-five-errors';
import {ApiError} from '@/server/http/errors';
import {parseWithSchema,uuidSchema} from '@/server/validation/schemas';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{requestId:string}>}){try{
 const id=parseWithSchema(uuidSchema,(await params).requestId);const auth=await getAuthContextFromRequest(request);if(!auth)throw new ApiError(401,'AUTH_REQUIRED','Authentication required.');
 await getServiceRequest(auth.principal,id);
 const report=await prisma.formationReport.findFirst({where:{interview:{serviceRequestId:id}},orderBy:{version:'desc'}});if(!report)throw new ApiError(404,'NOT_FOUND','Report not found.');
 return new Response(Buffer.from(await formationPdf(report.snapshot,report.version)),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="KMT-formation-v${report.version}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){return phaseFiveErrorResponse(error,request);}}
