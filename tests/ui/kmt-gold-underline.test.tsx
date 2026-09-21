// @vitest-environment jsdom
import React from "react";
import { act } from "react-dom/test-utils";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicSection } from "@/features/public-site/public-components";
import { KmtGoldUnderline } from "@/components/ui/kmt-gold-underline";

type IoCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let ioCallback: IoCallback | null = null;
let reducedMotion = false;

function installDomMocks() {
  ioCallback = null;
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn(function (this: unknown, callback: IoCallback) {
      ioCallback = callback;
      return {
        observe: vi.fn(() => {}),
        unobserve: vi.fn(() => {}),
        disconnect: vi.fn(() => {}),
      };
    })
  );
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
      media: query,
      addEventListener: vi.fn(() => {}),
      removeEventListener: vi.fn(() => {}),
    })),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  reducedMotion = false;
});

describe("KmtGoldUnderline", () => {
  it("renders rule variants with distinct fixed widths in the gold token", () => {
    installDomMocks();
    const { container: short } = render(<KmtGoldUnderline variant="short" />);
    const { container: section } = render(<KmtGoldUnderline variant="section" />);
    const { container: medium } = render(<KmtGoldUnderline variant="medium" />);

    expect(short.querySelector('[data-kmt-underline="short"]')?.className).toContain("w-12");
    expect(section.querySelector('[data-kmt-underline="section"]')?.className).toContain("w-16");
    expect(medium.querySelector('[data-kmt-underline="medium"]')?.className).toContain("w-28");
    for (const root of [short, section, medium]) {
      expect(root.innerHTML).toContain("bg-");
      expect(root.innerHTML).toContain("var(--kmt-public-gold)");
    }
  });

  it("honors an explicit pixel width override", () => {
    installDomMocks();
    const { container } = render(<KmtGoldUnderline variant="short" width={72} />);
    const bar = container.querySelector('[data-kmt-underline="short"]') as HTMLElement;
    expect(bar.style.width).toBe("72px");
  });

  it("paints the final line in SSR HTML (no-JS safe), then grows on view", () => {
    // Server HTML: effects never run — the line must be fully visible.
    const ssr = renderToStaticMarkup(<KmtGoldUnderline variant="section" />);
    expect(ssr).toContain('data-kmt-underline="section"');
    expect(ssr).not.toContain("scaleX(0)");

    // Hydrated: the component waits (hidden) for the intersection, then grows.
    installDomMocks();
    const { container } = render(<KmtGoldUnderline variant="section" />);
    const bar = container.querySelector('[data-kmt-underline="section"]') as HTMLElement;
    expect(bar.style.transform).toBe("scaleX(0)");
    expect(ioCallback).not.toBeNull();

    act(() => {
      ioCallback!([{ isIntersecting: true }]);
    });
    expect(bar.style.transform).toBe("scaleX(1)");
  });

  it("keeps the line statically visible under reduced motion", () => {
    installDomMocks();
    reducedMotion = true;
    const { container } = render(<KmtGoldUnderline variant="section" />);
    const bar = container.querySelector('[data-kmt-underline="section"]') as HTMLElement;

    expect(bar.style.transform).toBe("");
    act(() => {
      ioCallback?.([{ isIntersecting: true }]);
    });
    // Never hidden, never animated — appears immediately.
    expect(bar.style.transform).toBe("");
  });

  it("renders the inline text variant around the phrase", () => {
    installDomMocks();
    const { container } = render(<KmtGoldUnderline variant="text">does not replace lawyer review</KmtGoldUnderline>);

    expect(container.textContent).toContain("does not replace lawyer review");
    const bar = container.querySelector('[data-kmt-underline="text"]') as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.className).toContain("bg-[var(--kmt-public-gold)]");
  });

  it("centers the rule when aligned center", () => {
    installDomMocks();
    const { container } = render(<KmtGoldUnderline variant="short" align="center" />);
    const bar = container.querySelector('[data-kmt-underline="short"]') as HTMLElement;
    expect(bar.className).toContain("mx-auto");
  });

  it("defines the scaleX growth with RTL origin in the stylesheet", () => {
    const globals = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(globals).toContain("@keyframes kmt-gold-underline-in");
    expect(globals).toContain("transform: scaleX(0)");
    expect(globals).toContain(".kmt-gold-underline");
    expect(globals).toContain("transform-origin: left center");
    expect(globals).toContain('html[dir="rtl"] .kmt-gold-underline');
    expect(globals).toContain("transform-origin: right center");
  });
});

describe("PublicSection accent", () => {
  it("renders no underline by default (existing sections byte-identical)", () => {
    const { container } = render(
      <PublicSection title="General title">
        <div>content</div>
      </PublicSection>
    );

    expect(container.querySelector("[data-kmt-underline]")).toBeNull();
  });

  it("renders a centered section accent on demand", () => {
    installDomMocks();
    const { container } = render(
      <PublicSection align="center" accent="section" title="General title">
        <div>content</div>
      </PublicSection>
    );

    const bar = container.querySelector('[data-kmt-underline="section"]');
    expect(bar).not.toBeNull();
    expect(bar?.className).toContain("mx-auto");
  });
});
