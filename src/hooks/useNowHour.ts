"use client";

import { useSyncExternalStore } from "react";
import { hourInTimeZone } from "@/lib/format";

function subscribeToClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}

/**
 * Current local hour in the selected city. The server snapshot is null so
 * server and first client renders match; React then switches to the real
 * clock value after hydration and re-checks it every minute.
 */
export function useNowHour(timeZone?: string): number | null {
  return useSyncExternalStore(
    subscribeToClock,
    () => hourInTimeZone(timeZone),
    () => null,
  );
}
