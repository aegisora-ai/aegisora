import type {
  EnterpriseRealtimeRuntimeBridge,
  EnterpriseRealtimeRuntimeConfig,
} from "./enterprise-realtime-bridge";

import {
  EnterpriseRealtimeRuntimeBridge as RuntimeBridge,
} from "./enterprise-realtime-bridge";

import {
  SupabaseEnterpriseRealtimeWriter,
} from "./supabase-realtime-writer";

import {
  createSupabaseServerClient,
} from "./supabase-server-client";

export type EnterpriseRealtimeServerConfig = Readonly<{
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}>;

export type EnterpriseRealtimeServerRuntime = Readonly<{
  bridge: EnterpriseRealtimeRuntimeBridge;
}>;

export function createEnterpriseRealtimeServerRuntime(
  config: EnterpriseRealtimeServerConfig = {},
): EnterpriseRealtimeServerRuntime {
  const client = createSupabaseServerClient({
    url: config.supabaseUrl,
    serviceRoleKey: config.supabaseServiceRoleKey,
  });

  const writer =
    new SupabaseEnterpriseRealtimeWriter({
      client,
    });

  const bridgeConfig: EnterpriseRealtimeRuntimeConfig = {
    writer,
  };

  const bridge =
    new RuntimeBridge(bridgeConfig);

  return Object.freeze({
    bridge,
  });
}
