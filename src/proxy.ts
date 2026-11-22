import { NextResponse, type NextRequest } from "next/server";

/**
 * Generates a fresh, unguessable nonce for a single request.
 *
 * Exported so the CSP can be unit-tested without booting the Next.js runtime.
 */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

/**
 * Builds the Content-Security-Policy string.
 *
 * Next.js reads the nonce from the CSP request header and attaches it to the
 * framework's own scripts, so `script-src` can stay free of `unsafe-inline`
 * in production. Development additionally allows `unsafe-eval` for HMR only.
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  // `'strict-dynamic'` makes host allowlists irrelevant in CSP3 browsers, so
  // every script must carry the per-request nonce. Development additionally
  // needs `'unsafe-eval'` for React's enhanced debugging.
  const scriptSrc = `'self' 'nonce-${nonce}' 'strict-dynamic'${
    isDev ? " 'unsafe-eval'" : ""
  }`;

  const connectSrc = isDev ? `'self' ws: wss:` : `'self'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Tailwind ships a stylesheet, but React sets a few inline style
    // attributes (e.g. the AQI gauge needle rotation).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/**
 * Generates a per-request nonce and a strict Content-Security-Policy.
 */
export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = createNonce();
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
