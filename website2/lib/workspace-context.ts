import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceContext = {
  userId: string;
  workspaceId: string;
};

export async function requireWorkspaceContext(): Promise<{
  supabase: SupabaseClient;
  context: WorkspaceContext;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

  if (membershipError) {
    throw new Error(
      `WORKSPACE_LOOKUP_FAILED: ${membershipError.message}`,
    );
  }

  if (!membership?.workspace_id) {
    throw new Error("NO_WORKSPACE_ACCESS");
  }

  return {
    supabase,
    context: {
      userId: user.id,
      workspaceId: membership.workspace_id,
    },
  };
}
