import { render, type RenderOptions } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement, ReactNode } from "react";
import { LanguageProvider } from "@/components/LanguageProvider";
import type { Language } from "@/lib/i18n";

interface RenderWithI18nOptions extends Omit<RenderOptions, "wrapper"> {
  language?: Language;
}

/**
 * Renders a component inside the real LanguageProvider (so translations and
 * the language toggle work) and inside a `<main>` landmark, which keeps axe's
 * page-level landmark rules meaningful for isolated components.
 */
export function renderWithI18n(
  ui: ReactElement,
  { language = "en", ...options }: RenderWithI18nOptions = {},
) {
  window.localStorage.setItem(
    "saaf-hawa.language.v1",
    JSON.stringify(language),
  );

  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <LanguageProvider>
        <main>{children}</main>
      </LanguageProvider>
    ),
    ...options,
  });
}

/**
 * Runs the WCAG 2.1 A/AA rule set against a container. Colour contrast is
 * skipped because jsdom has no layout engine; it is covered by the visual
 * review checklist and the token palette in globals.css.
 */
export async function expectNoA11yViolations(container: HTMLElement) {
  document.documentElement.lang = "en";
  if (!document.title) document.title = "Saaf Hawa test";

  const results = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
    rules: {
      "color-contrast": { enabled: false },
    },
  });

  return results.violations;
}
