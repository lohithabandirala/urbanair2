import { HttpError, isHttpError } from "./errors";
import { MAX_BODY_BYTES } from "./config";

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export interface JsonOptions {
  status?: number;
  cacheControl?: string;
  headers?: Record<string, string>;
}

export function jsonOk<T>(data: T, options: JsonOptions = {}): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: options.status ?? 200,
    headers: {
      ...JSON_HEADERS,
      "Cache-Control": options.cacheControl ?? "no-store",
      ...options.headers,
    },
  });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(
    JSON.stringify({ ok: false, error: { code, message, details } }),
    {
      status,
      headers: {
        ...JSON_HEADERS,
        "Cache-Control": "no-store",
        ...headers,
      },
    },
  );
}

/**
 * Converts any thrown value into a safe JSON response. Unexpected errors are
 * logged server-side but never echoed to the client.
 */
export function handleRouteError(error: unknown): Response {
  if (isHttpError(error)) {
    return jsonError(
      error.status,
      error.code,
      error.message,
      error.details,
      error.status === 429 ? { "Retry-After": "60" } : {},
    );
  }
  console.error("[api] unhandled error", error);
  return jsonError(500, "internal_error", "Something went wrong.");
}

export async function readJsonBody(
  request: Request,
  maxBytes = MAX_BODY_BYTES,
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new HttpError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json.",
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, "payload_too_large", "Request body is too large.");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new HttpError(413, "payload_too_large", "Request body is too large.");
  }
  if (!text.trim()) {
    throw new HttpError(400, "invalid_json", "Request body is empty.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Collects non-empty query parameters into a plain object for validation. */
export function queryObject(url: string): Record<string, string> {
  const params = new URL(url).searchParams;
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    if (value.trim() !== "") result[key] = value;
  });
  return result;
}
