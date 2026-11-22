# Saaf Hawa — Urban Air Quality Assistant

Saaf Hawa (Hindi for “clean air”) is a Next.js + TypeScript assistant for families
coping with urban air pollution. It combines **live, provenance-tagged air quality**
with a personalised day plan, an indoor-air checklist, a commute-impact calculator,
and a **grounded** GenAI assistant. The interface is available in **English and Hindi**.

The project is deliberately honest about data: every reading carries its source,
freshness and timestamp, and the UI never presents sample or modelled data as a
station measurement.

---

## Table of contents

- [What it does](#what-it-does)
- [Data sources and provenance](#data-sources-and-provenance)
- [GenAI grounding and safety](#genai-grounding-and-safety)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API](#api)
- [Security](#security)
- [Accessibility](#accessibility)
- [Efficiency](#efficiency)
- [Testing](#testing)
- [Rubric mapping](#rubric-mapping)
- [Project structure](#project-structure)
- [Deployment](#deployment)
- [Limitations and disclaimers](#limitations-and-disclaimers)

---

## What it does

| Area | Behaviour |
| --- | --- |
| **Live air quality** | Fetches PM2.5, PM10, NO₂, SO₂, CO, O₃ and NH₃, recalculates the CPCB-style AQI in code, and shows the dominant pollutant, category, timestamp and source. |
| **Personalised day plan** | Splits the day into morning, midday and evening windows using the hourly forecast, then recommends the best window for outdoor activity based on AQI and the user’s profile. |
| **Advisories and smog alerts** | Category-specific, bilingual health guidance with authoritative sources. Urgent categories use an assertive live region. |
| **Indoor checklist** | Category- and cooking-fuel-aware actions (ventilate, close windows, run a purifier, avoid candles, damp-dust, etc.) with progress tracking and reset. |
| **Impact calculator** | Compares a current commute with a cleaner alternative using indicative per-passenger emission factors (CO₂, PM2.5, NOx). Clearly labelled as an estimate, not local AQI. |
| **Grounded assistant** | Answers questions about the current snapshot. It never invents readings: the server re-fetches air quality from the validated location before answering. |
| **Profile** | Commute mode, cooking fuel, vulnerable groups and outdoor-exercise preference are stored locally and shape the plan and checklist. |
| **Bilingual UI** | Full English and Hindi dictionaries, including dynamic advice, alerts and plan notes. |
| **Shareable plan** | Copies a plain-text summary (city, AQI, source, best window, disclaimer) to the clipboard, with a manual fallback. |

### Honest data labelling

- `freshness: "live"` — a live provider responded.
- `freshness: "cached"` — a recently cached live response is being served.
- `freshness: "sample"` / `isLive: false` — every live provider failed; a
  deterministic sample is shown with a prominent red **Sample data** banner and
  the note `source.notes.sample`.
- Modelled sources (Open-Meteo/CAMS) are labelled **modelled**, never “measured”.

---

## Data sources and provenance

No API key is required to run the app.

| Provider | Kind | Key required | Role |
| --- | --- | --- | --- |
| **CPCB / data.gov.in** | Official Indian station measurements | `CPCB_API_KEY` (optional) | Preferred when configured. Station-level PM2.5/PM10/NO₂/SO₂/CO/O₃/NH₃. |
| **WAQI** | Aggregated station measurements | `WAQI_TOKEN` (optional) | Station-level fallback. WAQI’s own AQI is **ignored**; AQI is recalculated from concentrations. |
| **Open-Meteo Air Quality (CAMS)** | Global modelled air quality | None | Keyless default. Real live model data, clearly labelled as modelled. |
| **Open-Meteo Weather** | Modelled weather | None | Temperature, humidity, wind, precipitation probability. |
| **Open-Meteo Geocoding** | Place search / reverse lookup | None | Location search with a built-in offline city list fallback. |
| **OpenWeatherMap** | Weather | `OPENWEATHER_API_KEY` (optional) | Alternative weather provider. |
| **Google Gemini** | Language model | `GEMINI_API_KEY` (optional) | Optional narrative generation. A deterministic grounded responder is used when absent. |

### Provider fallback chain

```
CPCB (if key) → WAQI (if token) → Open-Meteo/CAMS → stale cache → labelled sample
```

Each provider is wrapped in a stale-while-revalidate cache and a short failure
cooldown so one flaky upstream does not slow every request. A provider that
returns no particulate reading is treated as partial and the next provider is
tried.

### AQI calculation

AQI is always recalculated in code from raw concentrations using CPCB
breakpoints (`src/domain/breakpoints.ts`, `src/domain/aqi.ts`). This avoids
mixing incompatible AQI scales from different providers. The dominant pollutant
is the one with the highest sub-index.

---

## GenAI grounding and safety

The assistant is an **explanation layer**, not a data source.

1. The client sends `{ question, language, location, profile? }`.
2. Zod validates the payload. Unknown top-level keys are rejected (`.strict()`).
3. The server **re-fetches** air quality for the validated location. Client-supplied
   AQI values are not accepted, so a caller cannot fabricate the facts.
4. Obvious prompt-injection attempts are refused before any model call.
5. The model receives a compact facts object (readings, category, source,
   timestamp, profile flags) and is asked to explain them in the selected language.
6. Model output is sanitised, length-limited and rendered as **plain React text**.
   No HTML is ever interpreted.
7. If Gemini is unavailable or not configured, a deterministic responder builds
   an answer from the same snapshot and translated advice.

Gemini 3.x Flash can spend its output budget on hidden reasoning, so Flash
requests disable thinking and allow up to 45 seconds before falling back. This
keeps answers from being empty and gives cold requests enough time to complete.

The UI displays the provider (`Gemini`, `Grounded fallback`, or `Guard`), a
fallback notice when relevant, and links to the underlying public sources.

---

## Architecture

```
Browser (React 19 client components)
  ├─ LanguageProvider (EN/HI, html lang, localStorage)
  ├─ AppShell
  │   ├─ LocationPicker ──► GET /api/geocode
  │   ├─ WeatherStrip ────► GET /api/weather
  │   ├─ AQIGauge / PollutantTable / SourceBadge
  │   ├─ SmogAlert / AdvisoryBanner
  │   ├─ DayPlan / SharePlan
  │   ├─ IndoorChecklist
  │   ├─ ImpactCalculator
  │   ├─ ChatAssistant ──► POST /api/assistant
  │   └─ ProfilePanel
  │
  └─ Next.js route handlers (server only)
      ├─ /api/air        → services/air (provider chain + cache)
      ├─ /api/weather    → services/weather
      ├─ /api/geocode    → services/geocode
      ├─ /api/assistant  → services/assistant (Gemini or grounded fallback)
      └─ /api/health     → deployment probe (booleans only)
```

### Layering

- `src/domain` — pure, deterministic logic: AQI breakpoints, advice metadata,
  day planning, indoor actions, emission factors. No I/O.
- `src/lib` — infrastructure helpers: config, cache, HTTP, validation, errors,
  rate limiting, sanitisation, formatting, i18n.
- `src/services` — upstream integrations and orchestration. All network access
  lives here, so fetch logic is not duplicated in components.
- `src/hooks` — small client hooks (`useApiResource`, `useLocalStorage`,
  `useNowHour`, `useProfile`).
- `src/components` — presentational and interactive React components.
- `src/app` — App Router pages and route handlers.

Server-only secrets are read from `process.env` in server modules only. No
`NEXT_PUBLIC_*` secret exists.

---

## Getting started

### Prerequisites

- Node.js **20.9+** (developed on Node 25.2.1)
- npm 11+
- For E2E only: Playwright Chromium

### Install and run

```bash
npm install

# Optional: add keys (the app works without them)
cp .env.example .env.local        # macOS/Linux
# Copy-Item .env.example .env.local   # PowerShell

npm run dev
```

Open <http://localhost:3000>.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack). |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint (Next.js config). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Vitest unit, API, component and security tests. |
| `npm run test:coverage` | Vitest with V8 coverage and thresholds. |
| `npm run test:e2e` | Playwright E2E (desktop + mobile Chromium). |
| `npm run verify` | Lint → typecheck → unit tests → production build. |

First-time E2E setup:

```bash
npx playwright install chromium
```

---

## Environment variables

All variables are **optional**. Keys are server-side only; never prefix them with
`NEXT_PUBLIC_`.

| Variable | Default | Description |
| --- | --- | --- |
| `CPCB_API_KEY` | — | data.gov.in / CPCB API key. Enables official station data. |
| `CPCB_RESOURCE_ID` | `3b01bcb8-…` | Optional override for the data.gov.in resource. |
| `WAQI_TOKEN` | — | World Air Quality Index token. Enables station-level fallback. |
| `OPENWEATHER_API_KEY` | — | OpenWeatherMap key for weather. |
| `GEMINI_API_KEY` | — | Google Gemini key. Enables model-generated explanations. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name. |
| `PLAYWRIGHT_BASE_URL` | `http://localhost:3000` | Point E2E at an already-running server. |

---

## API

All responses use a consistent envelope:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": { "code": "invalid_input", "message": "...", "details": [...] } }
```

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/air?city=Delhi` or `?lat=28.61&lon=77.20&label=Delhi` | Provenance-tagged air-quality snapshot. |
| `GET` | `/api/weather?lat=…&lon=…` | Current weather and hourly forecast. |
| `GET` | `/api/geocode?q=Delhi` or `?lat=…&lon=…` | Forward search or reverse lookup. |
| `POST` | `/api/assistant` | Grounded answer to `{ question, language, location, profile? }`. |
| `GET` | `/api/health` | Status, version and boolean provider flags (no keys). |

Route handlers validate query/body with Zod, enforce body-size and content-type
limits, and return safe error envelopes. Unexpected errors are logged server-side
and never echoed to the client.

---

## Security

### Content Security Policy

- `src/proxy.ts` (Next.js 16 **Proxy**, formerly Middleware) generates a fresh
  nonce per request and sets a strict CSP.
- Production: `script-src 'self' 'nonce-…' 'strict-dynamic'`; no `unsafe-inline`
  or `unsafe-eval` for scripts.
- Development adds `'unsafe-eval'` and WebSocket origins only for HMR.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `frame-ancestors 'none'`, `upgrade-insecure-requests`.
- `src/app/page.tsx` calls `await connection()` so the page is dynamically
  rendered and Next.js can attach the per-request nonce.

### Response headers (`next.config.ts`)

`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: off`,
`Cross-Origin-Opener-Policy: same-origin`, a restrictive `Permissions-Policy`,
and HSTS. `X-Powered-By` is disabled.

### Input and output safety

- Every route validates input with Zod; schemas are `.strict()` and bounded.
- City labels reject angle brackets, braces, backticks and control characters.
- Request bodies are limited to 8 KB and must be `application/json`.
- The assistant rate-limits per client IP (10 requests/minute by default).
- Prompt-injection patterns are detected and refused before the model call.
- Model output is sanitised and rendered as React text nodes.
- **No `dangerouslySetInnerHTML`, raw `innerHTML`, `eval`, `new Function`, or
  `document.write` anywhere in shipped source.** A security test enforces this.
- External links use `rel="noopener noreferrer"` (also enforced by a test).
- A source scan checks for accidental Google/OpenAI/AWS keys and private-key blocks.

### Secret handling

- Keys are read at call time from `process.env` in server modules.
- `/api/health` exposes only booleans, never key values.
- `.env*` files are git-ignored; `.env.example` contains placeholders only.

> The rate limiter and cache are in-memory. In a multi-instance serverless
> deployment, use a shared store (Redis/KV) for global limits and cache sharing.

---

## Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `footer`, labelled `section`s.
- Skip link as the first focusable element; `main` is focusable.
- Exactly one `h1`; logical heading hierarchy.
- Visible, high-contrast `:focus-visible` ring on every control.
- All form controls have labels; grouped controls use `fieldset`/`legend`.
- Live regions: polite status for loading/refresh, assertive alerts for urgent
  AQI categories, chat `role="log"` with `aria-live="polite"`.
- The AQI gauge is an accessible `img` with a descriptive label plus a text scale.
- Progress bars expose `aria-valuenow`/`aria-valuemax`.
- Keyboard-operable location search, language switch, calculator, chat and
  checklist; `Escape` closes the location panel.
- `prefers-reduced-motion` disables smooth scrolling and animations.
- Full `lang` switching (`html[lang]` updates with the selected language).
- Automated axe checks run in component tests and E2E (WCAG 2.1 A/AA).
  Colour contrast is covered by the palette and disabled in automated scans
  because gradient backgrounds are not reliably measurable in jsdom/headless runs.

---

## Efficiency

- **Stale-while-revalidate cache** (`src/lib/cache.ts`) with per-resource TTLs:
  air 10 min (stale 6 h), weather 10 min (stale 3 h), geocode 24 h (stale 7 d).
- **Provider cooldowns** (5 min) prevent repeatedly hitting a failing upstream.
- **Parallel client fetches**: air and weather load independently and refresh together.
- **Route cache headers**: `s-maxage=300, stale-while-revalidate=3600` for air;
  `s-maxage=86400` for geocoding; `no-store` for assistant and health.
- **Server re-fetch only for the assistant**, where grounding correctness matters.
- **Minimal runtime dependencies**: `next`, `react`, `react-dom`, `zod` only.
- Turbopack production build; no client-side API keys or heavyweight SDKs.

---

## Testing

### Current results

| Suite | Result |
| --- | --- |
| Vitest unit / API / component / security | **286 passing** across 43 files |
| Playwright E2E (desktop + mobile Chromium) | **42 passing** (21 scenarios × 2 projects) |
| Statement coverage | **98.09%** |
| Branch coverage | **86.23%** |
| Function coverage | **100%** |
| Line coverage | **98.09%** |

Coverage thresholds are enforced for `src/domain`, `src/lib` and `src/services`
at 80% statements/lines/functions and 75% branches.

### Test layers

- **Domain tests** — AQI breakpoints and edge cases, emissions, advice metadata,
  day planning, indoor actions.
- **Lib tests** — cache TTL/stale behaviour, sanitisation, validation, formatting,
  rate limiting, HTTP helpers.
- **Service tests** — every provider parser, fallback ordering, caching, geocoding,
  weather, assistant grounding, injection guard and Gemini response handling.
- **API route tests** — success envelopes, validation errors, caching headers and
  error handling for all five routes.
- **Component tests** — Testing Library + user-event, including i18n and axe.
- **Security tests** — source scans for unsafe HTML/eval/secrets, header config,
  CSP production/development branches, nonce uniqueness.
- **E2E tests** — deterministic mocked APIs for the dashboard, sample labelling,
  refresh, Hindi switching, error/retry, calculator validation, chat success/error,
  keyboard navigation, axe scan, API contract and security headers.
- **API probes** — `/api/health`, invalid coordinates/geocode/assistant payloads,
  CSP and hardening headers.

### Commands

```bash
npm test                 # all Vitest suites
npm run test:coverage    # coverage + thresholds
npx playwright install chromium
npm run test:e2e         # E2E, starts the dev server automatically
npm run verify           # lint + typecheck + unit tests + build
```

---

## Rubric mapping

| Criterion | Weight | How it is addressed |
| --- | --- | --- |
| **Problem alignment** | 30% | Real live AQI with provenance; personalised day plan; indoor checklist; commute-impact calculator; grounded assistant; bilingual EN/HI; explicit sample/modelled labelling; vulnerable-group and cooking-fuel awareness. |
| **Code quality** | 20% | Strict TypeScript; pure domain layer; shared service layer (no duplicated fetches); small composable components; Zod schemas; consistent error envelope; documented modules; 286 unit/API/component tests. |
| **Security** | 15% | Per-request nonce CSP in `src/proxy.ts`; hardening headers; dynamic rendering; strict Zod validation; body limits; rate limiting; prompt-injection guard; sanitised plain-text output; no unsafe HTML/eval; server-only secrets; automated security scans. |
| **Efficiency** | 15% | SWR cache with stale windows; provider cooldowns; parallel air/weather fetches; route/CDN cache headers; minimal runtime dependencies; server re-fetch only where grounding requires it. |
| **Testing** | 10% | 286 Vitest tests + 42 Playwright E2E tests; 98.09% statement, 86.23% branch, 100% function coverage; security and accessibility suites. |
| **Accessibility** | 10% | Semantic landmarks, skip link, one h1, labels, live regions, keyboard support, visible focus, reduced motion, language switching, axe checks in component and E2E tests. |

---

## Project structure

```
.
├─ src/
│  ├─ app/
│  │  ├─ api/{air,weather,geocode,assistant,health}/route.ts
│  │  ├─ layout.tsx            # metadata, header/footer, language provider
│  │  ├─ page.tsx              # dynamic page (nonce CSP)
│  │  └─ globals.css
│  ├─ components/              # UI + component tests
│  ├─ domain/                  # pure AQI, advice, plan, indoor, emissions logic
│  ├─ hooks/                   # client data/localStorage/profile hooks
│  ├─ lib/                     # cache, config, http, validation, sanitise, i18n
│  ├─ services/                # providers, geocode, weather, assistant
│  ├─ test/                    # fixtures, render helper, security tests
│  └─ proxy.ts                 # per-request nonce CSP (Next.js 16 Proxy)
├─ e2e/                        # Playwright specs and fixtures
├─ next.config.ts              # security headers, Turbopack root
├─ vitest.config.ts            # jsdom, coverage thresholds
├─ playwright.config.ts        # desktop + mobile projects
└─ .env.example
```

> Next.js 16 renamed the `middleware` file convention to **Proxy**. This project
> uses `src/proxy.ts` with an exported `proxy()` function.

---

## Deployment

1. Build with `npm run build` and start with `npm start` (Node.js server), or
   deploy to a Next.js-compatible platform.
2. Set any optional provider keys as server-side environment variables.
3. Keep the page **dynamically rendered**: nonce-based CSP requires a fresh nonce
   per request. `src/app/page.tsx` already calls `await connection()`.
4. Do not cache HTML at the CDN unless the CSP/nonce strategy is changed; API
   routes already send explicit `s-maxage`/`stale-while-revalidate` headers.
5. For horizontally scaled deployments, replace the in-memory cache and rate
   limiter with a shared store.

---

## Limitations and disclaimers

- **Not medical advice.** Guidance is general and based on public health sources;
  individuals with medical conditions should follow clinician advice.
- **AQI is indicative.** When using Open-Meteo/CAMS, values are modelled and may
  differ from a nearby monitor. Station data depends on provider coverage.
- **Sample fallback.** If every live provider fails, the app shows clearly labelled
  sample data rather than an empty page.
- **Impact estimates** use indicative average emission factors and do not model
  vehicle age, fuel quality, load or local grid intensity precisely.
- **Rate limiting and caching are per process** unless a shared store is added.
- **Geolocation** is optional and only requested when the user presses
  “Use my location”.
- Open-Meteo/CAMS model output may lag observed conditions; the UI always shows
  the observation timestamp and source.

---

Built with Next.js 16, React 19, TypeScript 5.9, Zod 4, Tailwind CSS 4,
Vitest 3 and Playwright 1.65.
