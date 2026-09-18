import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dockSource = readFileSync(join(process.cwd(), "src/components/ui/floating-dock.tsx"), "utf8");
const wrapperSource = readFileSync(join(process.cwd(), "src/components/layout/public-floating-dock.tsx"), "utf8");
const shellSource = readFileSync(join(process.cwd(), "src/components/layout/public-shell.tsx"), "utf8");

describe("public floating dock (source contract)", () => {
  it("vendors the real Aceternity Floating Dock architecture", () => {
    // Desktop magnification + mobile expanding menu, same mechanism.
    expect(dockSource).toContain("useMotionValue");
    expect(dockSource).toContain("useSpring");
    expect(dockSource).toContain("useTransform");
    expect(dockSource).toContain("AnimatePresence");
    expect(dockSource).toContain("FloatingDockDesktop");
    expect(dockSource).toContain("FloatingDockMobile");
    expect(dockSource).toContain("https://ui.aceternity.com/components/floating-dock");
    // Magnification curve + tooltip reveal behavior intact.
    expect(dockSource).toContain("[-150, 0, 150]");
    expect(dockSource).toContain("-top-8");
  });

  it("supports external actions with a safe new-tab contract", () => {
    expect(dockSource).toContain("external");
    expect(dockSource).toContain('target="_blank"');
    expect(dockSource).toContain('rel="noopener noreferrer"');
  });

  it("exposes exactly two public actions and nothing else", () => {
    expect(wrapperSource).toContain("content.shared.bookConsultation");
    expect(wrapperSource).toContain("content.contactPage.whatsappLabel");
    expect(wrapperSource).toContain('localizedPublicHref("/book-consultation", locale)');
    expect(wrapperSource).toContain("NEXT_PUBLIC_KMT_WHATSAPP_URL");
    expect(wrapperSource).toContain("external: true");
    // No AI/third action, no duplicate consultation modal.
    expect(wrapperSource).not.toContain("<Dialog");
    expect(wrapperSource).not.toContain("<Modal");
    expect(wrapperSource).not.toContain("useState(");
  });

  it("renders once in the public shell with a click-through overlay", () => {
    expect(shellSource).toContain("PublicFloatingDock");
    expect(shellSource).toContain("<PublicFloatingDock locale={locale} />");
    expect(wrapperSource).toContain('data-testid="public-floating-dock"');
    expect(wrapperSource).toContain("pointer-events-none");
    expect(wrapperSource).toContain("MotionConfig");
  });

  it("steps aside on the consultation route so it never covers the composer", () => {
    expect(shellSource).toContain("hideDock");
    expect(shellSource).toContain('"/book-consultation"');
    expect(shellSource).toContain("hideDock ? null : <PublicFloatingDock locale={locale} />");
  });

  it("never renders inside admin or client portal layouts", () => {
    for (const layout of ["src/app/(app-ar)/layout.tsx", "src/app/(client)/layout.tsx"]) {
      const source = readFileSync(join(process.cwd(), layout), "utf8");
      expect(source).not.toContain("PublicFloatingDock");
      expect(source).not.toContain("floating-dock");
    }
  });

  it("carries the mobile menu label in both locales", () => {
    const enSource = readFileSync(join(process.cwd(), "src/content/public-content.en.ts"), "utf8");
    const arSource = readFileSync(join(process.cwd(), "src/content/public-content.ar.ts"), "utf8");
    expect(enSource).toContain("dockMenuLabel");
    expect(arSource).toContain("dockMenuLabel");
  });
});
