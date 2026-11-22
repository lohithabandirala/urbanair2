"use client";

import { useI18n } from "./LanguageProvider";

/**
 * The first focusable element on the page. It lives in a client component so
 * its label follows the selected language instead of staying English.
 */
export function SkipLink() {
  const { dict } = useI18n();

  return (
    <a href="#main" className="skip-link">
      {dict.app.skipToContent}
    </a>
  );
}
