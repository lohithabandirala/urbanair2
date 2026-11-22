"use client";

import type { AqiCategory } from "@/domain/types";
import { formatNumber, gaugeAngle, localeFor } from "@/lib/format";
import { interpolate } from "@/lib/i18n";
import { CATEGORY_STYLES } from "./categoryStyles";
import { useI18n } from "./LanguageProvider";

const SEGMENTS: ReadonlyArray<{
  category: Exclude<AqiCategory, "unknown">;
  from: number;
  to: number;
}> = [
  { category: "good", from: 0, to: 50 },
  { category: "satisfactory", from: 51, to: 100 },
  { category: "moderate", from: 101, to: 200 },
  { category: "poor", from: 201, to: 300 },
  { category: "very-poor", from: 301, to: 400 },
  { category: "severe", from: 401, to: 500 },
];

const CENTER_X = 110;
const CENTER_Y = 110;
const RADIUS = 88;

function polar(angleDeg: number) {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + RADIUS * Math.sin(radians),
    y: CENTER_Y - RADIUS * Math.cos(radians),
  };
}

function arcPath(startAngle: number, endAngle: number): string {
  const start = polar(startAngle);
  const end = polar(endAngle);
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

interface AQIGaugeProps {
  aqi: number | null;
  category: AqiCategory;
}

export function AQIGauge({ aqi, category }: AQIGaugeProps) {
  const { dict, language } = useI18n();
  const categoryLabel = dict.categories[category];
  const locale = localeFor(language);
  const style = CATEGORY_STYLES[category];
  const angle = gaugeAngle(aqi);

  const ariaLabel =
    aqi === null
      ? dict.dashboard.gaugeUnknown
      : interpolate(dict.dashboard.gaugeLabel, {
          aqi: formatNumber(aqi, locale),
          category: categoryLabel,
        });

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 220 170"
        role="img"
        aria-label={ariaLabel}
        className="w-full max-w-[320px]"
      >
        <title>{ariaLabel}</title>

        {SEGMENTS.map((segment, index) => {
          const startAngle = -90 + index * 30;
          const endAngle = startAngle + 30;
          return (
            <path
              key={segment.category}
              d={arcPath(startAngle + 0.7, endAngle - 0.7)}
              stroke={CATEGORY_STYLES[segment.category].arc}
              strokeWidth={16}
              fill="none"
            />
          );
        })}

        {aqi !== null ? (
          <g>
            <line
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={CENTER_X}
              y2={34}
              stroke="#0f172a"
              strokeWidth={4}
              strokeLinecap="round"
              transform={`rotate(${angle} ${CENTER_X} ${CENTER_Y})`}
            />
            <circle cx={CENTER_X} cy={CENTER_Y} r={8} fill="#0f172a" />
            <circle cx={CENTER_X} cy={CENTER_Y} r={3} fill="#ffffff" />
          </g>
        ) : null}

        <text
          x={CENTER_X}
          y={142}
          textAnchor="middle"
          fill="#0f172a"
          fontSize={30}
          fontWeight={700}
        >
          {aqi === null ? "—" : formatNumber(aqi, locale)}
        </text>
        <text
          x={CENTER_X}
          y={158}
          textAnchor="middle"
          fill="#475569"
          fontSize={10}
          fontWeight={600}
        >
          {dict.dashboard.aqiLabel}
        </text>
      </svg>

      <p className={`badge mt-1 ${style.badge}`}>{categoryLabel}</p>

      <ul
        aria-label={dict.dashboard.scale}
        className="mt-3 grid w-full grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3"
      >
        {SEGMENTS.map((segment) => (
          <li key={segment.category} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_STYLES[segment.category].dot}`}
            />
            <span className="font-medium text-slate-800">
              {dict.categories[segment.category]}
            </span>
            <span className="tabular-nums text-slate-600">
              {segment.from}–{segment.to}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
