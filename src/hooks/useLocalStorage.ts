"use client";

import { useEffect, useState } from "react";

interface StoredValue<T> {
  value: T;
  setValue: (value: T | ((previous: T) => T)) => void;
  hydrated: boolean;
  hadStoredValue: boolean;
}

/**
 * localStorage-backed state that is safe for server rendering.
 *
 * The initial render always uses `initialValue`; the stored value is applied
 * after mount. Writes are skipped until hydration so the initial value cannot
 * overwrite real data.
 */
export function useLocalStorage<T>(key: string, initialValue: T): StoredValue<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const [hadStoredValue, setHadStoredValue] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect --
   * Persisted state can only be read after mount: reading localStorage during
   * the initial render would make the client markup differ from the server. */
  useEffect(() => {
    let cancelled = false;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        if (!cancelled) {
          setValue(parsed);
          setHadStoredValue(true);
        }
      }
    } catch {
      // Corrupt or unavailable storage: keep the safe initial value.
    } finally {
      if (!cancelled) setHydrated(true);
    }
    return () => {
      cancelled = true;
    };
  }, [key]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota or private mode: the app still works in memory.
    }
  }, [key, value, hydrated]);

  return { value, setValue, hydrated, hadStoredValue };
}
