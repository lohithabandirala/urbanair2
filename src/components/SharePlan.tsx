"use client";

import { useState } from "react";
import type { AirQualitySnapshot, DailyPlan } from "@/domain/types";
import { formatObservedAt, localeFor } from "@/lib/format";
import { useI18n } from "./LanguageProvider";
import { IconCopy } from "./icons";

interface SharePlanProps {
  snapshot: AirQualitySnapshot;
  plan: DailyPlan | null;
}

type ShareStatus = "idle" | "copied" | "failed";

export function SharePlan({ snapshot, plan }: SharePlanProps) {
  const { dict, language } = useI18n();
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [showText, setShowText] = useState(false);

  const lines = [
    `${dict.app.name} — ${dict.share.title}`,
    `${snapshot.location.city} — AQI ${
      snapshot.aqi === null ? "—" : snapshot.aqi
    } (${dict.categories[snapshot.category]})`,
    `${dict.source.label}: ${snapshot.sourceLabel}`,
    `${dict.source.observed}: ${formatObservedAt(
      snapshot.observedAt,
      localeFor(language),
      snapshot.location.timezone,
    )}`,
  ];

  if (plan) {
    lines.push("");
    lines.push(
      `${dict.plan.bestWindow}: ${
        plan.bestWindowId
          ? dict.plan.windows[plan.bestWindowId]
          : dict.plan.noBest
      }`,
    );
    for (const window of plan.windows) {
      lines.push(
        `${dict.plan.windows[window.id]}: ${
          window.aqi === null ? "—" : window.aqi
        } — ${dict.plan.verdicts[window.verdict]}`,
      );
    }
  }

  lines.push("", dict.footer.disclaimer);
  const text = lines.join("\n");

  function fallbackCopy(value: string): boolean {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  async function copyPlan() {
    setShowText(false);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setStatus("copied");
        return;
      }
      if (fallbackCopy(text)) {
        setStatus("copied");
        return;
      }
      throw new Error("copy unavailable");
    } catch {
      setStatus("failed");
      setShowText(true);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          className="btn px-3 py-2 text-xs"
          onClick={copyPlan}
          disabled={snapshot.aqi === null}
        >
          <IconCopy className="h-4 w-4" />
          {dict.share.button}
        </button>
        <p role="status" aria-live="polite" className="text-xs text-slate-700">
          {status === "copied"
            ? dict.share.copied
            : status === "failed"
              ? dict.share.failed
              : ""}
        </p>
      </div>

      {showText ? (
        <textarea
          readOnly
          value={text}
          aria-label={dict.share.title}
          className="input mt-2 h-40 font-mono text-xs"
        />
      ) : null}
    </div>
  );
}
