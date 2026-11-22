import { Layout } from "./components/Layout";
import { useAppStore } from "./store/AppStore";
import { BaseDatosView } from "./views/BaseDatosView";
import { EncargosView } from "./views/EncargosView";
import { HomeView } from "./views/HomeView";
import { InventarioView } from "./views/InventarioView";
import { NeverasView } from "./views/NeverasView";

export default function App() {
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
