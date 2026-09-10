export type EnterpriseSubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELED";

export interface EnterpriseSubscription {
  subscriptionId: string;
  workspaceId: string;
  planId: string;
  status: EnterpriseSubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
}

export function createEnterpriseSubscription(input: {
  subscriptionId: string;
  workspaceId: string;
  planId: string;
  status?: EnterpriseSubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}): EnterpriseSubscription {
  if (!input.workspaceId) {
    throw new Error("workspaceId is required");
  }

  if (!input.planId) {
    throw new Error("planId is required");
  }

  if (new Date(input.currentPeriodEnd).getTime() <= new Date(input.currentPeriodStart).getTime()) {
    throw new Error("invalid billing period");
  }

  return {
    subscriptionId: input.subscriptionId,
    workspaceId: input.workspaceId,
    planId: input.planId,
    status: input.status ?? "ACTIVE",
    startedAt: input.currentPeriodStart,
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
  };
}

export function billingAllowsExecution(
  subscription: EnterpriseSubscription,
): boolean {
  return (
    subscription.status === "TRIALING" ||
    subscription.status === "ACTIVE"
  );
}
