"use client";

import { useEffect, useState } from "react";

/** Sensitive forms stay inert until their submit handler is attached. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}
