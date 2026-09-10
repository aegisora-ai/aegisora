export type EntitlementMetric =
  | "tokens"
  | "executions"
  | "agents"
  | "tools";

export interface EnterprisePlan {
  readonly planId: string;
  readonly name: string;
  readonly active: boolean;
}

export interface EnterpriseEntitlementLimits {
  readonly tokens?: number;
  readonly executions?: number;
  readonly agents?: number;
  readonly tools?: number;
}

export interface EnterpriseEntitlementSet {
  readonly workspaceId: string;
  readonly plan: EnterprisePlan;
  readonly limits: EnterpriseEntitlementLimits;
}

export interface EnterpriseUsageSnapshot {
  readonly workspaceId: string;
  readonly tokens: number;
  readonly executions: number;
  readonly agents: number;
  readonly tools: number;
}

export interface EnterpriseEntitlementRequest {
  readonly workspaceId: string;
  readonly metric: EntitlementMetric;
  readonly amount: number;
}

export type EnterpriseEntitlementDecision =
  | "ALLOW"
  | "BLOCK";

export interface EnterpriseEntitlementResult {
  readonly decision: EnterpriseEntitlementDecision;
  readonly workspaceId: string;
  readonly metric: EntitlementMetric;
  readonly requested: number;
  readonly used: number;
  readonly limit?: number;
  readonly remaining?: number;
  readonly reason: string;
}

function required(name: string, value: string): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `[ENTITLEMENT:INVALID] ${name} is required`,
    );
  }

  return value;
}

function nonNegativeInteger(
  name: string,
  value: number,
): number {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `[ENTITLEMENT:INVALID] ${name} must be a non-negative integer`,
    );
  }

  return value;
}

export function createEnterprisePlan(
  input: {
    readonly planId: string;
    readonly name: string;
    readonly active?: boolean;
  },
): EnterprisePlan {
  return Object.freeze({
    planId: required("planId", input.planId),
    name: required("name", input.name),
    active: input.active ?? true,
  });
}

export function createEnterpriseEntitlementSet(
  input: {
    readonly workspaceId: string;
    readonly plan: EnterprisePlan;
    readonly limits: EnterpriseEntitlementLimits;
  },
): EnterpriseEntitlementSet {
  required("workspaceId", input.workspaceId);

  const limits: EnterpriseEntitlementLimits = {};

  for (const metric of [
    "tokens",
    "executions",
    "agents",
    "tools",
  ] as const) {
    const value = input.limits[metric];

    if (value !== undefined) {
      (limits as Record<string, number>)[metric] =
        nonNegativeInteger(
          `limits.${metric}`,
          value,
        );
    }
  }

  return Object.freeze({
    workspaceId: input.workspaceId,
    plan: input.plan,
    limits: Object.freeze(limits),
  });
}

export class EnterpriseEntitlementEngine {
  evaluate(
    entitlements: EnterpriseEntitlementSet,
    usage: EnterpriseUsageSnapshot,
    request: EnterpriseEntitlementRequest,
  ): EnterpriseEntitlementResult {
    required(
      "entitlements.workspaceId",
      entitlements.workspaceId,
    );

    required(
      "usage.workspaceId",
      usage.workspaceId,
    );

    required(
      "request.workspaceId",
      request.workspaceId,
    );

    if (
      entitlements.workspaceId !==
        request.workspaceId
    ) {
      throw new Error(
        "[ENTITLEMENT:TENANT] entitlement workspace does not match request workspace",
      );
    }

    if (
      usage.workspaceId !==
        request.workspaceId
    ) {
      throw new Error(
        "[ENTITLEMENT:TENANT] usage workspace does not match request workspace",
      );
    }

    if (!entitlements.plan.active) {
      return Object.freeze({
        decision: "BLOCK",
        workspaceId: request.workspaceId,
        metric: request.metric,
        requested: request.amount,
        used: usage[request.metric],
        limit: entitlements.limits[request.metric],
        remaining: 0,
        reason: "Enterprise plan is inactive.",
      });
    }

    if (
      !Number.isInteger(request.amount) ||
      request.amount <= 0
    ) {
      throw new Error(
        "[ENTITLEMENT:INVALID] request.amount must be a positive integer",
      );
    }

    const used =
      nonNegativeInteger(
        `usage.${request.metric}`,
        usage[request.metric],
      );

    const limit =
      entitlements.limits[request.metric];

    if (limit === undefined) {
      return Object.freeze({
        decision: "ALLOW",
        workspaceId: request.workspaceId,
        metric: request.metric,
        requested: request.amount,
        used,
        reason:
          "No entitlement limit is configured for the requested metric.",
      });
    }

    const remaining =
      Math.max(limit - used, 0);

    if (
      used + request.amount > limit
    ) {
      return Object.freeze({
        decision: "BLOCK",
        workspaceId: request.workspaceId,
        metric: request.metric,
        requested: request.amount,
        used,
        limit,
        remaining,
        reason:
          `Entitlement limit exceeded for ${request.metric}.`,
      });
    }

    return Object.freeze({
      decision: "ALLOW",
      workspaceId: request.workspaceId,
      metric: request.metric,
      requested: request.amount,
      used,
      limit,
      remaining,
      reason:
        `Entitlement check passed for ${request.metric}.`,
    });
  }
}
