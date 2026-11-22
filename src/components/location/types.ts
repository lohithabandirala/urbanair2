export interface LocationPlace {
  name: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export type LocationPickerStatus =
  | "idle"
  | "searching"
  | "empty"
  | "error"
  | "locating"
  | "denied"
  | "unavailable";
