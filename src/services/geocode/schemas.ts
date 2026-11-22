import { z } from "zod";

/** Zod schema for the Open-Meteo geocoding API response. */
export const geocodeResponseSchema = z
  .object({
    results: z
      .array(
        z
          .object({
            id: z.number().optional(),
            name: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            country_code: z.string().optional(),
            country: z.string().optional(),
            admin1: z.string().optional(),
            timezone: z.string().optional(),
            population: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

/** Zod schema for the BigDataCloud reverse geocoding API response. */
export const reverseSchema = z
  .object({
    city: z.string().optional(),
    locality: z.string().optional(),
    principalSubdivision: z.string().optional(),
    countryName: z.string().optional(),
    countryCode: z.string().optional(),
  })
  .passthrough();
