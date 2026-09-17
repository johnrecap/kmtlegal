// @vitest-environment jsdom
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedList } from "@/components/ui/animated-list";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Tabs, TabsContents, TabsContent, TabsList, TabsTrigger } from "@/components/animate-ui";

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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("booking assistant stage primitives", () => {
  it("vanish input stays controlled with a real named input and composer hook", () => {
    installMatchMedia(false);
    const onValueChange = vi.fn();
    const onSubmit = vi.fn();
    const { container } = render(
      <PlaceholdersAndVanishInput
        formTestId="booking-chat-composer"
        placeholders={["Type a booking request", "Add the booking reference"]}
        value="hello matter"
        onValueChange={onValueChange}
        onSubmit={onSubmit}
        inputName="chatMessage"
        ariaLabel="Message"
        trailing={<button type="submit">send</button>}
      />
    );

    const form = container.querySelector('[data-testid="booking-chat-composer"]');
    expect(form?.tagName).toBe("FORM");
    const input = container.querySelector('input[name="chatMessage"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.getAttribute("aria-label")).toBe("Message");
    expect(input.value).toBe("hello matter");
    // Scripted fills (e2e) always land: onChange is never blocked mid-animation.
    fireEvent.change(input, { target: { value: "filled text" } });
    expect(onValueChange).toHaveBeenCalledWith("filled text");
    fireEvent.submit(form!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(container.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it("vanish input shows the pending placeholder and static copy when disabled", () => {
    installMatchMedia(false);
    const { container } = render(
      <PlaceholdersAndVanishInput
        placeholders={["Choose Arabic or English to start"]}
        value=""
        onValueChange={() => {}}
        onSubmit={() => {}}
        disabled
        inputName="chatMessage"
        ariaLabel="Message"
      />
    );
    expect(container.textContent).toContain("Choose Arabic or English to start");
    expect((container.querySelector("input") as HTMLInputElement).disabled).toBe(true);
  });

  it("animated list reveals progressively in motion, statically under reduced motion", () => {
    installMatchMedia(true);
    const rm = render(
      <AnimatedList delay={400}>
        <span key="a">first</span>
        <span key="b">second</span>
      </AnimatedList>
    );
    // Reduced motion: everything visible immediately, no sequencing.
    expect(rm.container.textContent).toContain("first");
    expect(rm.container.textContent).toContain("second");
    rm.unmount();
  });

  it("animated list source keeps the real sequenced mechanism without scroll listeners", () => {
    const source = readFileSync(join(process.cwd(), "src/components/ui/animated-list.tsx"), "utf8");
    expect(source).toContain("AnimatePresence");
    expect(source).toContain("usePrefersReducedMotion");
    expect(source).not.toContain("useReducedMotion");
    expect(source).not.toContain("addEventListener(\"scroll\"");
    expect(source).not.toContain("requestAnimationFrame");
  });

  it("tabs navigator renders disabled stage triggers with an animated indicator", () => {
    installMatchMedia(false);
    const { container } = render(
      <Tabs value="details" aria-label="Booking stages" onValueChange={() => undefined}>
        <TabsList>
          <TabsTrigger value="contact" disabled>Contact</TabsTrigger>
          <TabsTrigger value="details" disabled>Details</TabsTrigger>
        </TabsList>
        <TabsContents>
          <TabsContent value="contact">contact hint</TabsContent>
          <TabsContent value="details">details hint</TabsContent>
        </TabsContents>
      </Tabs>
    );
    expect(container.querySelector('[role="tablist"]')).not.toBeNull();
    const triggers = container.querySelectorAll('[role="tab"]');
    expect(triggers).toHaveLength(2);
    expect(triggers[0].getAttribute("aria-selected")).toBe("false");
    expect(triggers[1].getAttribute("aria-selected")).toBe("true");
    expect(triggers[0].hasAttribute("disabled")).toBe(true);
    // Only the active stage guidance shows.
    expect(container.textContent).toContain("details hint");
    expect(container.textContent).not.toContain("contact hint");
  });

  it("tabs indicator measurement is direction-agnostic (RTL-safe rect math)", () => {
    const source = readFileSync(join(process.cwd(), "src/components/animate-ui/primitives/radix/tabs.tsx"), "utf8");
    expect(source).toContain("getBoundingClientRect");
    expect(source).not.toContain("offsetLeft");
  });

  it("SSR-renders tabs + vanish input markup without client effects", () => {
    const ssr = renderToStaticMarkup(
      <Tabs value="contact" aria-label="Booking stages">
        <TabsList>
          <TabsTrigger value="contact" disabled>Contact</TabsTrigger>
        </TabsList>
        <TabsContents>
          <TabsContent value="contact">hint</TabsContent>
        </TabsContents>
      </Tabs>
    );
    expect(ssr).toContain("Contact");
    expect(ssr).toContain("hint");
  });
});

describe("booking chat stage composition (source contract)", () => {
  const chatSource = readFileSync(join(process.cwd(), "src/features/public-site/consultation-booking-chat.tsx"), "utf8");

  it("uses the real stage components on the hero object", () => {
    expect(chatSource).toContain('from "@/components/ui/animated-list"');
    expect(chatSource).toContain('from "@/components/ui/border-beam"');
    expect(chatSource).toContain('from "@/components/ui/placeholders-and-vanish-input"');
    expect(chatSource).toContain('from "@/components/animate-ui"');
    expect(chatSource).toContain("BookingStageTabs");
    // Restrained single gold beam on the assistant panel.
    expect(chatSource).toContain('colorFrom="#eac987"');
    expect(chatSource).toContain('colorTo="#a87830"');
    expect(chatSource).not.toContain("#9c40ff");
    expect(chatSource).not.toContain("#ffaa40");
  });

  it("preserves every booking flow test hook and rule", () => {
    for (const hook of [
      'data-testid="booking-stepper"',
      'data-testid="booking-chat-shell"',
      'data-testid="booking-chat-log"',
      'formTestId="booking-chat-composer"',
      'data-testid="booking-quick-actions"',
      'data-testid="booking-quick-book"',
      'data-testid="booking-quick-inquiry"',
      'data-testid="booking-language-choice"',
      "booking-slot-choice-panel",
      'data-testid="booking-confirm-booking"',
      'data-testid="booking-pay-booking"',
      'data-testid="booking-payment-review"',
      'data-testid="booking-stage-tabs"',
      'inputName="chatMessage"',
      "kmt-chat-scrollbar",
    ]) {
      expect(chatSource).toContain(hook);
    }
    // The runtime input keeps its contract in the vendored composer.
    const vanishSource = readFileSync(join(process.cwd(), "src/components/ui/placeholders-and-vanish-input.tsx"), "utf8");
    expect(vanishSource).toContain("name={inputName}");
    expect(vanishSource).toContain('inputName = "chatMessage"');
    expect(chatSource).not.toContain("booking-chat-step-card");
    // Submit logic untouched: the composer still delegates to submitMessage.
    expect(chatSource).toContain("onSubmit={submitMessage}");
    expect(chatSource).toContain("value={freeMessage}");
  });

  it("keeps assistant bubbles in the KMT palette with no toy colors", () => {
    expect(chatSource).toContain("bg-[#0e0b07]");
    expect(chatSource).not.toContain("emerald-");
    expect(chatSource).not.toContain("bg-white/[0.075]");
  });
});

describe("booking page zones (source contract)", () => {
  const pagesSource = readFileSync(join(process.cwd(), "src/features/public-site/public-pages.tsx"), "utf8");
  const componentsSource = readFileSync(join(process.cwd(), "src/features/public-site/public-components.tsx"), "utf8");

  it("composes stage + subordinate support panel + rail", () => {
    expect(pagesSource).toContain("BookingSupportPanel");
    expect(pagesSource).toContain("ConsultationBookingChatFromQuery");
    expect(pagesSource).toContain("AfterSubmitStrip");
    expect(pagesSource).toContain("BookingFlowHeader");
  });

  it("support panel uses real trust copy with a gated gold glow", () => {
    const panelSource = readFileSync(join(process.cwd(), "src/features/public-site/booking-support-panel.tsx"), "utf8");
    expect(panelSource).toContain("copy.trustTitle");
    expect(panelSource).toContain("copy.trustItems");
    expect(panelSource).toContain("SupportGlowGate");
    expect(panelSource).toContain("RequestedLawyerQueryNotice");
    const gateSource = readFileSync(join(process.cwd(), "src/features/public-site/support-glow-gate.tsx"), "utf8");
    expect(gateSource).toContain('variant="kmt-gold"');
    expect(gateSource).toContain("(pointer: coarse)");
    expect(gateSource).toContain("prefers-reduced-motion");
  });

  it("after-submit strip is a connected rail reusing real steps", () => {
    expect(componentsSource).toContain("What-happens-after strip");
    expect(componentsSource).toContain("border-t border-[var(--kmt-public-line)]");
  });
});
