// @vitest-environment jsdom
import React from "react";
import { act } from "react-dom/test-utils";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CapabilityGlowGate } from "@/features/public-site/capability-glow-gate";

type IoCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let ioCallback: IoCallback | null = null;
let coarsePointer = false;
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
      matches:
        (query === "(pointer: coarse)" && coarsePointer) ||
        (query === "(prefers-reduced-motion: reduce)" && reducedMotion),
      media: query,
      addEventListener: vi.fn(() => {}),
      removeEventListener: vi.fn(() => {}),
    })),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  coarsePointer = false;
  reducedMotion = false;
});

describe("CapabilityGlowGate", () => {
  it("renders the static panel disarmed on first paint (SSR-safe)", () => {
    installDomMocks();
    const { container } = render(<CapabilityGlowGate />);

    // Disarmed glow hides its animated layer but keeps the static border.
    expect(container.querySelector(".glow")).not.toBeNull();
    expect(container.innerHTML).toContain("!hidden");
  });

  it("arms the glow when the card nears the viewport on fine pointers", () => {
    installDomMocks();
    const { container } = render(<CapabilityGlowGate />);
    expect(ioCallback).not.toBeNull();

    act(() => {
      ioCallback!([{ isIntersecting: true }]);
    });

    expect(container.innerHTML).not.toContain("!hidden");
  });

  it("stays disarmed on coarse pointers and under reduced motion", () => {
    installDomMocks();
    coarsePointer = true;
    const { container: touch } = render(<CapabilityGlowGate />);
    expect(touch.innerHTML).toContain("!hidden");

    installDomMocks();
    reducedMotion = true;
    const { container: rm } = render(<CapabilityGlowGate />);
    act(() => {
      ioCallback?.([{ isIntersecting: true }]);
    });
    expect(rm.innerHTML).toContain("!hidden");
  });
});
