import { categoryRank } from "./aqi";
import type { AqiCategory, CookingFuel } from "./types";

export type IndoorPriority = "essential" | "recommended" | "optional";

export interface IndoorChecklistItem {
  id: string;
  titleKey: string;
  detailKey: string;
  priority: IndoorPriority;
  /** Higher rank = more urgent; computed for the current AQI category. */
  rank: number;
}

interface IndoorDefinition {
  id: string;
  titleKey: string;
  detailKey: string;
  basePriority: IndoorPriority;
  minCategoryRank: number;
  maxCategoryRank: number;
}

const PRIORITY_ORDER: Record<IndoorPriority, number> = {
  essential: 0,
  recommended: 1,
  optional: 2,
};

/**
 * Indoor-air actions, filtered by the outdoor AQI category.
 *
 * The content follows WHO household-air-pollution guidance and US EPA
 * indoor-air guidance: ventilation when outdoor air is clean, sealing and
 * filtration when it is not, and eliminating indoor combustion sources.
 */
const DEFINITIONS: IndoorDefinition[] = [
  {
    id: "no-smoking",
    titleKey: "indoor.items.noSmoking.title",
    detailKey: "indoor.items.noSmoking.detail",
    basePriority: "essential",
    minCategoryRank: 0,
    maxCategoryRank: 5,
  },
  {
    id: "clean-cooking",
    titleKey: "indoor.items.cleanCooking.title",
    detailKey: "indoor.items.cleanCooking.detail",
    basePriority: "essential",
    minCategoryRank: 0,
    maxCategoryRank: 5,
  },
  {
    id: "exhaust",
    titleKey: "indoor.items.exhaust.title",
    detailKey: "indoor.items.exhaust.detail",
    basePriority: "essential",
    minCategoryRank: 0,
    maxCategoryRank: 5,
  },
  {
    id: "purifier",
    titleKey: "indoor.items.purifier.title",
    detailKey: "indoor.items.purifier.detail",
    basePriority: "recommended",
    minCategoryRank: 2,
    maxCategoryRank: 5,
  },
  {
    id: "close-windows",
    titleKey: "indoor.items.closeWindows.title",
    detailKey: "indoor.items.closeWindows.detail",
    basePriority: "essential",
    minCategoryRank: 3,
    maxCategoryRank: 5,
  },
  {
    id: "ventilate",
    titleKey: "indoor.items.ventilate.title",
    detailKey: "indoor.items.ventilate.detail",
    basePriority: "recommended",
    minCategoryRank: 0,
    maxCategoryRank: 2,
  },
  {
    id: "no-candles",
    titleKey: "indoor.items.noCandles.title",
    detailKey: "indoor.items.noCandles.detail",
    basePriority: "recommended",
    minCategoryRank: 2,
    maxCategoryRank: 5,
  },
  {
    id: "wet-dust",
    titleKey: "indoor.items.wetDust.title",
    detailKey: "indoor.items.wetDust.detail",
    basePriority: "recommended",
    minCategoryRank: 0,
    maxCategoryRank: 5,
  },
  {
    id: "humidity",
    titleKey: "indoor.items.humidity.title",
    detailKey: "indoor.items.humidity.detail",
    basePriority: "recommended",
    minCategoryRank: 0,
    maxCategoryRank: 5,
  },
  {
    id: "monitor",
    titleKey: "indoor.items.monitor.title",
    detailKey: "indoor.items.monitor.detail",
    basePriority: "optional",
    minCategoryRank: 0,
    maxCategoryRank: 5,
  },
];

export interface IndoorChecklistOptions {
  category: AqiCategory;
  cookingFuel?: CookingFuel;
}

export function getIndoorChecklist({
  category,
  cookingFuel = "lpg",
}: IndoorChecklistOptions): IndoorChecklistItem[] {
  const rawRank = categoryRank(category);
  const rank = rawRank < 0 ? 2 : rawRank;

  const items = DEFINITIONS.filter(
    (item) => rank >= item.minCategoryRank && rank <= item.maxCategoryRank,
  ).map((item) => {
    let priority = item.basePriority;

    // Burning biomass/kerosene indoors is an immediate health risk: promote
    // the clean-cooking action regardless of the outdoor index.
    if (
      item.id === "clean-cooking" &&
      (cookingFuel === "biomass" || cookingFuel === "kerosene")
    ) {
      priority = "essential";
    }
    if (item.id === "purifier" && rank >= 3) {
      priority = "essential";
    }

    return {
      id: item.id,
      titleKey: item.titleKey,
      detailKey: item.detailKey,
      priority,
      rank,
    };
  });

  return items.sort((a, b) => {
    const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (byPriority !== 0) return byPriority;
    return a.titleKey.localeCompare(b.titleKey);
  });
}
