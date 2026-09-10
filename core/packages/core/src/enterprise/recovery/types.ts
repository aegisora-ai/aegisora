export type EnterpriseRecoveryState =
  | "HEALTHY"
  | "DEGRADED"
  | "RECOVERING"
  | "SAFE_MODE";

export type EnterpriseFailureDomain =
  | "AUDIT"
  | "REALTIME"
  | "USAGE"
  | "PROVIDER"
  | "STORAGE";

export interface EnterpriseRecoverySnapshot {
  workspaceId: string;
  state: EnterpriseRecoveryState;
  failures: EnterpriseFailureDomain[];
  acceptingExecution: boolean;
}

export function executionAllowedDuringRecovery(
  snapshot: EnterpriseRecoverySnapshot,
): boolean {
  if (snapshot.state === "SAFE_MODE") {
    return false;
  }

  if (snapshot.failures.includes("AUDIT")) {
    return false;
  }

  if (snapshot.failures.includes("STORAGE")) {
    return false;
  }

  return snapshot.acceptingExecution;
}
