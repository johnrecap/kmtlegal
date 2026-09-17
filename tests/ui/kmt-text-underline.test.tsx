// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const highlighterCalls: Array<Record<string, unknown>> = [];

vi.mock("@/components/ui/highlighter", () => ({
  Highlighter: (props: Record<string, unknown>) => {
    highlighterCalls.push(props);
    const React = require("react");
    return React.createElement("span", { "data-mock-highlighter": true }, props.children as React.ReactNode);
  },
}));

import { KMT_TEXT_UNDERLINE_GOLD, KmtTextUnderline, KmtUnderlinedText } from "@/components/ui/kmt-text-underline";

function installMatchMedia(reducedMotion: boolean) {
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
  highlighterCalls.length = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("KmtTextUnderline", () => {
  it("wraps the real Magic UI Highlighter with action=underline and KMT gold defaults", () => {
    installMatchMedia(false);
    render(<KmtTextUnderline>reviews the facts and documents</KmtTextUnderline>);

    expect(highlighterCalls).toHaveLength(1);
    const props = highlighterCalls[0];
    expect(props.action).toBe("underline");
    expect(props.color).toBe(KMT_TEXT_UNDERLINE_GOLD);
    expect(props.color).toBe("#a87830");
    expect(props.multiline).toBe(true);
    // animateOnView defaults to true -> the Highlander's own in-view trigger.
    expect(props.isView).toBe(true);
    expect(props.strokeWidth).toBe(1.5);
  });

  it("maps emphasis to thin editorial stroke widths (never marker-like)", () => {
    installMatchMedia(false);
    const { rerender } = render(<KmtTextUnderline emphasis="subtle">phrase</KmtTextUnderline>);
    expect(highlighterCalls.at(-1)?.strokeWidth).toBe(1);
    rerender(<KmtTextUnderline emphasis="strong">phrase</KmtTextUnderline>);
    expect(highlighterCalls.at(-1)?.strokeWidth).toBe(2);
  });

  it("lets explicit strokeWidth/duration override the emphasis defaults", () => {
    installMatchMedia(false);
    render(
      <KmtTextUnderline emphasis="subtle" strokeWidth={1.25} duration={1200}>
        phrase
      </KmtTextUnderline>
    );
    expect(highlighterCalls.at(-1)?.strokeWidth).toBe(1.25);
    expect(highlighterCalls.at(-1)?.animationDuration).toBe(1200);
  });

  it("renders the underline immediately under prefers-reduced-motion (kept, not removed)", () => {
    installMatchMedia(true);
    const { container } = render(<KmtTextUnderline>phrase</KmtTextUnderline>);

    expect(highlighterCalls.at(-1)?.animationDuration).toBe(0);
    expect(highlighterCalls.at(-1)?.isView).toBe(false);
    expect(container.textContent).toContain("phrase");
  });

  it("SSR-renders the phrase text with a stable KMT hook attribute", () => {
    const ssr = renderToStaticMarkup(<KmtTextUnderline emphasis="strong">does not replace lawyer review</KmtTextUnderline>);
    expect(ssr).toContain("does not replace lawyer review");
    expect(ssr).toContain('data-kmt-text-underline="strong"');
  });

  it("splits EN and AR sentences on the highlight phrase, passing copy through untouched", () => {
    installMatchMedia(false);
    const en = render(
      <KmtUnderlinedText text="This content is for general awareness and does not replace lawyer review based on the facts." highlight="does not replace lawyer review" />
    );
    expect(en.container.textContent).toContain("does not replace lawyer review");

    const ar = render(
      <KmtUnderlinedText text="هذا المحتوى للتوعية العامة ولا يغني عن مراجعة محام بناء على الوقائع والمستندات." highlight="لا يغني عن مراجعة محام" />
    );
    expect(ar.container.textContent).toContain("لا يغني عن مراجعة محام");
  });

  it("renders plain text unchanged when the highlight phrase is absent", () => {
    installMatchMedia(false);
    const { container } = render(<KmtUnderlinedText text="A sentence without the phrase." highlight="missing phrase" />);
    expect(container.textContent).toBe("A sentence without the phrase.");
    expect(highlighterCalls).toHaveLength(0);
  });

  it("keeps the real Highlighter as the single effect owner (no local imitation, no scroll listeners)", () => {
    const source = readFileSync(join(process.cwd(), "src/components/ui/kmt-text-underline.tsx"), "utf8");
    expect(source).toContain('from "@/components/ui/highlighter"');
    expect(source).toContain('action="underline"');
    expect(source).not.toContain("border-bottom");
    expect(source).not.toContain("text-decoration");
    expect(source).not.toContain("::after");
    expect(source).not.toContain("addEventListener(\"scroll\"");
    expect(source).not.toContain("requestAnimationFrame");
  });
});
