import { en, type Dictionary } from "./en";
import { hi } from "./hi";

export type Language = "en" | "hi";

export const LANGUAGES: ReadonlyArray<{
  code: Language;
  label: string;
  htmlLang: string;
}> = [
  { code: "en", label: "English", htmlLang: "en" },
  { code: "hi", label: "हिन्दी", htmlLang: "hi" },
];

export const DICTIONARIES: Record<Language, Dictionary> = { en, hi };

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "hi";
}

export function getDictionary(language: Language): Dictionary {
  return DICTIONARIES[language] ?? en;
}

/** Replaces `{name}` placeholders without ever interpreting HTML. */
export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export { en, hi };
export type { Dictionary };
