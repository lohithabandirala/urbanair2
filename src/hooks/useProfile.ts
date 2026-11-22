"use client";

import { useCallback, useMemo } from "react";
import {
  COMMUTE_MODES,
  COOKING_FUELS,
  DEFAULT_PROFILE,
  VULNERABLE_GROUPS,
  type CommuteMode,
  type CookingFuel,
  type UserProfile,
  type VulnerableGroup,
} from "@/domain/types";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "saaf-hawa.profile.v1";

function normalizeProfile(raw: unknown): UserProfile {
  if (!raw || typeof raw !== "object") return DEFAULT_PROFILE;
  const value = raw as Partial<UserProfile>;

  const commuteMode = (COMMUTE_MODES as readonly string[]).includes(
    value.commuteMode ?? "",
  )
    ? (value.commuteMode as CommuteMode)
    : DEFAULT_PROFILE.commuteMode;

  const cookingFuel = (COOKING_FUELS as readonly string[]).includes(
    value.cookingFuel ?? "",
  )
    ? (value.cookingFuel as CookingFuel)
    : DEFAULT_PROFILE.cookingFuel;

  const vulnerableGroups = Array.isArray(value.vulnerableGroups)
    ? (value.vulnerableGroups.filter((group) =>
        (VULNERABLE_GROUPS as readonly string[]).includes(group),
      ) as VulnerableGroup[])
    : [];

  return {
    commuteMode,
    cookingFuel,
    vulnerableGroups: [...new Set(vulnerableGroups)],
    exercisesOutdoors:
      typeof value.exercisesOutdoors === "boolean"
        ? value.exercisesOutdoors
        : DEFAULT_PROFILE.exercisesOutdoors,
  };
}

export function useProfile() {
  const { value, setValue, hydrated } = useLocalStorage<Partial<UserProfile>>(
    STORAGE_KEY,
    DEFAULT_PROFILE,
  );

  const profile = useMemo(() => normalizeProfile(value), [value]);

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setValue((previous) => ({
        ...normalizeProfile(previous),
        ...patch,
      }));
    },
    [setValue],
  );

  const resetProfile = useCallback(() => {
    setValue(DEFAULT_PROFILE);
  }, [setValue]);

  return { profile, updateProfile, resetProfile, hydrated };
}
