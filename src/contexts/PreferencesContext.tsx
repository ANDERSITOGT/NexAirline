import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PreferencesContext, type Language } from "./preferencesContextValue";

const LANGUAGE_KEY = "nexairline_language";
const TIMEZONE_KEY = "nexairline_timezone";
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function storedLanguage(): Language {
  return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "es";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(storedLanguage);
  const [timezone, setTimezoneState] = useState(
    () => localStorage.getItem(TIMEZONE_KEY) || defaultTimezone,
  );

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(TIMEZONE_KEY, timezone);
  }, [timezone]);

  const value = useMemo(
    () => ({
      language,
      timezone,
      setLanguage: setLanguageState,
      setTimezone: setTimezoneState,
    }),
    [language, timezone],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
