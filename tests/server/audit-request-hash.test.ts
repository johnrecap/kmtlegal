import { describe, expect, it } from "vitest";
import { auditLogCreateData } from "@/server/audit/audit-service";

describe("manual case audit request identity",()=>{
  it("preserves a validated SHA-256 containing a phone-like numeric run",()=>{
    const requestHash="a".repeat(20)+"1234567890"+"b".repeat(34);
    const data=auditLogCreateData({action:"case.manual_create",resourceType:"LegalCase",metadata:{requestHash,source:"admin-manual"}});
    expect((data.metadata as Record<string,unknown>).requestHash).toBe(requestHash);
  });
  it("keeps sensitive metadata redacted and rejects non-hash request identities",()=>{
    const invalid=auditLogCreateData({action:"case.manual_create",resourceType:"LegalCase",metadata:{requestHash:"customer@example.test",phone:"+201234567890",summary:"Private notes"}});
    expect(invalid.metadata).toEqual({});
    const generic=auditLogCreateData({action:"synthetic.event",resourceType:"Fixture",metadata:{phone:"+201234567890",value:"Call +201234567890",password:"synthetic-secret"}});
    expect(generic.metadata).toEqual({phone:"[REDACTED]",value:"Call [REDACTED_PHONE]",password:"[REDACTED]"});
  });
});
