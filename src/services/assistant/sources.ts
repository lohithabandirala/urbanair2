import { SOURCES } from "@/domain/advice";

/**
 * Resolves authoritative source metadata for the UI's "grounded on" citations.
 */
export function answerSources(ids: string[]) {
  return ids
    .map((id) => SOURCES[id])
    .filter((source): source is NonNullable<typeof source> => Boolean(source));
}
