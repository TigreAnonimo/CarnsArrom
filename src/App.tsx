import { Layout } from "./components/Layout";
import { useLang } from "./i18n/LangStore";
import { isSupabaseConfigured } from "./lib/supabase";
import { AppStoreProvider, useAppStore } from "./store/AppStore";
import { useAuth } from "./store/AuthStore";
import { BaseDatosView } from "./views/BaseDatosView";
import { EncargosView } from "./views/EncargosView";
import { HomeView } from "./views/HomeView";
import { InventarioView } from "./views/InventarioView";
import { LoginView } from "./views/LoginView";
import { NeverasView } from "./views/NeverasView";
import { SetupView } from "./views/SetupView";

function Shell() {
  const { view, worker } = useAppStore();
  const showDb = view === "basedatos" && worker.esAdmin;
  return (
    <Layout>
      {(view === "home" || (view === "basedatos" && !worker.esAdmin)) && <HomeView />}
      {view === "inventario" && <InventarioView />}
      {view === "encargos" && <EncargosView />}
      {view === "neveras" && <NeverasView />}
      {showDb && <BaseDatosView />}
    </Layout>
  );
}

export default function App() {
  const { session, loading } = useAuth();
  const { t } = useLang();

  if (!isSupabaseConfigured) return <SetupView />;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E9EEF4] text-sm font-bold text-slate-600">
        {t("common.loading")}
      </div>
    );
  }
  if (!session) return <LoginView />;

  return (
    <AppStoreProvider>
      <Shell />
    </AppStoreProvider>
  );
}
