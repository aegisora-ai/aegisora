import type { ThreatType } from "../types/security";

/**
 * v4.5 first vertical: verifiable security-classification tasks.
 * This deliberately starts with deduction only. Abduction, induction and
 * model-weight training are separate future milestones.
 */
export type SecuritySelfPlayTaskKind = "DEDUCTION";

export interface SecuritySelfPlayTaskContext {
  readonly agentId: string;
  readonly action: string;
  readonly input: string;
}

export interface SecuritySelfPlayProposal {
  readonly kind: SecuritySelfPlayTaskKind;
  readonly context: SecuritySelfPlayTaskContext;
}

/** The solver receives no ground-truth labels. */
export interface SecuritySelfPlayTask {
  readonly schemaVersion: "aegisora.security-task.v1";
  readonly taskId: string;
  readonly workspaceId: string;
  readonly kind: SecuritySelfPlayTaskKind;
  readonly context: SecuritySelfPlayTaskContext;
}

/** Exact machine-readable answer expected from a solver adapter. */
export interface SecuritySelfPlayAnswer {
  readonly threatTypes: readonly ThreatType[];
  readonly riskScore: number;
}

export type SecuritySelfPlayOutcomeStatus =
  | "REJECTED_INVALID"
  | "REJECTED_DUPLICATE"
  | "REJECTED_LIMIT"
  | "VERIFIED"
  | "INCORRECT_ANSWER"
  | "INVALID_ANSWER"
  | "SOLVER_ERROR"
  | "ORACLE_ERROR";

export interface SecuritySelfPlayTaskOutcome {
  readonly taskId?: string;
  readonly status: SecuritySelfPlayOutcomeStatus;
  /** Binary verification reward. This is evaluation output, not an RL update. */
  readonly reward: 0 | 1;
  readonly reason?: string;
  /** Ground truth is returned only after solving; it is never sent to the solver. */
  readonly groundTruth?: SecuritySelfPlayAnswer;
  /** Only normalized, schema-valid solver answers are returned. */
  readonly answer?: SecuritySelfPlayAnswer;
}

export interface SecuritySelfPlayCycleReport {
  readonly workspaceId: string;
  readonly proposedCount: number;
  readonly acceptedCount: number;
  readonly evaluatedCount: number;
  readonly verifiedCount: number;
  readonly rejectedCount: number;
  readonly overflowCount: number;
  readonly rewardSum: number;
  readonly outcomes: readonly SecuritySelfPlayTaskOutcome[];
}

export interface SecuritySelfPlayProposerRequest {
  readonly workspaceId: string;
  readonly maxTasks: number;
  /** Opaque IDs only; previous task content is not disclosed. */
  readonly recentTaskIds: readonly string[];
}

export interface SecuritySelfPlayTaskProposer {
  propose(
    request: SecuritySelfPlayProposerRequest,
    signal: AbortSignal,
  ): Promise<readonly unknown[]>;
}

export interface SecuritySelfPlayTaskSolver {
  solve(
    task: SecuritySelfPlayTask,
    signal: AbortSignal,
  ): Promise<unknown>;
}

export interface SecuritySelfPlayEngineOptions {
  readonly maxTasksPerCycle?: number;
  readonly maxProposalsPerCycle?: number;
  readonly maxSeenTasks?: number;
  readonly proposerTimeoutMs?: number;
  readonly solverTimeoutMs?: number;
}