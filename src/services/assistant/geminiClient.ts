import { z } from "zod";
import { getGeminiModel } from "@/lib/config";
import type { GeminiResult } from "./types";

const geminiResponseSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({
            content: z
              .object({
                parts: z
                  .array(z.object({ text: z.string().optional() }).passthrough())
                  .optional(),
              })
              .passthrough()
              .optional(),
            finishReason: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    promptFeedback: z
      .object({ blockReason: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** Flash models can spend the whole output budget on hidden reasoning. */
export function thinkingConfigFor(model: string) {
  return /^gemini-(?:2\.5|3(?:\.\d+)?)-flash/i.test(model)
    ? { thinkingBudget: 0 }
    : undefined;
}

export async function callGemini(
  question: string,
  systemPrompt: string,
  model = getGeminiModel(),
): Promise<GeminiResult | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent`;
  const thinkingConfig = thinkingConfigFor(model);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Keep the key out of the URL so it cannot leak through proxy or access
      // logs. Google's API accepts the same credential in this header.
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: question }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 500,
        ...(thinkingConfig ? { thinkingConfig } : {}),
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    }),
    // Gemini 3.x flash can take 30s+ on a cold request; keep the fallback fast
    // but give the model enough room to answer.
    signal: AbortSignal.timeout(45_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Gemini returned HTTP ${response.status}`);
  }

  const parsed = geminiResponseSchema.safeParse(await response.json());
  if (!parsed.success) return null;
  if (parsed.data.promptFeedback?.blockReason) return null;

  const text = (parsed.data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .filter(Boolean)
    .join("\n");

  return text ? { text, model } : null;
}
