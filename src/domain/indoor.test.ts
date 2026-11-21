import { describe, expect, it } from "vitest";
import { getIndoorChecklist } from "./indoor";

describe("getIndoorChecklist", () => {
  it("prioritises ventilation when the outdoor air is clean", () => {
    const items = getIndoorChecklist({ category: "good" });
    const ids = items.map((item) => item.id);

    expect(ids).toContain("ventilate");
    expect(ids).toContain("wet-dust");
    expect(ids).not.toContain("purifier");
    expect(ids).not.toContain("close-windows");
    expect(ids).not.toContain("no-candles");
    expect(items).toHaveLength(7);
  });

  it("prioritises sealing and filtration when the air is severe", () => {
    const items = getIndoorChecklist({ category: "severe" });
    const ids = items.map((item) => item.id);

    expect(ids).toContain("purifier");
    expect(ids).toContain("close-windows");
    expect(ids).toContain("no-candles");
    expect(ids).not.toContain("ventilate");

    const purifier = items.find((item) => item.id === "purifier");
    expect(purifier?.priority).toBe("essential");
  });

  it("uses a moderate baseline for unknown readings", () => {
    const items = getIndoorChecklist({ category: "unknown" });
    const ids = items.map((item) => item.id);

    expect(ids).toContain("purifier");
    expect(ids).toContain("ventilate");
    expect(ids).not.toContain("close-windows");

    const purifier = items.find((item) => item.id === "purifier");
    expect(purifier?.priority).toBe("recommended");
  });

  it("sorts by priority and then by translation key", () => {
    const items = getIndoorChecklist({ category: "severe" });
    const priorities = items.map((item) => item.priority);
    const rank = { essential: 0, recommended: 1, optional: 2 };

    for (let i = 1; i < priorities.length; i += 1) {
      const previous = rank[priorities[i - 1] as keyof typeof rank];
      const current = rank[priorities[i] as keyof typeof rank];
      expect(previous).toBeLessThanOrEqual(current);
    }

    const essentials = items.filter((item) => item.priority === "essential");
    const keys = essentials.map((item) => item.titleKey);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  it("keeps clean cooking essential for biomass and kerosene", () => {
    for (const cookingFuel of ["biomass", "kerosene"] as const) {
      const items = getIndoorChecklist({ category: "good", cookingFuel });
      const cooking = items.find((item) => item.id === "clean-cooking");
      expect(cooking?.priority).toBe("essential");
    }
  });

  it("returns only known checklist ids with translation keys", () => {
    const items = getIndoorChecklist({ category: "poor" });
    for (const item of items) {
      expect(item.titleKey.startsWith("indoor.items.")).toBe(true);
      expect(item.detailKey.startsWith("indoor.items.")).toBe(true);
      expect(item.rank).toBe(3);
    }
  });
});
