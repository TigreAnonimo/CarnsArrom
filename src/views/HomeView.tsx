import { TEMP_ALERT } from "../data/constants";
import { todayISO } from "../lib/dates";
import { fridgeBadge } from "../lib/orders";
import { useAppStore } from "../store/AppStore";

export function HomeView() {
  const { data, navigateTo, loading, syncError } = useAppStore();
  const stockCount = data.productos.filter((i) => i.estado === "En almacén").length;
  const activeOrders = data.encargos.filter((o) => o.estado !== "Entregado").length;
  const todayFridge = data.neverasPorDia.find((d) => d.fechaISO === todayISO());
  const fridge = todayFridge ? fridgeBadge(todayFridge.temps, TEMP_ALERT) : null;

  return (
    <section className="fade-in space-y-6">
      {syncError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {syncError}
        </div>
      ) : null}
      {loading ? <p className="text-sm font-semibold text-slate-500">Sincronizando datos…</p> : null}
      <div className="pt-1">
        <h2 className="text-2xl font-extrabold text-slate-900">Panel principal</h2>
        <p className="mt-0.5 text-base text-slate-600">Selecciona qué quieres gestionar hoy</p>
      </div>

      <div className="space-y-4">
        <HomeCard
          onClick={() => navigateTo("inventario")}
          hover="hover:bg-brand-light/40 hover:border-brand"
          iconWrap="bg-brand-light text-brand border-brand-border"
          icon="📦"
          title="INVENTARIO"
          badge={`${stockCount} en stock`}
          badgeClass="bg-slate-100 text-slate-700 border-slate-300"
          subtitle="Conteo de cámara y productos agotados"
          arrowHover="group-hover:text-brand"
        />
        <HomeCard
          onClick={() => navigateTo("encargos")}
          hover="hover:bg-amber-50/50 hover:border-amber-600"
          iconWrap="bg-amber-50 text-amber-700 border-amber-200"
          icon="📝"
          title="ENCARGOS"
          badge={`${activeOrders} activo${activeOrders === 1 ? "" : "s"}`}
          badgeClass="bg-amber-100 text-amber-900 border-amber-300"
          subtitle="Pedidos de clientes pendientes y preparados"
          arrowHover="group-hover:text-amber-700"
        />
        <HomeCard
          onClick={() => navigateTo("neveras")}
          hover="hover:bg-sky-50/50 hover:border-sky-700"
          iconWrap="bg-sky-50 text-sky-700 border-sky-200"
          icon="❄️"
          title="NEVERAS"
          badge={fridge ? fridge.text : "Pendiente hoy"}
          badgeClass={
            fridge && !fridge.ok
              ? "bg-red-100 text-red-800 border-red-300"
              : "bg-sky-100 text-sky-900 border-sky-300"
          }
          subtitle="Temperatura diaria de las 7 neveras"
          arrowHover="group-hover:text-sky-700"
        />
        <button
          type="button"
          onClick={() => navigateTo("basedatos")}
          className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-800 bg-slate-900 p-4 text-left shadow-md transition-all hover:bg-slate-800 active:scale-[0.99] sm:p-5"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-2xl text-white">
            📊
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-lg font-extrabold tracking-tight text-white sm:text-xl">BASE DE DATOS</span>
            <span className="mt-0.5 block text-xs font-medium text-slate-300 sm:text-sm">
              Historial, actividad, exportaciones y copias de seguridad
            </span>
          </div>
          <Arrow className="text-slate-400 group-hover:text-white" />
        </button>
      </div>

      <div className="pt-1">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Últimos registros</h3>
          <span className="text-xs font-semibold text-slate-500">Actividad reciente</span>
        </div>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {data.recentActivity.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">Aún no hay actividad.</p>
          ) : (
            data.recentActivity.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 text-xl">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{item.text}</p>
                    <p className="text-xs text-slate-500">{item.meta}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-extrabold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function HomeCard({
  onClick,
  hover,
  iconWrap,
  icon,
  title,
  badge,
  badgeClass,
  subtitle,
  arrowHover,
}: {
  onClick: () => void;
  hover: string;
  iconWrap: string;
  icon: string;
  title: string;
  badge: string;
  badgeClass: string;
  subtitle: string;
  arrowHover: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 text-left shadow-sm transition-all active:scale-[0.99] ${hover}`}
    >
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-3xl transition-transform group-hover:scale-105 ${iconWrap}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${badgeClass}`}>{badge}</span>
        </div>
        <span className="mt-0.5 block text-sm font-medium text-slate-600 sm:text-base">{subtitle}</span>
      </div>
      <Arrow className={`text-slate-400 ${arrowHover}`} />
    </button>
  );
}

function Arrow({ className }: { className: string }) {
  return (
    <svg className={`h-7 w-7 shrink-0 transition-colors ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
