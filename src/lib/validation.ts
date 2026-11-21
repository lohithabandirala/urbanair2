import { z } from "zod";
import {
  COMMUTE_MODES,
  COOKING_FUELS,
  VULNERABLE_GROUPS,
} from "@/domain/types";
import { HttpError } from "./errors";

/**
 * City labels allow letters (including Indic scripts), combining marks,
 * digits, spaces and common punctuation. Explicitly excludes angle brackets,
 * braces, backticks and control characters.
 */
const cityLabel = z
  .string()
  .trim()
  .min(1, "City name is required.")
  .max(80, "City name is too long.")
  .regex(
    /^[\p{L}\p{M}\p{N}\s.,'’"()\-/&+]+$/u,
    "City name contains unsupported characters.",
  );

const regionLabel = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{M}\p{N}\s.,'’"()\-/&+]+$/u, "Invalid region name.");

const latitude = z.coerce
  .number()
  .finite()
  .min(-90, "Latitude must be between -90 and 90.")
  .max(90, "Latitude must be between -90 and 90.");

const longitude = z.coerce
  .number()
  .finite()
  .min(-180, "Longitude must be between -180 and 180.")
  .max(180, "Longitude must be between -180 and 180.");

export const locationSchema = z
  .object({
    city: cityLabel,
    region: regionLabel.optional(),
    country: z.string().trim().max(120).optional(),
    countryCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, "Country code must be two letters.")
      .optional(),
    latitude,
    longitude,
    timezone: z.string().trim().max(64).optional(),
  })
  .strict();

export const profileSchema = z
  .object({
    commuteMode: z.enum(COMMUTE_MODES),
    cookingFuel: z.enum(COOKING_FUELS),
    vulnerableGroups: z
      .array(z.enum(VULNERABLE_GROUPS))
      .max(VULNERABLE_GROUPS.length)
      .default([]),
    exercisesOutdoors: z.boolean(),
  })
  .strict();

/**
 * Query parameters for /api/air and /api/weather. Either a city name or a
 * latitude/longitude pair is required; supplying only one coordinate fails.
 */
export const locationQuerySchema = z
  .object({
    city: cityLabel.optional(),
    lat: latitude.optional(),
    lon: longitude.optional(),
    label: regionLabel.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasCity = Boolean(value.city);
    const hasLat = value.lat !== undefined;
    const hasLon = value.lon !== undefined;

    if (!hasCity && !(hasLat && hasLon)) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "Provide a city, or both lat and lon.",
      });
    }
    if (hasLat !== hasLon) {
      ctx.addIssue({
        code: "custom",
        path: ["lat"],
        message: "lat and lon must be provided together.",
      });
    }
  });

export const geocodeQuerySchema = z
  .object({
    q: cityLabel.optional(),
    lat: latitude.optional(),
    lon: longitude.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasQuery = Boolean(value.q);
    const hasCoords = value.lat !== undefined && value.lon !== undefined;
    if (!hasQuery && !hasCoords) {
      ctx.addIssue({
        code: "custom",
        path: ["q"],
        message: "Provide a search query, or both lat and lon.",
      });
    }
    if ((value.lat === undefined) !== (value.lon === undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["lat"],
        message: "lat and lon must be provided together.",
      });
    }
  });

export const assistantRequestSchema = z
  .object({
    question: z
      .string()
      .min(2, "Question is too short.")
      .max(500, "Question must be 500 characters or fewer."),
    language: z.enum(["en", "hi"]).default("en"),
    location: locationSchema,
    profile: profileSchema.optional(),
  })
  .strict();

export type LocationQuery = z.infer<typeof locationQuerySchema>;
export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export function parseOrThrow<S extends z.ZodType>(
  schema: S,
  data: unknown,
): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new HttpError(
      400,
      "invalid_input",
      "Request validation failed.",
      details,
    );
  }
  return result.data;
}
