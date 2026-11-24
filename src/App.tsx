import { Layout } from "./components/Layout";
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
  const { view } = useAppStore();
  return (
    <Layout>
      {view === "home" && <HomeView />}
      {view === "inventario" && <InventarioView />}
      {view === "encargos" && <EncargosView />}
      {view === "neveras" && <NeverasView />}
      {view === "basedatos" && <BaseDatosView />}
    </Layout>
  );
}

export default function App() {
  const { session, loading } = useAuth();

  if (!isSupabaseConfigured) return <SetupView />;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E9EEF4] text-sm font-bold text-slate-600">
        Cargando Carns Arrom…
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
