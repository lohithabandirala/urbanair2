import { describe, expect, it } from "vitest";
import { getAdviceMeta, isSmogAlert, resolveSources, SOURCES } from "./advice";
import { AQI_CATEGORIES } from "./types";

describe("getAdviceMeta", () => {
  it("returns guidance for every category", () => {
    for (const category of AQI_CATEGORIES) {
      const meta = getAdviceMeta(category);
      expect(meta.category).toBe(category);
      expect(meta.sourceIds.length).toBeGreaterThan(0);
      expect(["info", "caution", "warning", "danger"]).toContain(meta.severity);
      expect(["none", "sensitive", "everyone"]).toContain(meta.mask);
      expect(["fine", "reduce", "avoid"]).toContain(meta.outdoor);
    }
  });

  it("escalates masks and urgency with severity", () => {
    expect(getAdviceMeta("good").mask).toBe("none");
    expect(getAdviceMeta("moderate").mask).toBe("sensitive");
    expect(getAdviceMeta("poor").mask).toBe("everyone");
    expect(getAdviceMeta("very-poor").urgent).toBe(true);
    expect(getAdviceMeta("severe").urgent).toBe(true);
    expect(getAdviceMeta("moderate").urgent).toBe(false);
  });
});

describe("isSmogAlert", () => {
  it("only alerts for the two most severe categories", () => {
    expect(isSmogAlert("very-poor")).toBe(true);
    expect(isSmogAlert("severe")).toBe(true);
    expect(isSmogAlert("poor")).toBe(false);
    expect(isSmogAlert("unknown")).toBe(false);
  });
});

describe("resolveSources", () => {
  it("resolves known ids in order and drops unknown ids", () => {
    const sources = resolveSources(["cpcbNaqi", "missing", "who2021"]);
    expect(sources.map((source) => source.id)).toEqual([
      "cpcbNaqi",
      "who2021",
    ]);
  });

  it("keeps every published source on https", () => {
    for (const source of Object.values(SOURCES)) {
      expect(source.url.startsWith("https://")).toBe(true);
      expect(source.publisher.length).toBeGreaterThan(0);
      expect(source.title.length).toBeGreaterThan(0);
    }
  });
});
