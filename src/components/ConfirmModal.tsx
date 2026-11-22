import { useAppStore } from "../store/AppStore";

export function ConfirmModal() {
  const { confirm, closeConfirm } = useAppStore();
  if (!confirm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="fade-in w-full max-w-[400px] space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-2xl text-red-700">
            🗑️
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">{confirm.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{confirm.text}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={closeConfirm}
            className="rounded-xl bg-slate-100 px-4 py-3.5 text-base font-bold text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              const action = confirm.onConfirm;
              closeConfirm();
              action();
            }}
            className="rounded-xl bg-red-600 px-4 py-3.5 text-base font-extrabold text-white shadow-md hover:bg-red-700"
          >
            {confirm.yesLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
