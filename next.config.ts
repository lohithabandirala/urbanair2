import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * Security headers that are safe to set globally.
 *
 * The Content-Security-Policy is intentionally *not* here: it is generated
 * per-request with a nonce in `proxy.ts`, so that no inline script can
 * execute even if an injection bug is ever introduced.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-XSS-Protection", value: "0" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack ignores unrelated parent lockfiles.
  // `fileURLToPath` keeps this working on Node 20.9/20.10, where
  // `import.meta.dirname` is not available yet.
  turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) },
  // The E2E runner may reach the dev server through either hostname.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // API responses are user/location specific: never cache at the edge
        // without the explicit s-maxage set by the route handlers.
        source: "/api/(.*)",
        headers: [{ key: "Vary", value: "Accept-Encoding" }],
      },
    ];
  },
};

export default nextConfig;
