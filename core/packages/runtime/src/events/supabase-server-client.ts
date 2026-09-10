import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

export type SupabaseServerClientConfig = Readonly<{
  url?: string;
  serviceRoleKey?: string;
}>;

function required(
  name: string,
  value: string | undefined,
): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required server environment variable: ${name}`,
    );
  }

  return value.trim();
}

export function createSupabaseServerClient(
  config: SupabaseServerClientConfig = {},
): SupabaseClient {
  const url = required(
    "SUPABASE_URL",
    config.url ?? process.env.SUPABASE_URL,
  );

  const serviceRoleKey = required(
    "SUPABASE_SERVICE_ROLE_KEY",
    config.serviceRoleKey ??
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export function isSupabaseServerEnvironment(): boolean {
  return (
    typeof process !== "undefined" &&
    typeof process.env === "object"
  );
}
