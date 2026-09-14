import type {
  AuthorityDriftEnforcementDecision,
} from "./authority-drift-enforcement";

export interface AuthorityDriftExecutionResult<T> {
  readonly executed: boolean;
  readonly action:
    | "MONITOR"
    | "ESCALATE"
    | "BLOCK"
    | "CONTAIN";

  readonly severity:
    | "NONE"
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  readonly value?: T;
  readonly reason: string;
}

export class AuthorityDriftExecutionBoundary {
  public execute<T>(
    decision: AuthorityDriftEnforcementDecision,
    sideEffect: () => T,
  ): AuthorityDriftExecutionResult<T> {

    if (
      !decision.executionAllowed
    ) {
      return {
        executed: false,
        action: decision.action,
        severity: decision.severity,
        reason: decision.reason,
      };
    }

    const value = sideEffect();

    return {
      executed: true,
      action: decision.action,
      severity: decision.severity,
      value,
      reason: decision.reason,
    };
  }
}