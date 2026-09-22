"use client";

import { useCallback, useEffect, useRef } from "react";

type PollingError = Error & { status?: number };

type SafePollingOptions = {
  enabled?: boolean;
  intervalMs: number;
  maxBackoffMs?: number;
  initialDelayMs?: number;
  resetKey?: string | number | null;
  isPaused?: () => boolean;
  poll: (signal: AbortSignal) => Promise<void>;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
  onTerminal?: (error: unknown) => void;
};

const TERMINAL_HTTP_STATUSES = new Set([401, 403]);

function errorStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function pollingEnvironmentReady() {
  return document.visibilityState !== "hidden" && navigator.onLine;
}

export function useSafePolling({
  enabled = true,
  intervalMs,
  maxBackoffMs = 60_000,
  initialDelayMs = intervalMs,
  resetKey = null,
  isPaused,
  poll,
  onError,
  onSuccess,
  onTerminal
}: SafePollingOptions) {
  const pollRef = useRef(poll);
  const pausedRef = useRef(isPaused);
  const errorRef = useRef(onError);
  const successRef = useRef(onSuccess);
  const terminalRef = useRef(onTerminal);
  const runNowRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    pollRef.current = poll;
    pausedRef.current = isPaused;
    errorRef.current = onError;
    successRef.current = onSuccess;
    terminalRef.current = onTerminal;
  });

  useEffect(() => {
    if (!enabled) {
      runNowRef.current = () => undefined;
      return;
    }

    let disposed = false;
    let terminal = false;
    let timer: number | undefined;
    let controller: AbortController | null = null;
    let failureCount = 0;
    let resumePending = false;

    const schedule = (delayMs: number) => {
      window.clearTimeout(timer);
      if (!disposed && !terminal) {
        timer = window.setTimeout(run, delayMs);
      }
    };

    async function run() {
      if (disposed || terminal || controller) return;
      if (!pollingEnvironmentReady() || pausedRef.current?.()) {
        schedule(intervalMs);
        return;
      }

      controller = new AbortController();
      let nextDelay = intervalMs;
      try {
        await pollRef.current(controller.signal);
        if (disposed || controller.signal.aborted) return;
        failureCount = 0;
        successRef.current?.();
      } catch (error) {
        if (controller.signal.aborted || disposed || isAbortError(error)) return;
        if (TERMINAL_HTTP_STATUSES.has(errorStatus(error) ?? 0)) {
          terminal = true;
          terminalRef.current?.(error);
          return;
        }
        failureCount += 1;
        nextDelay = Math.min(maxBackoffMs, intervalMs * 2 ** failureCount);
        errorRef.current?.(error);
      } finally {
        controller = null;
        if (!disposed && !terminal) {
          if (resumePending && pollingEnvironmentReady()) {
            resumePending = false;
            schedule(0);
          } else {
            schedule(nextDelay);
          }
        }
      }
    }

    const handleEnvironmentChange = () => {
      if (!pollingEnvironmentReady()) {
        resumePending = false;
        controller?.abort();
        schedule(intervalMs);
        return;
      }
      if (controller) {
        resumePending = true;
        return;
      }
      schedule(0);
    };

    runNowRef.current = () => {
      if (controller) {
        resumePending = true;
        return;
      }
      schedule(0);
    };
    document.addEventListener("visibilitychange", handleEnvironmentChange);
    window.addEventListener("online", handleEnvironmentChange);
    window.addEventListener("offline", handleEnvironmentChange);
    schedule(initialDelayMs);

    return () => {
      disposed = true;
      runNowRef.current = () => undefined;
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", handleEnvironmentChange);
      window.removeEventListener("online", handleEnvironmentChange);
      window.removeEventListener("offline", handleEnvironmentChange);
    };
  }, [enabled, initialDelayMs, intervalMs, maxBackoffMs, resetKey]);

  return {
    pollNow: useCallback(() => runNowRef.current(), [])
  };
}

export type { PollingError };
