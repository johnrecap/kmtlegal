import { describe, expect, it } from "vitest";
import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { ApiError } from "@/server/http/errors";
import { phaseFiveApiCopy } from "@/content/phase-five-api-copy";

describe("phase-five localized errors", () => {
  for (const locale of ["ar", "en"] as const) it(`${locale}: preserves status/code without reflecting private validation details`, async () => {
    const response = phaseFiveErrorResponse(new ApiError(400, "VALIDATION_ERROR", "private customer@example.invalid", [{ message: "private supplied data" }]), new Request("http://localhost/api/service-requests", { headers: { "x-kmt-locale": locale } }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatchObject({ code: "VALIDATION_ERROR", message: phaseFiveApiCopy[locale].VALIDATION_ERROR, details: [] });
    expect(JSON.stringify(body)).not.toContain("private");
  });
});
