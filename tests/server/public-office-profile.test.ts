import { describe, expect, it } from "vitest";
import { publicOfficeProfile } from "@/content/public-office-profile";
import { getPublicContent } from "@/content/public-content";
import { assistantKnowledge } from "@/server/consultations/assistant-knowledge";

const map = "https://maps.app.goo.gl/muoNe1hNgw2QNWtb9";
const address = {
  ar: "العاصمة الإدارية الجديدة، طريق الأمل، مول جولدن تاور، الدور الثاني، مكتب ٢٠١",
  en: "New Administrative Capital, Al Amal Road, Golden Tower Mall, Second Floor, Office 201"
} as const;
describe("PLAN40 owner-approved public office location", () => {
  it.each(["ar", "en"] as const)("%s uses the exact full address and owner map across canonical consumers", locale => {
    const content = getPublicContent(locale);
    expect(publicOfficeProfile.address[locale]).toBe(address[locale]);
    expect(publicOfficeProfile.mapHref).toBe(map);
    expect(content.branches[0]).toMatchObject({ address: address[locale], mapHref: map });
    expect(content.footerContent.offices[0].address).toBe(address[locale]);
    expect(assistantKnowledge(locale).office).toMatchObject({ location: address[locale], map });
    // Existing published contact facts remain unchanged.
    expect(publicOfficeProfile.phoneDisplay).toBe("01117416666");
    expect(publicOfficeProfile.email).toBe("contact@kmtlegal.org");
  });
});
