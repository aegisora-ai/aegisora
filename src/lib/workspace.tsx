import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useSession } from "./useSession";

export type Membership = { workspaceId: string; name: string; slug: string; role: string };
type Ctx = {
  loading: boolean;
  error: string | null;
  memberships: Membership[];
  current: Membership | null;
  select: (id: string) => void;
  userId: string | null;
  canWrite: boolean; // owner, admin, developer
  canAdmin: boolean; // owner, admin
};

const WorkspaceContext = createContext<Ctx>({
  loading: true, error: null, memberships: [], current: null, select: () => {},
  userId: null, canWrite: false, canAdmin: false,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selected, setSelected] = useState<string | null>(() => localStorage.getItem("aegisora.workspace"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let on = true;
    (async () => {
      const mem = await supabase.from("workspace_members").select("workspace_id,role").eq("user_id", userId);
      if (!on) return;
      if (mem.error) { setError(`workspace_members: ${mem.error.message}`); setLoading(false); return; }
      const ids = (mem.data ?? []).map((m: any) => m.workspace_id as string);
      let names: Record<string, { name: string; slug: string }> = {};
      if (ids.length) {
        const ws = await supabase.from("workspaces").select("id,name,slug").in("id", ids);
        if (ws.data) names = Object.fromEntries(ws.data.map((w: any) => [w.id, { name: w.name, slug: w.slug }]));
      }
      if (!on) return;
      setMemberships((mem.data ?? []).map((m: any) => ({
        workspaceId: m.workspace_id,
        role: String(m.role ?? "viewer"),
        name: names[m.workspace_id]?.name ?? "Workspace",
        slug: names[m.workspace_id]?.slug ?? "",
      })));
      setLoading(false);
    })();
    return () => { on = false; };
  }, [userId]);

  const value = useMemo<Ctx>(() => {
    const current = memberships.find((m) => m.workspaceId === selected) ?? memberships[0] ?? null;
    const role = (current?.role ?? "").toLowerCase();
    return {
      loading, error, memberships, current, userId,
      select: (id: string) => { localStorage.setItem("aegisora.workspace", id); setSelected(id); },
      canAdmin: role === "owner" || role === "admin",
      canWrite: role === "owner" || role === "admin" || role === "developer",
    };
  }, [memberships, selected, loading, error, userId]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() { return useContext(WorkspaceContext); }
