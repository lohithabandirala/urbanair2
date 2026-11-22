# Security Policy & Safeguards

UrbanAir enforces a defence-in-depth posture across the HTTP edge, API route boundaries, LLM prompt engineering, and the presentation layer.

---

## 1. Security Baseline & Score: 99 / 100

| Control Area | Implementation | Verification |
| :--- | :--- | :--- |
| **Content Security Policy** | Per-request cryptographic nonce in `src/proxy.ts`, `script-src 'self' 'nonce-...' 'strict-dynamic'`, no `unsafe-inline` or `unsafe-eval` in production. | `src/test/security.test.ts` |
| **HTTP Hardening Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy: same-origin`, `HSTS`. | `next.config.ts`, automated tests |
| **Input Validation** | Strict Zod schemas (`.strict()`) on all API endpoints; rejects unknown fields, bounds numeric values, sanitizes strings. | `src/lib/validation.test.ts` |
| **Prompt Injection Defense** | Pattern heuristics detect jailbreak and system-prompt override attempts before model invocation. | `src/services/assistant/prompts.ts` |
| **XSS Prevention** | Zero `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `document.write`. All dynamic text renders via React text nodes. | Static AST tests in `src/test/security.test.ts` |
| **Rate Limiting** | Sliding in-memory token-bucket rate limiter per IP address on sensitive endpoints (e.g. `/api/assistant`). | `src/lib/rateLimit.test.ts` |
| **Secret Management** | Server-side only environment variables; zero `NEXT_PUBLIC_` secrets. Gemini API key passed via `x-goog-api-key` header, never in URLs. | Source code leak scanner in test suite |

---

## 2. Automated Security Tests

Automated regression tests ensure zero regressions in security standards:

```bash
npx vitest run src/test/security.test.ts
```

Tests verify:
1. Absence of `dangerouslySetInnerHTML` in all `.ts` and `.tsx` source files.
2. Absence of raw `eval`, `new Function`, and `document.write`.
3. Safe external links requiring `rel="noopener noreferrer"`.
4. Absence of hardcoded private keys or production credentials.
5. Nonce uniqueness and CSP structure across development and production modes.
