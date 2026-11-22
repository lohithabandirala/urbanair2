import type { AqiCategory } from "@/domain/types";
import type { AdviceSeverity } from "@/domain/advice";

export interface CategoryStyle {
  /** Badge background + text. Dark text on light tint, never white on yellow. */
  badge: string;
  text: string;
  panel: string;
  border: string;
  /** Solid colour used for the SVG gauge arc. */
  arc: string;
  dot: string;
}

export const CATEGORY_STYLES: Record<AqiCategory, CategoryStyle> = {
  good: {
    badge: "bg-emerald-100 text-emerald-950",
    text: "text-emerald-900",
    panel: "bg-emerald-50",
    border: "border-emerald-300",
    arc: "#15803d",
    dot: "bg-emerald-700",
  },
  satisfactory: {
    badge: "bg-lime-100 text-lime-950",
    text: "text-lime-900",
    panel: "bg-lime-50",
    border: "border-lime-300",
    arc: "#4d7c0f",
    dot: "bg-lime-700",
  },
  moderate: {
    badge: "bg-amber-100 text-amber-950",
    text: "text-amber-900",
    panel: "bg-amber-50",
    border: "border-amber-300",
    arc: "#b45309",
    dot: "bg-amber-700",
  },
  poor: {
    badge: "bg-orange-100 text-orange-950",
    text: "text-orange-900",
    panel: "bg-orange-50",
    border: "border-orange-300",
    arc: "#c2410c",
    dot: "bg-orange-700",
  },
  "very-poor": {
    badge: "bg-red-100 text-red-950",
    text: "text-red-900",
    panel: "bg-red-50",
    border: "border-red-300",
    arc: "#b91c1c",
    dot: "bg-red-700",
  },
  severe: {
    badge: "bg-red-200 text-red-950",
    text: "text-red-950",
    panel: "bg-red-50",
    border: "border-red-400",
    arc: "#7f1d1d",
    dot: "bg-red-900",
  },
  unknown: {
    badge: "bg-slate-200 text-slate-900",
    text: "text-slate-900",
    panel: "bg-slate-50",
    border: "border-slate-300",
    arc: "#475569",
    dot: "bg-slate-600",
  },
};

export const SEVERITY_STYLES: Record<
  AdviceSeverity,
  { panel: string; border: string; icon: string; label: string }
> = {
  info: {
    panel: "bg-sky-50",
    border: "border-sky-300",
    icon: "text-sky-800",
    label: "text-sky-950",
  },
  caution: {
    panel: "bg-amber-50",
    border: "border-amber-300",
    icon: "text-amber-800",
    label: "text-amber-950",
  },
  warning: {
    panel: "bg-orange-50",
    border: "border-orange-300",
    icon: "text-orange-800",
    label: "text-orange-950",
  },
  danger: {
    panel: "bg-red-50",
    border: "border-red-400",
    icon: "text-red-800",
    label: "text-red-950",
  },
};
