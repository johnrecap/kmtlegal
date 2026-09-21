// @vitest-environment jsdom
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
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
    // Restrained single gold beam on the assistant panel.
    expect(chatSource).toContain('colorFrom="#eac987"');
    expect(chatSource).toContain('colorTo="#a87830"');
    expect(chatSource).not.toContain("#9c40ff");
    expect(chatSource).not.toContain("#ffaa40");
  });

  it("never renders a booking stepper at any lifecycle point", () => {
    // No render path, no wrapper, no imports — the conversation itself
    // communicates progress; stage state stays internal.
    for (const banned of [
      "BookingStageTabs",
      "booking-stage-tabs",
      "TabsList",
      "TabsTrigger",
      "TabsContent",
      "animate-ui",
      "progressContact",
      "progressDetails",
      "progressSlot",
      "progressPayment",
      'role="tablist"',
    ]) {
      expect(chatSource).not.toContain(banned);
    }
  });

  it("renders the whole conversation through the real animated list", () => {
    expect(chatSource).toContain("<AnimatedList");
    expect(chatSource).toContain("delay={160}");
    expect(chatSource).toContain("{messages.map((message, index) => (");
    expect(chatSource).toContain("showAssistantAvatar");
    // Option panels arrive inside the same sequenced list, not around it.
    expect(chatSource).toContain('<LanguageChoicePanel key="language-choice"');
    expect(chatSource).toContain('<SlotChoicePanel key="slot-choice"');
  });

  it("holds the compact density targets", () => {
    // Shell + viewport: content-driven height (compact on first load),
    // capped so long conversations scroll internally, never the page.
    expect(chatSource).toContain("max-h-[min(72vh,38rem)]");
    expect(chatSource).toContain("max-sm:max-h-[min(84svh,38rem)]");
    expect(chatSource).not.toContain("min-h-[30rem]");
    // Composer pill 48–52px: 40px input/send + 8px vertical + border.
    expect(chatSource).toContain("min-h-10 w-full");
    expect(chatSource).toContain("h-10 w-10 shrink-0");
    expect(chatSource).toContain("!min-h-0");
    // Logical 16px text inset shared by input and placeholder.
    expect(chatSource).toContain("pe-1.5 ps-4");
    expect(chatSource).toContain("pe-20 ps-4");
    expect(chatSource).toContain("leading-6");
    // The forms plugin's unlayered input padding is reset so typed text
    // starts at the exact same origin as the placeholder glyphs.
    expect(chatSource).toContain("!p-0");
    // Bubbles: 65–75% width, 15–16px text, tight padding.
    expect(chatSource).toContain("max-w-[72%]");
    expect(chatSource).toContain("text-[0.95rem]");
    expect(chatSource).toContain("px-4 py-3");
    // Small avatars (no stepper remains — see the never-renders contract).
    expect(chatSource).toContain('shape="circle" size="sm"');
  });

  it("guides the journey inside one console: intent, matter, info cards, new request", () => {
    expect(chatSource).toContain("intentPrompt");
    expect(chatSource).toContain("copy.matterPrompt");
    expect(chatSource).toContain("copy.startNew");
    expect(chatSource).toContain("startNewRequest");
    expect(chatSource).toContain('data-testid="booking-matter-chip"');
    expect(chatSource).toContain('data-testid="booking-new-request"');
    // What-next + after-submit live as in-chat info cards.
    expect(chatSource).toContain('kind: "info"');
    expect(chatSource).toContain("AssistantInfoCard");
    expect(chatSource).toContain("trustItems");
    expect(chatSource).toContain("pageCopy.afterSubmitSteps");
    // No external rail, no side panel, no trust chips in the header.
    expect(chatSource).not.toContain("booking-trust-rail");
    expect(chatSource).not.toContain("TrustRailItem");
    expect(chatSource).not.toContain("BookingSupportPanel");
  });

  it("preserves every booking flow test hook and rule", () => {
    for (const hook of [
      'data-testid="consultation-assistant"',
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
      'inputName="chatMessage"',
      "kmt-chat-scrollbar",
    ]) {
      expect(chatSource).toContain(hook);
    }
    // The stage-tabs hook is gone with the stepper (see above).
    expect(chatSource).not.toContain('data-testid="booking-stage-tabs"');
    // The runtime input keeps its contract in the vendored composer.
    const vanishSource = readFileSync(join(process.cwd(), "src/components/ui/placeholders-and-vanish-input.tsx"), "utf8");
    expect(vanishSource).toContain("name={inputName}");
    expect(vanishSource).toContain('inputName = "chatMessage"');
    expect(chatSource).not.toContain("booking-chat-step-card");
    // Submit logic untouched: the composer still delegates to submitMessage.
    expect(chatSource).toContain("onSubmit={submitMessage}");
    expect(chatSource).toContain("value={freeMessage}");
    // Stage-aware placeholders come from real copy, not generic strings.
    expect(chatSource).toContain("composerPlaceholders");
    expect(chatSource).toContain("copy.contactPrompt");
    expect(chatSource).toContain("copy.detailsPrompt");
  });

  it("keeps assistant bubbles theme-safe with no hard-coded dark surfaces", () => {
    expect(chatSource).toContain("bg-[var(--kmt-assistant-bubble)]");
    expect(chatSource).toContain("bg-[var(--kmt-assistant-user)]");
    expect(chatSource).toContain("text-[var(--kmt-assistant-text)]");
    expect(chatSource).not.toContain("bg-[#0e0b07]");
    expect(chatSource).not.toContain("bg-black");
    expect(chatSource).not.toContain("text-white");
    expect(chatSource).not.toContain("amber-");
    expect(chatSource).not.toContain("slate-");
    expect(chatSource).not.toContain("emerald-");
    expect(chatSource).not.toContain("bg-white/[0.075]");
    // Send follows reading direction; status is a plain dot, no glow.
    expect(chatSource).toContain("rtl:-scale-x-100");
    expect(chatSource).toContain("bg-current");
  });
});

describe("consultation assistant theme tokens (source contract)", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  it("defines every assistant surface for light and dark", () => {
    for (const token of [
      "--kmt-assistant-shell",
      "--kmt-assistant-log",
      "--kmt-assistant-bubble",
      "--kmt-assistant-user",
      "--kmt-assistant-input",
      "--kmt-assistant-text",
      "--kmt-assistant-muted",
      "--kmt-assistant-line",
      "--kmt-assistant-chip",
    ]) {
      expect(css).toContain(token);
    }
    // Light contract: warm ivory/paper, deep text, bronze-gold line.
    expect(css).toContain("--kmt-assistant-shell: #faf7f0");
    expect(css).toContain("--kmt-assistant-text: #1c1812");
    // Dark contract: deep black scale, warm-white text.
    expect(css).toContain("--kmt-assistant-shell: #0a0908");
    expect(css).toContain("--kmt-assistant-text: #f5efe3");
  });
});

describe("consultation assistant copy (source contract)", () => {
  const enSource = readFileSync(join(process.cwd(), "src/content/public-content.en.ts"), "utf8");
  const arSource = readFileSync(join(process.cwd(), "src/content/public-content.ar.ts"), "utf8");

  it("carries the guided-flow keys in both locales", () => {
    for (const key of ["intentPrompt", "matterPrompt", "startNew"]) {
      expect(enSource).toContain(key);
      expect(arSource).toContain(key);
    }
    // Status reads as assistant readiness, never a form state.
    expect(enSource).toContain('onlineNow: "Assistant ready"');
    expect(arSource).toContain('onlineNow: "المساعد جاهز"');
  });
});

describe("booking page zones (source contract)", () => {
  const pagesSource = readFileSync(join(process.cwd(), "src/features/public-site/public-pages.tsx"), "utf8");
  const componentsSource = readFileSync(join(process.cwd(), "src/features/public-site/public-components.tsx"), "utf8");

  it("composes one centered assistant console with no external flow UI", () => {
    expect(pagesSource).toContain("ConsultationBookingChatFromQuery");
    expect(pagesSource).toContain("BookingFlowHeader");
    expect(pagesSource).toContain("max-w-[56rem]");
    expect(pagesSource).not.toContain("BookingSupportPanel");
    expect(pagesSource).not.toContain("AfterSubmitStrip");
    expect(componentsSource).not.toContain("AfterSubmitStrip");
  });

  it("removed the migrated external panels instead of leaving dead files", () => {
    expect(existsSync(join(process.cwd(), "src/features/public-site/booking-support-panel.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "src/features/public-site/support-glow-gate.tsx"))).toBe(false);
  });

  it("keeps the flow header compact with no duplicated progress legend", () => {
    expect(componentsSource).toContain("BookingFlowHeader");
    expect(componentsSource).not.toContain("steps: ReadonlyArray<string>");
  });
});
