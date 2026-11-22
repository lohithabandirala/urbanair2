import type {
  AirQualitySnapshot,
  AqiCategory,
  AssistantProvider,
  PollutantKey,
  ResolvedLocation,
  UserProfile,
} from "@/domain/types";
import type { Language } from "@/lib/i18n";

export interface AssistantInput {
  question: string;
  language: Language;
  location: ResolvedLocation;
  snapshot: AirQualitySnapshot;
  profile: UserProfile;
}

export interface AssistantAnswer {
  answer: string;
  provider: AssistantProvider;
  model?: string;
  noticeKey?: string;
  blocked: boolean;
  groundedOn: {
    city: string;
    aqi: number | null;
    category: AqiCategory;
    dominantPollutant: PollutantKey | null;
    observedAt: string;
    source: string;
    freshness: string;
  };
  sources: string[];
}

export interface GeminiResult {
  text: string;
  model: string;
}
