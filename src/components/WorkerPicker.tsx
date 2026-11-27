import { WORKERS } from "../data/constants";
import { useLang } from "../i18n/LangStore";
import type { WorkerTheme } from "../types";

interface WorkerPickerProps {
  value: string;
  onChange: (name: string) => void;
  theme?: WorkerTheme;
  inputId: string;
}

export function WorkerPicker({ value, onChange, theme = "brand", inputId }: WorkerPickerProps) {
  const { t } = useLang();
  const selectedClass =
    theme === "sky"
      ? "bg-sky-700 text-white font-extrabold border-sky-700 shadow-sm"
      : "bg-brand text-white font-extrabold border-brand shadow-sm";
  const inputClass =
    theme === "sky"
      ? "text-sky-800 bg-sky-50/60 border-sky-200"
      : "text-brand bg-brand-light/40 border-brand-border";

  return (
    <div>
      <input
        id={inputId}
        type="text"
        required
        readOnly
        value={value}
        placeholder={t("worker.placeholder")}
        className={`mb-2.5 w-full cursor-pointer rounded-xl border-2 px-4 py-3 text-lg font-extrabold ${inputClass}`}
      />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {WORKERS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`rounded-xl border-2 px-2 py-2.5 text-sm transition-all active:scale-95 ${
              value === name
                ? selectedClass
                : "border-slate-200 bg-slate-100 font-bold text-slate-800 hover:bg-slate-200"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
