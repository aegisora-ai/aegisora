import { supabase } from "./supabase";

export const API_BASE = "https://aegisora.org";

export type ApiReq = { method: string; path: string; body?: unknown; token?: string; workspaceId?: string };
export type ApiRes = { ok: boolean; status: number; data: unknown };
type Bridge = { api?: (req: ApiReq) => Promise<ApiRes> };

function fail(code: string, message: string): ApiRes {
  return { ok: false, status: 0, data: { error: { code, message } } };
}

export async function apiCall(req: ApiReq): Promise<ApiRes> {
  const send = (window as unknown as { aegisora?: Bridge }).aegisora?.api;
  if (!send) return fail("desktop_only", "This action works in the Aegisora desktop app.");
  let token = req.token;
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }
  if (!token) return fail("unauthorized", "You are signed out. Sign in again.");
  return send({ ...req, token });
}

export function apiError(res: ApiRes): { code: string; message: string } {
  const e = (res.data as { error?: { code?: unknown; message?: unknown } } | null)?.error;
  return {
    code: typeof e?.code === "string" ? e.code : "error",
    message: typeof e?.message === "string" ? e.message : `Request failed (${res.status}).`,
  };
}

export async function myWorkspaceId(): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", u.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.workspace_id ? String(data.workspace_id) : null;
}

export async function createApiKey(name: string): Promise<{ key?: string; error?: string }> {
  const ws = await myWorkspaceId();
  if (!ws) return { error: "No workspace found for this account." };
  const { data, error } = await supabase.rpc("create_api_key", { ws, key_name: name });
  if (error) {
    if (/forbidden/i.test(error.message)) {
      return { error: "Creating keys needs an owner or admin session with two-step verification. Open Security and verify first." };
    }
    return { error: error.message };
  }
  return { key: String(data) };
}