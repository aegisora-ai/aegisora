import type {
  EnterpriseRealtimeEvent,
  EnterpriseRealtimeEventType,
} from "./types";

export type EnterpriseRealtimeSubscriptionFilter =
  Readonly<{
    workspaceId: string;
    eventTypes?: readonly EnterpriseRealtimeEventType[];
  }>;

export type EnterpriseRealtimeSubscription =
  Readonly<{
    workspaceId: string;
    eventTypes?: readonly EnterpriseRealtimeEventType[];
  }>;

export function createEnterpriseRealtimeSubscription(
  filter: EnterpriseRealtimeSubscriptionFilter,
): EnterpriseRealtimeSubscription {
  const workspaceId = filter.workspaceId.trim();

  if (!workspaceId) {
    throw new Error(
      "Realtime subscription requires workspaceId.",
    );
  }

  const eventTypes =
    filter.eventTypes
      ? Object.freeze([
          ...new Set(filter.eventTypes),
        ])
      : undefined;

  return Object.freeze({
    workspaceId,
    eventTypes,
  });
}

export function matchesEnterpriseRealtimeSubscription(
  event: EnterpriseRealtimeEvent,
  subscription: EnterpriseRealtimeSubscription,
): boolean {
  if (
    event.workspaceId !==
    subscription.workspaceId
  ) {
    return false;
  }

  if (
    subscription.eventTypes &&
    subscription.eventTypes.length > 0 &&
    !subscription.eventTypes.includes(event.type)
  ) {
    return false;
  }

  return true;
}
