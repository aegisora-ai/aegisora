import type {
  EnterpriseFailureDomain,
  EnterpriseRecoverySnapshot,
  EnterpriseRecoveryState,
} from "./types";

const ALLOWED: Record<
  EnterpriseRecoveryState,
  readonly EnterpriseRecoveryState[]
> = {
  HEALTHY: ["HEALTHY", "DEGRADED", "RECOVERING", "SAFE_MODE"],
  DEGRADED: ["DEGRADED", "RECOVERING", "SAFE_MODE", "HEALTHY"],
  RECOVERING: ["RECOVERING", "HEALTHY", "DEGRADED", "SAFE_MODE"],
  SAFE_MODE: ["SAFE_MODE", "RECOVERING"],
};

export class EnterpriseRecoveryEngine {
  canExecute(snapshot: EnterpriseRecoverySnapshot): boolean {
    if (!snapshot) {
      return false;
    }

    return snapshot.acceptingExecution;
  }

  transition(
    snapshot: EnterpriseRecoverySnapshot,
    nextState: EnterpriseRecoveryState,
  ): EnterpriseRecoverySnapshot {
    const allowed = ALLOWED[snapshot.state]?.includes(nextState) ?? false;

    if (!allowed) {
      throw new Error(
        `Invalid recovery transition: ${snapshot.state} -> ${nextState}`,
      );
    }

    return Object.freeze({
      ...snapshot,
      state: nextState,
      acceptingExecution:
        nextState === "SAFE_MODE"
          ? false
          : snapshot.acceptingExecution,
      updatedAt: new Date().toISOString(),
    });
  }

  failClosedFor(
    workspaceId: string,
    domain: EnterpriseFailureDomain,
  ): EnterpriseRecoverySnapshot {
    return Object.freeze({
      workspaceId,
      state:
        domain === "AUDIT" || domain === "STORAGE"
          ? "SAFE_MODE"
          : "DEGRADED",
      failures: [domain],
      acceptingExecution:
        domain !== "AUDIT" &&
        domain !== "STORAGE",
      updatedAt: new Date().toISOString(),
    });
  }
}
