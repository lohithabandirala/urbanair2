"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  getDictionary,
  isLanguage,
  type Dictionary,
  type Language,
} from "@/lib/i18n";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  dict: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { value, setValue } = useLocalStorage<Language>(
    "saaf-hawa.language.v1",
    "en",
  );
  const language: Language = isLanguage(value) ? value : "en";
  const dict = useMemo(() => getDictionary(language), [language]);

  useEffect(() => {
    document.documentElement.lang = dict.meta.htmlLang;
  }, [dict.meta.htmlLang]);

  const valueMemo = useMemo(
    () => ({ language, setLanguage: setValue, dict }),
    [language, setValue, dict],
  );

  return (
    <LanguageContext.Provider value={valueMemo}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return context;
}
