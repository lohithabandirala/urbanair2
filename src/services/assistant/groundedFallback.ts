import { getAdviceMeta } from "@/domain/advice";
import { categoryRank } from "@/domain/aqi";
import { formatObservedAt, localeFor } from "@/lib/format";
import { getDictionary, interpolate } from "@/lib/i18n";
import { groundedOn, introLine } from "./facts";
import type { AssistantAnswer, AssistantInput } from "./types";

export const INTENTS = {
  windows: /(window|ventilat|open.*(house|home|room)|fresh air)/i,
  mask: /(mask|n95|respirator|cover.*face)/i,
  exercise: /(exercise|workout|run|jog|walk|cycle|outside|outdoor|play|sport)/i,
  sensitive:
    /(child|kid|baby|toddler|pregnan|elder|older|senior|asthma|heart|lung|copd|sensitive)/i,
  purifier: /(purifier|filter|hepa|air cleaner)/i,
  cooking: /(cook|kitchen|incense|candle|mosquito|biomass|wood|coal|kerosene|smoke)/i,
  commute:
    /(commute|travel|car|bike|bicycle|scooter|bus|metro|train|drive|transport|school run)/i,
  trees: /(tree|plant|green cover|forest)/i,
  aqi: /(aqi|index|reading|pm2\.?5|pm10|pollutant|how.*calculated|what.*mean)/i,
} as const;

export function groundedAnswer(
  question: string,
  input: AssistantInput,
  noticeKey: string,
): AssistantAnswer {
  const dict = getDictionary(input.language);
  const rank = categoryRank(input.snapshot.category);
  const advice = getAdviceMeta(input.snapshot.category);
  const lines: string[] = [introLine(input)];
  const g = dict.assistant.grounded;

  if (INTENTS.windows.test(question)) {
    lines.push(
      rank >= 3
        ? interpolate(g.windowsClosed, {
            category: dict.categories[input.snapshot.category],
          })
        : g.windowsOpen,
    );
  } else if (INTENTS.mask.test(question)) {
    lines.push(
      advice.mask === "everyone"
        ? g.maskEveryone
        : advice.mask === "sensitive"
          ? g.maskSensitive
          : g.maskNone,
    );
  } else if (INTENTS.exercise.test(question)) {
    lines.push(
      rank >= 3
        ? interpolate(g.exerciseAvoid, { aqi: input.snapshot.aqi ?? "—" })
        : rank === 2
          ? g.exerciseCaution
          : g.exerciseOk,
    );
  } else if (INTENTS.sensitive.test(question)) {
    lines.push(g.sensitive);
  } else if (INTENTS.purifier.test(question)) {
    lines.push(g.purifier);
  } else if (INTENTS.cooking.test(question)) {
    lines.push(g.cooking);
  } else if (INTENTS.commute.test(question)) {
    lines.push(
      interpolate(g.commute, {
        mode: dict.profile.commuteOptions[input.profile.commuteMode],
      }),
    );
  } else if (INTENTS.trees.test(question)) {
    lines.push(g.trees);
  } else if (INTENTS.aqi.test(question)) {
    lines.push(
      interpolate(g.aqiExplain, {
        dominant: input.snapshot.dominantPollutant
          ? dict.pollutants[input.snapshot.dominantPollutant]
          : dict.categories.unknown,
        source: input.snapshot.sourceLabel,
        time: formatObservedAt(
          input.snapshot.observedAt,
          localeFor(input.language),
          input.snapshot.location.timezone,
        ),
      }),
    );
  } else {
    lines.push(dict.advice[input.snapshot.category].detail);
    lines.push(
      ...dict.advice[input.snapshot.category].actions.slice(0, 2),
    );
  }

  return {
    answer: lines.join("\n\n"),
    provider: "grounded-fallback",
    noticeKey,
    blocked: false,
    groundedOn: groundedOn(input.snapshot),
    sources: advice.sourceIds,
  };
}
