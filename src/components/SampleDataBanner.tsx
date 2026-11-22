"use client";

import type { AirQualitySnapshot } from "@/domain/types";
import { IconAlert } from "./icons";
import { useI18n } from "./LanguageProvider";

interface SampleDataBannerProps {
  snapshot: AirQualitySnapshot;
}

/**
 * Prominent banner displayed when all live providers failed
 * and deterministic sample data is being presented.
 */
export function SampleDataBanner({ snapshot }: SampleDataBannerProps) {
  const { dict } = useI18n();

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-950"
    >
      <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">
          {dict.app.demoData} — {snapshot.location.city}
        </p>
        <p className="mt-1 text-sm leading-6">{dict.source.notes.sample}</p>
      </div>
    </div>
  );
}
