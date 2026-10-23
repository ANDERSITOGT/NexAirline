import { createContext } from "react";

export type Language = "es" | "en";

export interface PreferencesContextValue {
  language: Language;
  timezone: string;
  setLanguage: (language: Language) => void;
  setTimezone: (timezone: string) => void;
}

export const PreferencesContext =
  createContext<PreferencesContextValue | null>(null);
