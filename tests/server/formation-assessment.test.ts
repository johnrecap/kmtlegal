import {expect,it,vi} from 'vitest';
import {formationDraftSchema} from '@/lib/business-formation';
const gateway=vi.hoisted(()=>vi.fn());
vi.mock('@/server/ai/gateway',()=>({generateStructured:gateway}));
vi.mock('@/server/public/knowledge-service',()=>({approvedBusinessReferences:async()=>[]}));
import {assessFormation} from '@/server/services/formation-assessment';
it('provider outage leaves the manual facts and missing questions available',async()=>{gateway.mockRejectedValue(Error('offline'));const result=await assessFormation(formationDraftSchema.parse({activity:'Software'}),'ar');expect(result.providerAvailable).toBe(false);expect(result.questionKeys).toContain('founders');expect(result.references).toEqual([]);});
it('does not send founder names and merges the mandatory missing questions',async()=>{gateway.mockResolvedValue({provider:'openrouter',output:{questionKeys:['activity']}});const result=await assessFormation(formationDraftSchema.parse({founders:[{name:'Private Name',nationality:'Egypt',ownership:100}]}),'en');expect(JSON.stringify(gateway.mock.calls.at(-1)![0].input)).not.toContain('Private Name');expect(result.questionKeys).toContain('capital');});
