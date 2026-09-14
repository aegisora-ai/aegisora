import type {
  WorkspaceId,
} from "./access";

import type {
  AgentId,
  RegisteredAgent,
} from "./agents";

import type {
  RiskAssessment,
  RiskAssessmentRegistry,
} from "./risk";

import type {
  AgentRegistry,
} from "./agents";

export type AgentRiskTrend =
  | "up"
  | "down"
  | "stable";

export interface AgentRiskCenterOptions {
  readonly now?: string;
  readonly staleAfterMs?: number;
}

export interface AgentRiskPosture {
  readonly agentId: AgentId;
  readonly workspaceId: WorkspaceId;
  readonly agent: RegisteredAgent;

  readonly latestAssessment: RiskAssessment | null;

  readonly score: number | null;

  readonly level:
    | RiskAssessment["level"]
    | "unknown";

  readonly recommendedDecision:
    | RiskAssessment["recommendedDecision"]
    | "UNKNOWN";

  readonly assessmentCount: number;

  readonly trend: AgentRiskTrend;

  readonly stale: boolean;
}

export interface AgentRiskTopSignal {
  readonly type:
    RiskAssessment["signals"][number]["type"];

  readonly count: number;
}

export interface AgentRiskSummary {
  readonly totalAgents: number;
  readonly assessedAgents: number;
  readonly unassessedAgents: number;

  readonly low: number;
  readonly medium: number;
  readonly high: number;
  readonly critical: number;

  readonly allow: number;
  readonly escalate: number;
  readonly block: number;

  readonly averageScore: number;
  readonly maxScore: number;

  readonly topSignals:
    readonly AgentRiskTopSignal[];
}

function parseTimestamp(
  value: string,
  field: string,
): number {
  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `${field} must be a valid ISO timestamp.`,
    );
  }

  return parsed;
}

function validateStaleAfterMs(
  value: number | undefined,
): number {
  const resolved =
    value ?? 60 * 60 * 1000;

  if (
    !Number.isFinite(resolved) ||
    resolved < 0
  ) {
    throw new Error(
      "staleAfterMs must be a non-negative finite number.",
    );
  }

  return resolved;
}

function latestAssessment(
  assessments: readonly RiskAssessment[],
): RiskAssessment | null {
  if (assessments.length === 0) {
    return null;
  }

  return [...assessments].sort(
    (left, right) =>
      Date.parse(right.evaluatedAt) -
      Date.parse(left.evaluatedAt),
  )[0] ?? null;
}

function riskTrend(
  assessments: readonly RiskAssessment[],
): AgentRiskTrend {
  if (assessments.length < 2) {
    return "stable";
  }

  const ordered = [...assessments].sort(
    (left, right) =>
      Date.parse(left.evaluatedAt) -
      Date.parse(right.evaluatedAt),
  );

  const previous =
    ordered[ordered.length - 2];

  const current =
    ordered[ordered.length - 1];

  if (!previous || !current) {
    return "stable";
  }

  if (current.score > previous.score) {
    return "up";
  }

  if (current.score < previous.score) {
    return "down";
  }

  return "stable";
}

function isStale(
  assessment: RiskAssessment | null,
  nowMs: number,
  staleAfterMs: number,
): boolean {
  if (!assessment) {
    return false;
  }

  const evaluatedAtMs =
    parseTimestamp(
      assessment.evaluatedAt,
      "evaluatedAt",
    );

  return (
    nowMs - evaluatedAtMs >=
    staleAfterMs
  );
}

function clonePosture(
  posture: AgentRiskPosture,
): AgentRiskPosture {
  return {
    ...posture,
    agent: {
      ...posture.agent,
      metadata: {
        ...posture.agent.metadata,
        owner: {
          ...posture.agent.metadata.owner,
        },
        tags: [
          ...posture.agent.metadata.tags,
        ],
      },
      declaredTools: [
        ...posture.agent.declaredTools,
      ],
      declaredProviders: [
        ...posture.agent.declaredProviders,
      ],
    },
    latestAssessment:
      posture.latestAssessment
        ? {
            ...posture.latestAssessment,
            signals:
              posture.latestAssessment.signals.map(
                (signal) => ({
                  ...signal,
                  metadata: {
                    ...signal.metadata,
                  },
                }),
              ),
          }
        : null,
  };
}

export class AgentRiskCenter {

  constructor(
    private readonly agentRegistry:
      AgentRegistry,

    private readonly riskRegistry:
      RiskAssessmentRegistry,
  ) {}

  get(
    workspaceId: WorkspaceId,
    agentId: AgentId,
    options:
      AgentRiskCenterOptions = {},
  ): AgentRiskPosture | null {

    const agent =
      this.agentRegistry.getById(
        workspaceId,
        agentId,
      );

    if (!agent) {
      return null;
    }

    const assessments =
      this.assessmentsForAgent(
        workspaceId,
        agentId,
      );

    const latest =
      latestAssessment(
        assessments,
      );

    const now =
      options.now ??
      new Date().toISOString();

    const nowMs =
      parseTimestamp(
        now,
        "now",
      );

    const staleAfterMs =
      validateStaleAfterMs(
        options.staleAfterMs,
      );

    const posture: AgentRiskPosture = {
      agentId:
        agent.id,

      workspaceId:
        agent.workspaceId,

      agent,

      latestAssessment:
        latest,

      score:
        latest?.score ?? null,

      level:
        latest?.level ?? "unknown",

      recommendedDecision:
        latest?.recommendedDecision ??
        "UNKNOWN",

      assessmentCount:
        assessments.length,

      trend:
        riskTrend(
          assessments,
        ),

      stale:
        isStale(
          latest,
          nowMs,
          staleAfterMs,
        ),
    };

    return clonePosture(
      posture,
    );
  }

  list(
    workspaceId: WorkspaceId,
    options:
      AgentRiskCenterOptions = {},
  ): readonly AgentRiskPosture[] {

    const agents =
      this.agentRegistry.list(
        workspaceId,
      );

    return agents
      .map(
        (agent) =>
          this.get(
            workspaceId,
            agent.id,
            options,
          ),
      )
      .filter(
        (
          posture,
        ): posture is AgentRiskPosture =>
          posture !== null,
      )
      .map(clonePosture);
  }

  summarize(
    workspaceId: WorkspaceId,
    options:
      AgentRiskCenterOptions = {},
  ): AgentRiskSummary {

    const postures =
      this.list(
        workspaceId,
        options,
      );

    const assessed =
      postures.filter(
        (posture) =>
          posture.latestAssessment !==
          null,
      );

    let low = 0;
    let medium = 0;
    let high = 0;
    let critical = 0;

    let allow = 0;
    let escalate = 0;
    let block = 0;

    const scores: number[] = [];

    const signalCounts =
      new Map<
        string,
        number
      >();

    for (const posture of assessed) {
      const assessment =
        posture.latestAssessment;

      if (!assessment) {
        continue;
      }

      scores.push(
        assessment.score,
      );

      switch (assessment.level) {
        case "low":
          low += 1;
          break;

        case "medium":
          medium += 1;
          break;

        case "high":
          high += 1;
          break;

        case "critical":
          critical += 1;
          break;
      }

      switch (
        assessment.recommendedDecision
      ) {
        case "ALLOW":
          allow += 1;
          break;

        case "ESCALATE":
          escalate += 1;
          break;

        case "BLOCK":
          block += 1;
          break;
      }

      for (const signal of assessment.signals) {
        signalCounts.set(
          signal.type,
          (
            signalCounts.get(
              signal.type,
            ) ?? 0
          ) + 1,
        );
      }
    }

    const topSignals =
      [...signalCounts.entries()]
        .map(
          ([type, count]) => ({
            type:
              type as AgentRiskTopSignal["type"],
            count,
          }),
        )
        .sort(
          (left, right) =>
            right.count -
              left.count ||
            left.type.localeCompare(
              right.type,
            ),
        );

    const totalScore =
      scores.reduce(
        (sum, score) =>
          sum + score,
        0,
      );

    return {
      totalAgents:
        postures.length,

      assessedAgents:
        assessed.length,

      unassessedAgents:
        postures.length -
        assessed.length,

      low,
      medium,
      high,
      critical,

      allow,
      escalate,
      block,

      averageScore:
        scores.length > 0
          ? totalScore /
            scores.length
          : 0,

      maxScore:
        scores.length > 0
          ? Math.max(...scores)
          : 0,

      topSignals,
    };
  }

  private assessmentsForAgent(
    workspaceId: WorkspaceId,
    agentId: AgentId,
  ): readonly RiskAssessment[] {

    return this.riskRegistry
      .list(workspaceId)
      .filter(
        (assessment) =>
          assessment.agentId ===
          agentId,
      );
  }
}
