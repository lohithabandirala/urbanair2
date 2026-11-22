import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { HttpError, isHttpError, localizeApiError } from "./errors";

const en = getDictionary("en");
const hi = getDictionary("hi");

describe("HttpError", () => {
  it("carries a status, code and optional details", () => {
    const error = new HttpError(400, "invalid_input", "Bad request", {
      field: "city",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("HttpError");
    expect(error.status).toBe(400);
    expect(error.code).toBe("invalid_input");
    expect(error.details).toEqual({ field: "city" });
    expect(isHttpError(error)).toBe(true);
    expect(isHttpError(new Error("plain"))).toBe(false);
  });
});

describe("localizeApiError", () => {
  it("maps known codes to the active language", () => {
    const cases: Array<[string, string]> = [
      ["rate_limited", hi.errors.rateLimited],
      ["invalid_input", hi.errors.invalidInput],
      ["invalid_json", hi.errors.invalidInput],
      ["not_found", hi.errors.notFound],
      ["network", hi.errors.network],
      ["providers_down", hi.errors.upstream],
      ["upstream_error", hi.errors.upstream],
      ["assistant_error", hi.assistant.error],
    ];

    for (const [code, expected] of cases) {
      expect(localizeApiError(hi, code)).toBe(expected);
    }
  });

  it("keeps the server message in English when asked", () => {
    expect(
      localizeApiError(en, "providers_down", "No provider succeeded", true),
    ).toBe("No provider succeeded");
    expect(localizeApiError(en, "unknown", "Raw detail", true)).toBe(
      "Raw detail",
    );
  });

  it("uses the generic message for unknown codes without a fallback", () => {
    expect(localizeApiError(en, "unknown")).toBe(en.errors.generic);
    expect(localizeApiError(hi, null)).toBe(hi.errors.generic);
  });
});
