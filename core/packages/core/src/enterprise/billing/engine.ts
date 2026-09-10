import type {
  EnterpriseSubscription,
  EnterpriseSubscriptionStatus,
} from "./types";

const ALLOWED: Record<
  EnterpriseSubscriptionStatus,
  readonly EnterpriseSubscriptionStatus[]
> = {
  TRIALING: ["TRIALING", "ACTIVE", "CANCELED"],
  ACTIVE: ["ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELED"],
  PAST_DUE: ["PAST_DUE", "ACTIVE", "SUSPENDED", "CANCELED"],
  SUSPENDED: ["SUSPENDED", "ACTIVE", "CANCELED"],
  CANCELED: ["CANCELED"],
};

export class EnterpriseBillingEngine {
  canExecute(subscription: EnterpriseSubscription): boolean {
    if (!subscription) {
      return false;
    }

    return (
      subscription.status === "TRIALING" ||
      subscription.status === "ACTIVE"
    );
  }

  canTransition(
    from: EnterpriseSubscriptionStatus,
    to: EnterpriseSubscriptionStatus,
  ): boolean {
    return ALLOWED[from]?.includes(to) ?? false;
  }

  transition(
    subscription: EnterpriseSubscription,
    nextStatus: EnterpriseSubscriptionStatus,
  ): EnterpriseSubscription {
    if (!this.canTransition(subscription.status, nextStatus)) {
      throw new Error(
        `Invalid billing transition: ${subscription.status} -> ${nextStatus}`,
      );
    }

    return Object.freeze({
      ...subscription,
      status: nextStatus,
    });
  }
}
