import type { ImpactEstimate } from "@/domain/types";
import { formatNumber } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import { Metric } from "./Metric";

interface EstimateCardProps {
  title: string;
  estimate: ImpactEstimate;
  dict: Dictionary;
  locale: string;
}

export function EstimateCard({
  title,
  estimate,
  dict,
  locale,
}: EstimateCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <dl className="mt-2 space-y-1.5 text-sm">
        <Metric
          label={dict.impact.co2Day}
          value={`${formatNumber(estimate.co2KgPerDay, locale, 2)} kg`}
        />
        <Metric
          label={dict.impact.pmDay}
          value={`${formatNumber(estimate.pm25GPerDay, locale, 2)} g`}
        />
        <Metric
          label={dict.impact.co2Month}
          value={`${formatNumber(estimate.co2KgPerMonth, locale, 2)} kg`}
        />
      </dl>
    </div>
  );
}
