import { DEFAULT_PROFILE } from "@/domain/types";
import { RATE_LIMIT } from "@/lib/config";
import { HttpError } from "@/lib/errors";
import {
  getClientIp,
  handleRouteError,
  jsonOk,
  readJsonBody,
} from "@/lib/http";
import { checkRateLimit } from "@/lib/rateLimit";
import { assistantRequestSchema, parseOrThrow } from "@/lib/validation";
import { getAirQuality } from "@/services/air";
import { answerQuestion, answerSources } from "@/services/assistant";

export const dynamic = "force-dynamic";

/**
 * POST /api/assistant
 *
 * The server re-fetches the air quality snapshot from the validated location
 * instead of trusting a client-supplied reading. This prevents a caller from
 * fabricating the facts the model is grounded on.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = parseOrThrow(assistantRequestSchema, body);

    const limit = checkRateLimit(getClientIp(request), RATE_LIMIT);
    if (!limit.allowed) {
      throw new HttpError(
        429,
        "rate_limited",
        "Too many questions. Please wait a minute and try again.",
        undefined,
      );
    }

    const snapshot = await getAirQuality(parsed.location);
    const answer = await answerQuestion({
      question: parsed.question,
      language: parsed.language,
      location: parsed.location,
      snapshot,
      profile: parsed.profile ?? DEFAULT_PROFILE,
    });

    return jsonOk(
      {
        ...answer,
        sources: answerSources(answer.sources),
      },
      {
        cacheControl: "no-store",
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-Assistant-Provider": answer.provider,
        },
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
