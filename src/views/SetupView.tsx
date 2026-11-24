export function SetupView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9EEF4] p-4">
      <div className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-extrabold text-white">
          CA
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Carns Arrom necesita Supabase</h1>
        <p className="text-sm text-slate-600">
          Crea un proyecto en supabase.com, ejecuta el SQL de <strong>supabase/schema.sql</strong> y crea un
          archivo <code className="rounded bg-slate-100 px-1">.env</code> en la raíz:
        </p>
        <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="text-sm text-slate-600">
          PIN inicial de todos los trabajadores: <strong>2026</strong>. Jesús es administrador. Cambia los PIN
          después de entrar.
        </p>
      </div>
    </div>
  );
}
