/**
 * Grounded conversational assistant service for urban air quality guidance.
 *
 * Security: Gemini requests authenticate strictly via the "x-goog-api-key" header.
 * Modular implementation is organized under `./assistant/`.
 */
export * from "./assistant/index";
