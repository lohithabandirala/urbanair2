import type { AirQualitySnapshot } from "@/domain/types";
import { formatObservedAt, localeFor } from "@/lib/format";
import { getDictionary, interpolate } from "@/lib/i18n";
import type { AssistantAnswer, AssistantInput } from "./types";

export function groundedOn(snapshot: AirQualitySnapshot): AssistantAnswer["groundedOn"] {
  return {
    city: snapshot.location.city,
    aqi: snapshot.aqi,
    category: snapshot.category,
    dominantPollutant: snapshot.dominantPollutant,
    observedAt: snapshot.observedAt,
    source: snapshot.sourceLabel,
    freshness: snapshot.freshness,
  };
}

/**
 * Extracts verified, authoritative facts handed to the model.
 * Contains no secrets, and no raw user-controlled prompt strings.
 */
export function buildFacts(input: AssistantInput) {
  const dict = getDictionary(input.language);
  const advice = dict.advice[input.snapshot.category];
  return {
    location: {
      city: input.snapshot.location.city,
      region: input.snapshot.location.region ?? null,
      country: input.snapshot.location.country ?? null,
      latitude: input.snapshot.location.latitude,
      longitude: input.snapshot.location.longitude,
    },
    reading: {
      aqi: input.snapshot.aqi,
      category: input.snapshot.category,
      categoryLabel: dict.categories[input.snapshot.category],
      dominantPollutant: input.snapshot.dominantPollutant,
      observedAt: input.snapshot.observedAt,
      source: input.snapshot.sourceLabel,
      freshness: input.snapshot.freshness,
      pollutants: input.snapshot.readings
        .filter((reading) => reading.value !== null)
        .map((reading) => ({
          pollutant: reading.key,
          value: reading.value,
          unit: reading.unit,
          cpcbSubIndex: reading.subIndex,
        })),
    },
    publishedGuidance: {
      headline: advice.headline,
      detail: advice.detail,
      sensitiveGroups: advice.sensitive,
      mask: advice.mask,
      actions: advice.actions,
    },
    household: {
      commuteMode: input.profile.commuteMode,
      cookingFuel: input.profile.cookingFuel,
      vulnerableGroups: input.profile.vulnerableGroups,
      exercisesOutdoors: input.profile.exercisesOutdoors,
    },
  };
}

export function introLine(input: AssistantInput): string {
  const dict = getDictionary(input.language);
  if (input.snapshot.aqi === null) {
    return interpolate(dict.assistant.groundedNoReading, {
      city: input.snapshot.location.city,
    });
  }
  return interpolate(dict.assistant.groundedIntro, {
    city: input.snapshot.location.city,
    aqi: input.snapshot.aqi,
    category: dict.categories[input.snapshot.category],
    time: formatObservedAt(
      input.snapshot.observedAt,
      localeFor(input.language),
      input.snapshot.location.timezone,
    ),
  });
}
