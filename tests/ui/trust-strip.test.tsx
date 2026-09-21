// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TrustStrip } from "@/features/public-site/public-components";

const items = [
  { icon: "verified", label: "Reviewed by the office before any legal step" },
  { icon: "lock", label: "Client information is handled confidentially" },
  { icon: "schedule", label: "Clear follow-up from request to appointment" },
];

/**
 * Phase 5 regression: the approved trust strip keeps the Magic UI Marquee
 * implementation and content untouched. RTL travel direction is driven by
 * mirrored keyframes in CSS — Marquee's `reverse` prop must NOT come back,
 * because direction:reverse on the LTR keyframes breaks the right-anchored
 * RTL loop (strip renders empty most of the cycle).
 */
describe("TrustStrip", () => {
  it("renders the doubled loop with screen-reader label and hidden motion copy", () => {
    const { container } = render(<TrustStrip items={items} />);

    const srOnly = container.querySelector("span.sr-only");
    expect(srOnly?.textContent).toContain("Reviewed by the office before any legal step");
    expect(srOnly?.textContent).toContain("Client information is handled confidentially");

    const marquee = container.querySelector(".kmt-trust-marquee");
    expect(marquee?.getAttribute("aria-hidden")).toBe("true");

    // Loop content is doubled for the seamless cycle (3 items × 2).
    const lanes = container.querySelectorAll(".kmt-trust-marquee > div");
    expect(lanes.length).toBe(2);
    expect(container.textContent).toContain("Clear follow-up from request to appointment");
  });

  it("does not use Marquee reverse (RTL direction is keyframe-driven)", () => {
    const { container } = render(<TrustStrip items={items} />);
    const html = container.innerHTML;

    expect(html).not.toContain("animation-direction:reverse");
    expect(html).not.toContain("[animation-direction:reverse]");
  });

  it("defines mirrored RTL marquee keyframes scoped to the trust strip", () => {
    const globals = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(globals).toContain("@keyframes kmt-marquee-rtl");
    // Right-anchored RTL lanes travel rightward for a seamless loop.
    expect(globals).toContain("translateX(calc(100% + var(--gap, 1rem)))");
    expect(globals).toContain('html[dir="rtl"] .kmt-trust-marquee .animate-marquee');
    expect(globals).toContain("animation-name: kmt-marquee-rtl");
    // LTR keyframes untouched.
    expect(globals).toContain("translateX(calc(-100% - var(--gap, 1rem)))");
  });
});
