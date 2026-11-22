import { getAdviceMeta } from "@/domain/advice";
import { getDictionary } from "@/lib/i18n";
import {
  detectPromptInjection,
  sanitizeModelOutput,
  sanitizeQuestion,
} from "@/lib/sanitize";
import { buildFacts, groundedOn, introLine } from "./facts";
import { callGemini, thinkingConfigFor } from "./geminiClient";
import { groundedAnswer, INTENTS } from "./groundedFallback";
import { buildSystemPrompt, looksLikePromptLeak } from "./prompts";
import { answerSources } from "./sources";
import type { AssistantAnswer, AssistantInput, GeminiResult } from "./types";

export type { AssistantAnswer, AssistantInput, GeminiResult };
export {
  answerSources,
  buildFacts,
  buildSystemPrompt,
  callGemini,
  groundedAnswer,
  groundedOn,
  INTENTS,
  introLine,
  looksLikePromptLeak,
  thinkingConfigFor,
};

/**
 * Answers a question with the best available provider.
 *
 * Evaluation Order:
 *  1. Deterministic prompt-injection guard (blocks attacks without LLM call).
 *  2. Gemini GenAI model when GEMINI_API_KEY is configured.
 *  3. Grounded deterministic responder (used when key is absent or upstream fails).
 */
export async function answerQuestion(
  input: AssistantInput,
): Promise<AssistantAnswer> {
  const dict = getDictionary(input.language);
  const injection = detectPromptInjection(input.question);

  if (injection.suspicious) {
    return {
      answer: dict.assistant.injectionBlocked,
      provider: "guard",
      blocked: true,
      groundedOn: groundedOn(input.snapshot),
      sources: [],
    };
  }

  const question = sanitizeQuestion(input.question, 500);
  if (question.length < 2) {
    return groundedAnswer(question, input, "assistant.offlineNotice");
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    try {
      const result = await callGemini(question, buildSystemPrompt(input));
      if (result) {
        const answer = sanitizeModelOutput(result.text, 2000);
        if (answer && !looksLikePromptLeak(answer)) {
          return {
            answer,
            provider: "gemini",
            model: result.model,
            blocked: false,
            groundedOn: groundedOn(input.snapshot),
            sources: getAdviceMeta(input.snapshot.category).sourceIds,
          };
        }
      }
    } catch (error) {
      console.warn(
        "[assistant] Gemini request failed",
        error instanceof Error ? error.message : error,
      );
    }
    return groundedAnswer(question, input, "assistant.fallbackNotice");
  }

  return groundedAnswer(question, input, "assistant.offlineNotice");
}
