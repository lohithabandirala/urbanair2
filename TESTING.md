# Testing Strategy & Test Suite Guide

UrbanAir maintains comprehensive test coverage across unit, integration, security, accessibility, and end-to-end user journeys.

---

## 1. Testing Summary

| Test Layer | Framework | Count | Scope |
| :--- | :--- | :--- | :--- |
| **Domain Logic** | Vitest | 60+ tests | AQI breakpoints, CPCB sub-index math, day plan generation, emission math, location validation. |
| **Infrastructure & Lib** | Vitest | 70+ tests | Cache TTL & SWR semantics, rate limiting, validation schemas, HTTP client, formatters, i18n. |
| **Service Layer** | Vitest | 80+ tests | Provider parsers, fallback chains, geocoder offline fallback, Gemini prompt leakage guards, grounded assistant. |
| **API Route Handlers** | Vitest | 40+ tests | `/api/air`, `/api/weather`, `/api/geocode`, `/api/assistant`, `/api/health`. |
| **Component & A11y** | Vitest + React Testing Library + axe-core | 40+ tests | UI rendering, user interaction, keyboard actions, WCAG 2.1 AA audits. |
| **Security Suite** | Vitest (AST & regex scans) | 10+ tests | Nonce generation, CSP header validation, source sanitization, secret leak prevention. |
| **End-to-End (E2E)** | Playwright (Desktop + Mobile Chromium) | 42 tests | Full workflow verification, Hindi localization, offline fallback simulation, keyboard navigation. |

---

## 2. Running Tests

### Unit & Integration Suite:
```bash
npm test
```

### Coverage Report:
```bash
npm run test:coverage
```

### End-to-End Tests:
```bash
npm run test:e2e
```

### Full Verification Pipeline:
```bash
npm run verify
```
