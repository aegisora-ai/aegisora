import { createHash } from "node:crypto";

import { SecurityEngine } from "../engine/security-engine";
import type { SecurityAnalysis, ThreatType } from "../types/security";

import { validateSecuritySelfPlayProposal } from "./task-validator";
import type {
  SecuritySelfPlayAnswer,
  SecuritySelfPlayCycleReport,
  SecuritySelfPlayEngineOptions,
  SecuritySelfPlayTask,
  SecuritySelfPlayTaskOutcome,
  SecuritySelfPlayTaskProposer,
  SecuritySelfPlayTaskSolver,
} from "./types";

const ALLOWED_THREAT_TYPES = new Set<ThreatType>([
  "PROMPT_INJECTION",
  "PII_EXPOSURE",
  "SUSPICIOUS_BEHAVIOR",
  "POLICY_VIOLATION",
]);

const DEFAULTS: Required<SecuritySelfPlayEngineOptions> = {
  maxTasksPerCycle: 8,
  maxProposalsPerCycle: 32,
  maxSeenTasks: 2048,
  proposerTimeoutMs: 15_000,
  solverTimeoutMs: 30_000,
};

interface SeenTask {
  readonly key: string;
  readonly workspaceId: string;
  readonly taskId: string;
}

function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("TIMEOUT"));
    }, timeoutMs);
  });

  const work = Promise.resolve().then(() => operation(controller.signal));
  return Promise.race([work, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

function normalizeAnswer(value: unknown): SecuritySelfPlayAnswer | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== "riskScore" || keys[1] !== "threatTypes") {
    return null;
  }

  if (!Array.isArray(record.threatTypes) || typeof record.riskScore !== "number") {
    return null;
  }
  if (!Number.isFinite(record.riskScore) || record.riskScore < 0) return null;

  const types = record.threatTypes;
  if (!types.every((item) => typeof item === "string" && ALLOWED_THREAT_TYPES.has(item as ThreatType))) {
    return null;
  }

  const normalizedTypes = (types as ThreatType[]).slice().sort();
  if (new Set(normalizedTypes).size !== normalizedTypes.length) return null;

  return Object.freeze({
    threatTypes: Object.freeze(normalizedTypes),
    riskScore: record.riskScore,
  });
}

function workspaceFingerprint(workspaceId: string, fingerprint: string): string {
  return createHash("sha256")
    .update(`${workspaceId}\u0000${fingerprint}`, "utf8")
    .digest("hex");
}

function compareAnswers(
  actual: SecuritySelfPlayAnswer,
  expected: SecuritySelfPlayAnswer,
): boolean {
  return (
    actual.riskScore === expected.riskScore &&
    actual.threatTypes.length === expected.threatTypes.length &&
    actual.threatTypes.every((type, index) => type === expected.threatTypes[index])
  );
}

/**
 * A bounded propose -> solve -> verify evaluation loop.
 *
 * SecurityEngine is the independent oracle. Model adapters only receive a
 * validated declarative task. This class never executes proposed code, shell
 * commands, tools, or production agent actions, and it does not train weights.
 */
export class SelfPlaySecurityEngine {
  private readonly seenKeys = new Set<string>();
  private readonly seenQueue: SeenTask[] = [];
  private readonly options: Required<SecuritySelfPlayEngineOptions>;

  constructor(dependencies: {
    readonly proposer: SecuritySelfPlayTaskProposer;
    readonly solver: SecuritySelfPlayTaskSolver;
    readonly oracle: SecurityEngine;
    readonly options?: SecuritySelfPlayEngineOptions;
  }) {
    this.proposer = dependencies.proposer;
    this.solver = dependencies.solver;
    this.oracle = dependencies.oracle;

    this.options = { ...DEFAULTS, ...dependencies.options };
    for (const [name, value] of Object.entries(this.options)) {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`Invalid SelfPlaySecurityEngine option: ${name}`);
      }
    }
    if (this.options.maxProposalsPerCycle < this.options.maxTasksPerCycle) {
      throw new Error("maxProposalsPerCycle must be >= maxTasksPerCycle.");
    }
  }

  private readonly proposer: SecuritySelfPlayTaskProposer;
  private readonly solver: SecuritySelfPlayTaskSolver;
  private readonly oracle: SecurityEngine;

  async runCycle(workspaceIdValue: string): Promise<SecuritySelfPlayCycleReport> {
    if (typeof workspaceIdValue !== "string" || workspaceIdValue.trim().length === 0) {
      throw new Error("workspaceId must be a non-empty string.");
    }
    const workspaceId = workspaceIdValue.trim();

    const recentTaskIds = this.seenQueue
      .filter((entry) => entry.workspaceId === workspaceId)
      .slice(-32)
      .map((entry) => entry.taskId);

    let proposals: readonly unknown[];
    try {
      proposals = await withTimeout(
        (signal) => this.proposer.propose(
          {
            workspaceId,
            maxTasks: this.options.maxTasksPerCycle,
            recentTaskIds,
          },
          signal,
        ),
        this.options.proposerTimeoutMs,
      );
    } catch {
      throw new Error("SELF_PLAY_PROPOSER_FAILED_OR_TIMED_OUT");
    }

    if (!Array.isArray(proposals)) {
      throw new Error("SELF_PLAY_PROPOSER_RETURNED_NON_ARRAY");
    }

    const examined = proposals.slice(0, this.options.maxProposalsPerCycle);
    const overflowCount = Math.max(0, proposals.length - examined.length);
    const outcomes: SecuritySelfPlayTaskOutcome[] = [];
    let acceptedCount = 0;

    for (const rawProposal of examined) {
      const validation = validateSecuritySelfPlayProposal(rawProposal);
      if (!validation.valid) {
        outcomes.push({
          status: "REJECTED_INVALID",
          reward: 0,
          reason: validation.reason,
        });
        continue;
      }

      if (acceptedCount >= this.options.maxTasksPerCycle) {
        outcomes.push({ status: "REJECTED_LIMIT", reward: 0 });
        continue;
      }

      const scopedFingerprint = workspaceFingerprint(workspaceId, validation.fingerprint);
      const seenKey = `${workspaceId}:${scopedFingerprint}`;
      if (this.seenKeys.has(seenKey)) {
        outcomes.push({ status: "REJECTED_DUPLICATE", reward: 0 });
        continue;
      }

      const taskId = `spsec_${scopedFingerprint.slice(0, 24)}`;
      const context = Object.freeze({ ...validation.proposal.context });
      const task: SecuritySelfPlayTask = Object.freeze({
        schemaVersion: "aegisora.security-task.v1",
        taskId,
        workspaceId,
        kind: validation.proposal.kind,
        context,
      });

      this.remember(seenKey, workspaceId, taskId);
      acceptedCount += 1;

      let analysis: SecurityAnalysis;
      try {
        analysis = await this.oracle.analyze({
          agentId: context.agentId,
          action: context.action,
          input: context.input,
        });
        if (!Number.isFinite(analysis.riskScore) || analysis.riskScore < 0) {
          throw new Error("INVALID_ORACLE_SCORE");
        }
      } catch {
        outcomes.push({
          taskId,
          status: "ORACLE_ERROR",
          reward: 0,
          reason: "SECURITY_ORACLE_FAILED",
        });
        continue;
      }

      const groundTruth: SecuritySelfPlayAnswer = Object.freeze({
        threatTypes: Object.freeze(
          [...new Set(analysis.threats.map((threat) => threat.type))].sort(),
        ),
        riskScore: analysis.riskScore,
      });

      let rawAnswer: unknown;
      try {
        rawAnswer = await withTimeout(
          (signal) => this.solver.solve(task, signal),
          this.options.solverTimeoutMs,
        );
      } catch {
        outcomes.push({
          taskId,
          status: "SOLVER_ERROR",
          reward: 0,
          reason: "SECURITY_SOLVER_FAILED_OR_TIMED_OUT",
          groundTruth,
        });
        continue;
      }

      const answer = normalizeAnswer(rawAnswer);
      if (!answer) {
        outcomes.push({
          taskId,
          status: "INVALID_ANSWER",
          reward: 0,
          reason: "ANSWER_SCHEMA_INVALID",
          groundTruth,
        });
        continue;
      }

      const verified = compareAnswers(answer, groundTruth);
      outcomes.push({
        taskId,
        status: verified ? "VERIFIED" : "INCORRECT_ANSWER",
        reward: verified ? 1 : 0,
        groundTruth,
        answer,
      });
    }

    const verifiedCount = outcomes.filter((item) => item.status === "VERIFIED").length;
    const rejectedCount =
      outcomes.filter((item) => item.status.startsWith("REJECTED_")).length + overflowCount;
    const evaluatedCount = outcomes.filter((item) => item.groundTruth !== undefined).length;
    const rewardSum = outcomes.reduce((total, item) => total + item.reward, 0);

    return Object.freeze({
      workspaceId,
      proposedCount: proposals.length,
      acceptedCount,
      evaluatedCount,
      verifiedCount,
      rejectedCount,
      overflowCount,
      rewardSum,
      outcomes: Object.freeze(outcomes),
    });
  }

  private remember(key: string, workspaceId: string, taskId: string): void {
    this.seenKeys.add(key);
    this.seenQueue.push({ key, workspaceId, taskId });

    while (this.seenQueue.length > this.options.maxSeenTasks) {
      const oldest = this.seenQueue.shift();
      if (oldest) this.seenKeys.delete(oldest.key);
    }
  }
}