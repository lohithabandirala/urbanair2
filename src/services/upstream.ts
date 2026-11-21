import type { z } from "zod";
import { FETCH_TIMEOUT_MS } from "@/lib/config";

export class UpstreamError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(message: string, provider: string, status?: number) {
    super(message);
    this.name = "UpstreamError";
    this.provider = provider;
    this.status = status;
  }
}

export interface FetchJsonOptions {
  provider: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/**
 * Fetches JSON with a hard timeout and consistent error handling.
 * The User-Agent identifies the app to public APIs such as Nominatim.
 */
export async function fetchJson(
  url: string,
  { provider, timeoutMs = FETCH_TIMEOUT_MS, headers = {} }: FetchJsonOptions,
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SaafHawa/1.0 (air-quality-assistant)",
        ...headers,
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    throw new UpstreamError(
      `${provider} request failed: ${
        error instanceof Error ? error.message : "network error"
      }`,
      provider,
    );
  }

  if (!response.ok) {
    throw new UpstreamError(
      `${provider} returned HTTP ${response.status}`,
      provider,
      response.status,
    );
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().includes("json")) {
    throw new UpstreamError(
      `${provider} returned a non-JSON response`,
      provider,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new UpstreamError(`${provider} returned invalid JSON`, provider);
  }
}

/** Validates an upstream payload and converts shape errors to UpstreamError. */
export function parseUpstream<S extends z.ZodType>(
  schema: S,
  data: unknown,
  provider: string,
): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new UpstreamError(
      `${provider} response did not match the expected shape`,
      provider,
    );
  }
  return result.data;
}
