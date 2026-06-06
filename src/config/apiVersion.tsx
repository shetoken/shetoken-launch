import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/* Shared API-version selector used by the data pages (Dashboard, Safety,
   She-Clock). v2 = official/published; v3 = shadow preview (in validation —
   never affects published scores or $SHE supply mechanics). */

export type ApiVersion = "v2" | "v3";

export const API_VERSIONS: { value: ApiVersion; label: string; tag: string; shadow: boolean }[] = [
  { value: "v2", label: "v2 — Official", tag: "Published", shadow: false },
  { value: "v3", label: "v3 — Shadow preview", tag: "In validation", shadow: true },
];

const KEY = "she_api_version";

const Ctx = createContext<{ version: ApiVersion; setVersion: (v: ApiVersion) => void }>({
  version: "v2",
  setVersion: () => {},
});

export function ApiVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<ApiVersion>(() => {
    try { return (localStorage.getItem(KEY) as ApiVersion) || "v2"; } catch { return "v2"; }
  });
  const setVersion = useCallback((v: ApiVersion) => {
    setVersionState(v);
    try { localStorage.setItem(KEY, v); } catch { /* ignore */ }
  }, []);
  return <Ctx.Provider value={{ version, setVersion }}>{children}</Ctx.Provider>;
}

export function useApiVersion() {
  return useContext(Ctx);
}
