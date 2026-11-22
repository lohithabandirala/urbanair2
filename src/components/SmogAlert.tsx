"use client";

import { isSmogAlert } from "@/domain/advice";
import type { AqiCategory } from "@/domain/types";
import { interpolate } from "@/lib/i18n";
import { useI18n } from "./LanguageProvider";
import { IconAlert } from "./icons";

export function SmogAlert({ category }: { category: AqiCategory }) {
  const { dict } = useI18n();
  if (!isSmogAlert(category)) return null;

  return (
    <section
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="card border-2 border-red-400 bg-red-50"
    >
      <div className="flex gap-3">
        <IconAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-800" />
        <div>
          <h2 className="text-lg font-bold text-red-950">
            {dict.smogAlert.title}
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-red-950">
            {interpolate(dict.smogAlert.body, {
              category: dict.categories[category],
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
