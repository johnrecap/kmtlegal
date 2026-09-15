import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CountingNumber, RippleButton, RippleButtonRipples, SplittingText, Tilt, TiltContent } from "@/components/animate-ui";

describe("vendored animate-ui primitives", () => {
  it("SplittingText words mode keeps every word in the server-rendered markup", () => {
    const html = renderToStaticMarkup(<SplittingText text="Structured Legal Support" type="words" />);

    expect(html).toContain("Structured");
    expect(html).toContain("Legal");
    expect(html).toContain("Support");
    expect(html.split("display:inline-block").length - 1).toBe(3);
  });

  it("SplittingText lines mode keeps full lines for Arabic-safe rendering", () => {
    const html = renderToStaticMarkup(<SplittingText text={["دعم قانوني منظم", "سطر ثانٍ"]} type="lines" />);

    expect(html).toContain("دعم قانوني منظم");
    expect(html).toContain("سطر ثانٍ");
    expect(html).toContain("<br");
  });

  it("CountingNumber renders the final number when initiallyStable (no-JS safe)", () => {
    const html = renderToStaticMarkup(<CountingNumber initiallyStable number={24} />);

    expect(html).toContain(">24</span>");
  });

  it("Tilt and TiltContent render children with 3D perspective styles", () => {
    const html = renderToStaticMarkup(
      <Tilt maxTilt={5}>
        <TiltContent>Card body</TiltContent>
      </Tilt>
    );

    expect(html).toContain("Card body");
    expect(html).toContain("perspective:800px");
  });

  it("RippleButton renders children and the ripples slot", () => {
    const html = renderToStaticMarkup(
      <RippleButton type="button">
        Click me
        <RippleButtonRipples />
      </RippleButton>
    );

    expect(html).toContain("Click me");
    expect(html).toContain("ripple-button");
  });
});
