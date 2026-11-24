import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, requireSupabase } from "../lib/supabase";
import type { SessionWorker } from "../types";

const SESSION_KEY = "carns-arrom-session";

interface AuthValue {
  configured: boolean;
  loading: boolean;
  session: SessionWorker | null;
  workers: SessionWorker[];
  loginError: string;
  login: (nombre: string, pin: string) => Promise<boolean>;
  changeOwnPin: (actual: string, nuevo: string) => Promise<string | null>;
  patchSession: (patch: Partial<SessionWorker>) => void;
  logout: () => void;
  refreshWorkers: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function readSession(): SessionWorker | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionWorker;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionWorker | null>(null);
  const [workers, setWorkers] = useState<SessionWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  const refreshWorkers = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const client = requireSupabase();
    const { data, error } = await client
      .from("trabajadores")
      .select("id, nombre, es_admin")
      .eq("activo", true)
      .order("nombre");
    if (error) throw error;
    setWorkers(
      (data ?? []).map((row) => ({
        id: row.id as string,
        nombre: row.nombre as string,
        esAdmin: Boolean(row.es_admin),
      })),
    );
  }, []);

  useEffect(() => {
    const stored = readSession();
    if (stored) setSession(stored);
    refreshWorkers()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refreshWorkers]);

  const login = useCallback(async (nombre: string, pin: string) => {
    setLoginError("");
    try {
      const client = requireSupabase();
      const { data, error } = await client.rpc("login_trabajador", {
        p_nombre: nombre,
        p_pin: pin,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setLoginError("PIN incorrecto.");
        return false;
      }
      const next: SessionWorker = {
        id: row.id as string,
        nombre: row.nombre as string,
        esAdmin: Boolean(row.es_admin),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setLoginError(
        message.includes("crypt")
          ? "Falta ejecutar supabase/fix-login.sql en el SQL Editor."
          : "No se ha podido entrar. Revisa la conexión y el PIN.",
      );
      return false;
    }
  }, []);

  const changeOwnPin = useCallback(async (actual: string, nuevo: string) => {
    if (!session) return "No hay sesión.";
    if (nuevo.length < 4) return "El PIN nuevo debe tener al menos 4 números.";
    const client = requireSupabase();
    const { data, error } = await client.rpc("login_trabajador", {
      p_nombre: session.nombre,
      p_pin: actual,
    });
    if (error) return "No se ha podido comprobar el PIN actual.";
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return "El PIN actual no es correcto.";
    const { error: pinError } = await client.rpc("set_trabajador_pin", {
      p_id: session.id,
      p_pin: nuevo,
    });
    if (pinError) return "No se ha podido guardar el PIN nuevo.";
    return null;
  }, [session]);

  const patchSession = useCallback((patch: Partial<SessionWorker>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      workers,
      loginError,
      login,
      changeOwnPin,
      patchSession,
      logout,
      refreshWorkers,
    }),
    [loading, session, workers, loginError, login, changeOwnPin, patchSession, logout, refreshWorkers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
