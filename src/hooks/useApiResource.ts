"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ApiState<T> {
  url: string | null;
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Minimal fetch hook with abort-on-unmount, manual refresh and a guarantee
 * that data from a previous location is cleared before new data arrives.
 */
export function useApiResource<T>(url: string | null) {
  const [state, setState] = useState<ApiState<T>>({
    url: null,
    data: null,
    loading: Boolean(url),
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const currentUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!url) {
      setState({ url: null, data: null, loading: false, error: null });
      currentUrl.current = null;
      return;
    }

    const controller = new AbortController();
    const urlChanged = currentUrl.current !== url;
    currentUrl.current = url;

    setState((previous) =>
      urlChanged
        ? { url, data: null, loading: true, error: null }
        : { ...previous, url, loading: true, error: null },
    );

    async function load() {
      try {
        const response = await fetch(url as string, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const body = (await response.json()) as {
          ok?: boolean;
          data?: T;
          error?: { message?: string };
        };

        if (!response.ok || body.ok !== true) {
          throw new Error(
            body.error?.message || `Request failed (${response.status})`,
          );
        }

        setState({
          url,
          data: body.data as T,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState((previous) => ({
          ...previous,
          url,
          loading: false,
          error:
            error instanceof Error ? error.message : "Request failed",
        }));
      }
    }

    void load();
    return () => controller.abort();
  }, [url, nonce]);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
