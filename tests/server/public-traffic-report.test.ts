import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicTrafficReport } from "@/server/admin/public-traffic-service";
import { prisma } from "@/server/db/prisma";

vi.mock("@/server/db/prisma", () => ({ prisma: {
  analyticsEvent: { groupBy: vi.fn() }, contactMessage: { count: vi.fn() }, consultationRequest: { count: vi.fn() }
} }));
const actor = { id: "synthetic", roleName: "Office Admin", permissions: ["report.read.any"] };
beforeEach(() => vi.clearAllMocks());
describe("public traffic aggregation", () => {
  it("denies access before querying any records", async () => {
    await expect(getPublicTrafficReport({ ...actor, permissions: [] }, {})).rejects.toMatchObject({ status: 403 });
    expect(prisma.analyticsEvent.groupBy).not.toHaveBeenCalled();
    expect(prisma.contactMessage.count).not.toHaveBeenCalled();
  });
  it("aggregates safe events and independent records with the same inclusive UTC period", async () => {
    const groups = [
      { name: "public.page_viewed", properties: { page: "service", locale: "ar", service: "contracts" }, _count: { _all: 3 } },
      { name: "public.contact_clicked", properties: { page: "contact", locale: "en", placement: "footer", channel: "whatsapp" }, _count: { _all: 2 } },
      { name: "public.booking_clicked", properties: { page: "home", locale: "ar", placement: "header" }, _count: { _all: 1 } },
      { name: "public.page_viewed", properties: { page: "home", locale: "ar", email: "private@example.invalid" }, _count: { _all: 99 } }
    ];
    vi.mocked(prisma.analyticsEvent.groupBy).mockResolvedValue(groups as never);
    vi.mocked(prisma.contactMessage.count).mockResolvedValue(4);
    vi.mocked(prisma.consultationRequest.count).mockResolvedValue(5);
    const result = await getPublicTrafficReport(actor, { dateFrom: "2026-10-01", dateTo: "2026-10-09" });
    expect(result).toMatchObject({ pageViews: 3, bookingClicks: 1, contacts: { phone: 0, email: 0, whatsapp: 2 }, contactRequests: 4, consultationRequests: 5 });
    expect(result.pages).toEqual([{ page: "service", locale: "ar", service: "contracts", count: 3 }]);
    const createdAt = { gte: new Date("2026-10-01T00:00:00.000Z"), lte: new Date("2026-10-09T23:59:59.999Z") };
    expect(prisma.analyticsEvent.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ source: "PUBLIC", createdAt }) }));
    expect(prisma.contactMessage.count).toHaveBeenCalledWith({ where: { createdAt } });
    expect(prisma.consultationRequest.count).toHaveBeenCalledWith({ where: { createdAt } });
  });
  it("rejects an inverted period without querying", async () => {
    await expect(getPublicTrafficReport(actor, { dateFrom: "2026-10-10", dateTo: "2026-10-01" })).rejects.toThrow();
    expect(prisma.analyticsEvent.groupBy).not.toHaveBeenCalled();
  });
});
