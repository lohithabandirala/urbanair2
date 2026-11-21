import { describe, expect, it } from "vitest";
import { en } from "./en";
import { hi } from "./hi";
import {
  getDictionary,
  interpolate,
  isLanguage,
  LANGUAGES,
  type Language,
} from "./index";

function collectStrings(
  value: unknown,
  path = "",
  out: Array<[string, string]> = [],
): Array<[string, string]> {
  if (typeof value === "string") {
    out.push([path, value]);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectStrings(entry, `${path}[${index}]`, out),
    );
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      collectStrings(entry, path ? `${path}.${key}` : key, out);
    }
  }
  return out;
}

describe("dictionary parity", () => {
  const enStrings = collectStrings(en);
  const hiStrings = collectStrings(hi);

  it("has the same string paths in English and Hindi", () => {
    expect(hiStrings.map(([path]) => path)).toEqual(
      enStrings.map(([path]) => path),
    );
  });

  it("has no empty or whitespace-only strings", () => {
    for (const [path, value] of [...enStrings, ...hiStrings]) {
      expect(value.trim(), path).not.toBe("");
    }
  });

  it("actually translates the interface", () => {
    expect(hi.app.tagline).not.toBe(en.app.tagline);
    expect(hi.dashboard.title).not.toBe(en.dashboard.title);
    expect(hi.assistant.title).not.toBe(en.assistant.title);
  });
});

describe("interpolate", () => {
  it("replaces named placeholders", () => {
    expect(interpolate("AQI {aqi} in {city}", { aqi: 250, city: "Delhi" })).toBe(
      "AQI 250 in Delhi",
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(interpolate("{known} and {unknown}", { known: "yes" })).toBe(
      "yes and {unknown}",
    );
  });

  it("returns the template when no variables are supplied", () => {
    expect(interpolate("Hello {name}")).toBe("Hello {name}");
  });

  it("does not evaluate markup or expressions", () => {
    expect(interpolate("{value}", { value: "<b>250</b>" })).toBe("<b>250</b>");
  });
});

describe("isLanguage", () => {
  it("accepts only supported language codes", () => {
    expect(isLanguage("en")).toBe(true);
    expect(isLanguage("hi")).toBe(true);
    expect(isLanguage("fr")).toBe(false);
    expect(isLanguage(null)).toBe(false);
    expect(isLanguage(1)).toBe(false);
  });
});

describe("getDictionary", () => {
  it("returns the matching dictionary", () => {
    expect(getDictionary("en")).toBe(en);
    expect(getDictionary("hi")).toBe(hi);
  });

  it("falls back to English for an unsupported code", () => {
    expect(getDictionary("fr" as unknown as Language)).toBe(en);
  });
});

describe("LANGUAGES", () => {
  it("declares both languages with HTML language tags", () => {
    expect(LANGUAGES).toEqual([
      { code: "en", label: "English", htmlLang: "en" },
      { code: "hi", label: "हिन्दी", htmlLang: "hi" },
    ]);
  });
});
