# Accessibility & WCAG Compliance

UrbanAir is designed with a strict accessibility-first mindset to ensure families and users relying on assistive technology can navigate air quality data seamlessly.

---

## 1. Compliance Standard: WCAG 2.1 Level AA

| WCAG Principle | Feature Implementation |
| :--- | :--- |
| **Perceivable** | High contrast text ratios meeting AA standards; text equivalents for graphical gauges; descriptive `alt` tags and `aria-label`s; bilingual English/Hindi interface. |
| **Operable** | Complete keyboard operability (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape` to dismiss overlays); skip-to-content primary link; visible high-contrast focus rings (`:focus-visible`). |
| **Understandable** | Plain language descriptions of AQI levels; clear, honest data provenance labels (Live vs. Sample); clear error recovery steps with retry triggers. |
| **Robust** | Semantic HTML5 landmarks (`header`, `nav`, `main`, `section`, `footer`); ARIA live regions (`aria-live="polite"` for loading states, `aria-live="assertive"` for severe smog alerts, `role="log"` for chat history). |

---

## 2. Accessibility Testing Automation

- **Automated Axe Audits**: Every component test executes `expectNoA11yViolations(container)` powered by `axe-core`.
- **E2E Axe Scans**: Playwright test suites run accessibility tree audits in full browser render mode to validate contrast and DOM hierarchies.
- **Motion Reduction**: Honored via `prefers-reduced-motion: reduce` in `src/app/globals.css`.
