"use client";

import { useId } from "react";
import {
  COMMUTE_MODES,
  COOKING_FUELS,
  VULNERABLE_GROUPS,
  type CommuteMode,
  type CookingFuel,
  type UserProfile,
  type VulnerableGroup,
} from "@/domain/types";
import { useI18n } from "./LanguageProvider";
import { IconInfo } from "./icons";

interface ProfilePanelProps {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  onReset: () => void;
}

export function ProfilePanel({
  profile,
  onChange,
  onReset,
}: ProfilePanelProps) {
  const { dict } = useI18n();
  const commuteName = useId();
  const cookingId = useId();
  const exerciseName = useId();

  function toggleVulnerable(group: VulnerableGroup, checked: boolean) {
    const next = checked
      ? [...profile.vulnerableGroups, group]
      : profile.vulnerableGroups.filter((value) => value !== group);
    onChange({ vulnerableGroups: [...new Set(next)] });
  }

  return (
    <section
      id="profile"
      aria-labelledby="profile-heading"
      className="card scroll-mt-24"
    >
      <h2 id="profile-heading" className="text-xl font-bold text-slate-900">
        {dict.profile.title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        {dict.profile.subtitle}
      </p>

      <div className="mt-4 space-y-5">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">
            {dict.profile.commute}
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {COMMUTE_MODES.map((mode) => (
              <label
                key={mode}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm ${
                  profile.commuteMode === mode
                    ? "border-sky-700 bg-sky-50 font-semibold text-sky-950"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name={commuteName}
                  value={mode}
                  checked={profile.commuteMode === mode}
                  onChange={() => onChange({ commuteMode: mode as CommuteMode })}
                  className="h-4 w-4 accent-sky-800"
                />
                {dict.profile.commuteOptions[mode]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor={cookingId}
            className="block text-sm font-semibold text-slate-900"
          >
            {dict.profile.cooking}
          </label>
          <select
            id={cookingId}
            className="input mt-2"
            value={profile.cookingFuel}
            onChange={(event) =>
              onChange({ cookingFuel: event.target.value as CookingFuel })
            }
          >
            {COOKING_FUELS.map((fuel) => (
              <option key={fuel} value={fuel}>
                {dict.profile.cookingOptions[fuel]}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">
            {dict.profile.vulnerable}
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {VULNERABLE_GROUPS.map((group) => (
              <label
                key={group}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={profile.vulnerableGroups.includes(group)}
                  onChange={(event) =>
                    toggleVulnerable(group, event.target.checked)
                  }
                  className="h-4 w-4 accent-sky-800"
                />
                {dict.profile.vulnerableOptions[group]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">
            {dict.profile.exercise}
          </legend>
          <div className="mt-2 flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input
                type="radio"
                name={exerciseName}
                checked={profile.exercisesOutdoors}
                onChange={() => onChange({ exercisesOutdoors: true })}
                className="h-4 w-4 accent-sky-800"
              />
              {dict.profile.exerciseYes}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input
                type="radio"
                name={exerciseName}
                checked={!profile.exercisesOutdoors}
                onChange={() => onChange({ exercisesOutdoors: false })}
                className="h-4 w-4 accent-sky-800"
              />
              {dict.profile.exerciseNo}
            </label>
          </div>
        </fieldset>
      </div>

      <p className="mt-4 flex gap-1.5 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-700">
        <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{dict.profile.privacy}</span>
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-600">{dict.profile.saved}</p>
        <button type="button" className="btn px-3 py-1.5 text-xs" onClick={onReset}>
          {dict.profile.reset}
        </button>
      </div>
    </section>
  );
}
