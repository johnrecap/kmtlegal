// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSafePolling } from "@/lib/use-safe-polling";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => { resolve = next; });
  return { promise, resolve };
}

describe("useSafePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not overlap requests and aborts the in-flight request on unmount", async () => {
    const pending = deferred();
    let signal: AbortSignal | undefined;
    const poll = vi.fn(async (nextSignal: AbortSignal) => {
      signal = nextSignal;
      await pending.promise;
    });
    const { unmount } = renderHook(() => useSafePolling({ intervalMs: 5_000, poll }));

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(poll).toHaveBeenCalledOnce();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(poll).toHaveBeenCalledOnce();

    unmount();
    expect(signal?.aborted).toBe(true);
    pending.resolve();
  });

  it("backs off to the configured cap after repeated failures", async () => {
    const poll = vi.fn(async () => { throw new Error("offline"); });
    const onError = vi.fn();
    const { unmount } = renderHook(() => useSafePolling({
      intervalMs: 5_000,
      maxBackoffMs: 60_000,
      poll,
      onError
    }));

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(40_000); });
    expect(poll).toHaveBeenCalledTimes(4);
    await act(async () => { await vi.advanceTimersByTimeAsync(59_999); });
    expect(poll).toHaveBeenCalledTimes(4);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(poll).toHaveBeenCalledTimes(5);
    expect(onError).toHaveBeenCalledTimes(5);
    unmount();
  });

  it("stops permanently after an authorization response", async () => {
    const terminal = Object.assign(new Error("session ended"), { status: 401 });
    const poll = vi.fn(async () => { throw terminal; });
    const onTerminal = vi.fn();
    const { unmount } = renderHook(() => useSafePolling({ intervalMs: 5_000, poll, onTerminal }));

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000); });

    expect(poll).toHaveBeenCalledOnce();
    expect(onTerminal).toHaveBeenCalledWith(terminal);
    unmount();
  });

  it("pauses while hidden and resumes immediately when visible", async () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    const poll = vi.fn(async () => undefined);
    const { unmount } = renderHook(() => useSafePolling({ intervalMs: 5_000, poll }));

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(poll).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(poll).toHaveBeenCalledOnce();
    unmount();
  });

  it("remembers an immediate resume requested before an aborted poll settles", async () => {
    const first = deferred();
    const poll = vi.fn(async () => {
      if (poll.mock.calls.length === 1) await first.promise;
    });
    const { unmount } = renderHook(() => useSafePolling({ intervalMs: 5_000, poll }));

    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(poll).toHaveBeenCalledOnce();

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    await act(async () => {
      first.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(poll).toHaveBeenCalledTimes(2);
    unmount();
  });
});
