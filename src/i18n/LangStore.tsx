import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { messages, type Lang } from "./messages";

const STORAGE_KEY = "carns-arrom-lang";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFn;
}

const LangContext = createContext<LangValue | null>(null);

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ca" || stored === "es") return stored;
  } catch {
    /* ignore */
  }
  return "es";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === "ca" ? "ca" : "es";
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const t = useCallback<TFn>(
    (key, vars) => {
      let text = messages[lang][key] ?? messages.es[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <div
      className={`flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 ${compact ? "text-[10px]" : "text-xs"} font-extrabold`}
      role="group"
      aria-label={t("lang.label")}
    >
      <button
        type="button"
        onClick={() => setLang("es")}
        className={`rounded-md px-2 py-0.5 ${lang === "es" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
      >
        {t("lang.es")}
      </button>
      <button
        type="button"
        onClick={() => setLang("ca")}
        className={`rounded-md px-2 py-0.5 ${lang === "ca" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
      >
        {t("lang.ca")}
      </button>
    </div>
  );
}
