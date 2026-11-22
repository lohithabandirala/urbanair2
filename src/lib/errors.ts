import type { Dictionary } from "./i18n";

/** A typed error that route handlers can safely turn into a JSON response. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/**
 * Maps a safe API error code to the active dictionary. English keeps the
 * server's specific message (useful for debugging); other languages get a
 * translated message instead of an English fallback.
 */
export function localizeApiError(
  dict: Dictionary,
  code: string | null | undefined,
  fallback?: string | null,
  preferFallback = false,
): string {
  if (preferFallback && fallback) return fallback;

  switch (code) {
    case "rate_limited":
      return dict.errors.rateLimited;
    case "invalid_input":
    case "invalid_json":
      return dict.errors.invalidInput;
    case "not_found":
      return dict.errors.notFound;
    case "network":
      return dict.errors.network;
    case "providers_down":
    case "upstream_error":
      return dict.errors.upstream;
    case "assistant_error":
      return dict.assistant.error;
    default:
      return preferFallback && fallback ? fallback : dict.errors.generic;
  }
}
