import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { buildCsp, createNonce } from "../proxy";

const ROOT = process.cwd();

/** Every non-test source file we ship to the browser or server. */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      sourceFiles(full, acc);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry)) continue;
    acc.push(full);
  }
  return acc;
}

const FILES = Array.from(
  new Set([
    ...sourceFiles(path.join(ROOT, "src")),
    path.join(ROOT, "src", "proxy.ts"),
    path.join(ROOT, "next.config.ts"),
  ]),
).map((file) => ({
  file,
  relative: path.relative(ROOT, file),
  text: readFileSync(file, "utf8"),
}));

describe("security: no unsafe HTML or code execution", () => {
  it("never uses dangerouslySetInnerHTML", () => {
    const offenders = FILES.filter(({ text }) =>
      text.includes("dangerouslySetInnerHTML"),
    ).map(({ relative }) => relative);
    expect(offenders).toEqual([]);
  });

  it("never assigns raw innerHTML/outerHTML", () => {
    const offenders = FILES.filter(({ text }) =>
      /\.(inner|outer)HTML\s*=/.test(text),
    ).map(({ relative }) => relative);
    expect(offenders).toEqual([]);
  });

  it("never calls eval or the Function constructor", () => {
    const offenders = FILES.filter(({ text }) =>
      /(^|[^.\w])eval\s*\(|new\s+Function\s*\(/.test(text),
    ).map(({ relative }) => relative);
    expect(offenders).toEqual([]);
  });

  it("never uses document.write", () => {
    const offenders = FILES.filter(({ text }) =>
      /document\.write/.test(text),
    ).map(({ relative }) => relative);
    expect(offenders).toEqual([]);
  });

  it("opens external links with noopener noreferrer", () => {
    const offenders = FILES.filter(({ text }) => {
      if (!text.includes('target="_blank"')) return false;
      return !/rel="[^"]*noopener[^"]*"/.test(text);
    }).map(({ relative }) => relative);
    expect(offenders).toEqual([]);
  });
});

describe("security: secrets stay out of source", () => {
  const SECRET_PATTERNS: Array<[string, RegExp]> = [
    ["Google API key", /AIza[0-9A-Za-z_-]{35}/],
    ["Google Gemini key", /\bAQ\.[A-Za-z0-9_-]{30,}/],
    ["OpenAI-style key", /\bsk-[A-Za-z0-9]{20,}/],
    ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
    ["private key block", /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/],
  ];

  for (const [name, pattern] of SECRET_PATTERNS) {
    it(`does not contain a ${name}`, () => {
      const offenders = FILES.filter(({ text }) => pattern.test(text)).map(
        ({ relative }) => relative,
      );
      expect(offenders).toEqual([]);
    });
  }
});

describe("security: response headers", () => {
  it("sets hardening headers on every route", async () => {
    const rules = await nextConfig.headers?.();
    expect(rules).toBeTruthy();
    const global = rules!.find((rule) => rule.source === "/(.*)");
    expect(global).toBeTruthy();

    const headers = Object.fromEntries(
      global!.headers.map(({ key, value }) => [key.toLowerCase(), value]),
    );

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
    expect(headers["x-permitted-cross-domain-policies"]).toBe("none");
    expect(headers["x-xss-protection"]).toBe("0");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });

  it("sends the Gemini key in a header, never in the URL", () => {
    const assistant = FILES.find(({ relative }) =>
      /services[\\/]assistant\.ts$/.test(relative),
    );
    expect(assistant).toBeTruthy();
    expect(assistant!.text).toContain('"x-goog-api-key"');
    expect(assistant!.text).not.toMatch(/generateContent\?key=/);
  });

  it("does not ship a weak global CSP (it is per-request instead)", async () => {
    const rules = await nextConfig.headers?.();
    const global = rules!.find((rule) => rule.source === "/(.*)");
    expect(
      global!.headers.some(({ key }) => /content-security-policy/i.test(key)),
    ).toBe(false);
  });
});

describe("security: content security policy", () => {
  it("creates a unique nonce per request", () => {
    const first = createNonce();
    const second = createNonce();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(10);
  });

  it("locks scripts to the nonce in production", () => {
    const csp = buildCsp("abc123", false);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("'unsafe-inline'; script");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("only relaxes the policy for development HMR", () => {
    const csp = buildCsp("dev-nonce", true);
    expect(csp).toContain("'nonce-dev-nonce'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});
