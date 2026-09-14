import assert from "node:assert/strict";
import test from "node:test";

import {
  AgentRiskCenter,
} from "../src/enterprise/risk-center";

import {
  InMemoryAgentRegistry,
} from "../src/enterprise/agents";

import {
  RiskAssessmentRegistry,
} from "../src/enterprise/risk";

import type {
  AgentId,
  RegisteredAgent,
} from "../src/enterprise/agents";

import type {
  WorkspaceId,
} from "../src/enterprise/access";

import type {
  RiskAssessment,
  RiskEngine,
  RiskRequest,
} from "../src/enterprise/risk";

const ws = (
  value: string,
): WorkspaceId =>
  value as WorkspaceId;

const aid = (
  value: string,
): AgentId =>
  value as AgentId;

function agent(
  workspaceId: string,
  id: string,
  environment:
    | "production"
    | "staging"
    | "development"
    | "restricted" = "production",
): RegisteredAgent {
  const now = "2026-09-13T10:00:00.000Z";

  return {
    id: aid(id),
    workspaceId: ws(workspaceId),
    metadata: {
      name: id,
      environment,
      owner: {
        userId: `${id}-owner`,
      },
      tags: [
        "risk-test",
      ],
    },
    status: "active",
    declaredTools: [
      "database.read",
    ],
    declaredProviders: [
      "test-provider",
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function assessment(
  workspaceId: string,
  agentId: string,
  id: string,
  evaluatedAt: string,
  score: number,
  level: RiskAssessment["level"],
  recommendedDecision:
    RiskAssessment["recommendedDecision"],
  action: string,
  signalType:
    RiskAssessment["signals"][number]["type"],
): RiskAssessment {
  return {
    id: id as RiskAssessment["id"],
    workspaceId: ws(workspaceId),
    agentId,
    action,
    score,
    level,
    recommendedDecision,
    signals: [
      {
        id: `signal:${id}` as RiskAssessment["signals"][number]["id"],
        type: signalType,
        severity: level === "critical"
          ? "critical"
          : level,
        score,
        confidence: 0.95,
        reason: `${signalType} detected`,
        metadata: {
          source: "4.0-05-test",
        },
      },
    ],
    evaluatedAt,
  };
}

class FixtureRiskEngine
  implements RiskEngine {

  constructor(
    private readonly results:
      readonly RiskAssessment[],
  ) {}

  assess(
    request: RiskRequest,
  ): RiskAssessment {

    const result =
      this.results.find(
        (item) =>
          item.workspaceId === request.workspaceId &&
          item.agentId === request.agentId &&
          item.action === request.action,
      );

    assert.ok(
      result,
      `No fixture assessment for ${request.workspaceId}:${request.agentId}:${request.action}`,
    );

    return result;
  }
}

function buildCenter(
  agents: readonly RegisteredAgent[],
  assessments: readonly RiskAssessment[],
): AgentRiskCenter {

  const agentRegistry =
    new InMemoryAgentRegistry();

  for (const item of agents) {
    agentRegistry.register({
      id: item.id,
      workspaceId: item.workspaceId,
      metadata: item.metadata,
      declaredTools: item.declaredTools,
      declaredProviders: item.declaredProviders,
      createdAt: item.createdAt,
    });
  }

  const riskRegistry =
    new RiskAssessmentRegistry(
      new FixtureRiskEngine(
        assessments,
      ),
    );

  for (const item of assessments) {
    riskRegistry.assess({
      workspaceId: item.workspaceId,
      agentId: item.agentId,
      action: item.action,
    });
  }

  return new AgentRiskCenter(
    agentRegistry,
    riskRegistry,
  );
}

test("returns latest risk posture for each agent", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
      ],
      [
        assessment(
          "workspace-a",
          "agent-a",
          "assessment-old",
          "2026-09-13T09:00:00.000Z",
          35,
          "medium",
          "ESCALATE",
          "file.read",
          "sensitive_data",
        ),
        assessment(
          "workspace-a",
          "agent-a",
          "assessment-new",
          "2026-09-13T09:30:00.000Z",
          85,
          "critical",
          "BLOCK",
          "database.drop",
          "destructive_action",
        ),
      ],
    );

  const posture =
    center.get(
      ws("workspace-a"),
      aid("agent-a"),
    );

  assert.ok(posture);
  assert.equal(
    posture.latestAssessment?.id,
    "assessment-new",
  );
  assert.equal(
    posture.score,
    85,
  );
  assert.equal(
    posture.level,
    "critical",
  );
  assert.equal(
    posture.recommendedDecision,
    "BLOCK",
  );
  assert.equal(
    posture.assessmentCount,
    2,
  );
});

test("agent without assessments remains visible with unknown posture", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
      ],
      [],
    );

  const posture =
    center.get(
      ws("workspace-a"),
      aid("agent-a"),
    );

  assert.ok(posture);
  assert.equal(
    posture.latestAssessment,
    null,
  );
  assert.equal(
    posture.score,
    null,
  );
  assert.equal(
    posture.level,
    "unknown",
  );
  assert.equal(
    posture.recommendedDecision,
    "UNKNOWN",
  );
  assert.equal(
    posture.assessmentCount,
    0,
  );
});

test("lists only agents from the requested workspace", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
        agent("workspace-b", "agent-b"),
      ],
      [
        assessment(
          "workspace-a",
          "agent-a",
          "assessment-a",
          "2026-09-13T09:00:00.000Z",
          20,
          "low",
          "ALLOW",
          "file.read",
          "suspicious_network",
        ),
        assessment(
          "workspace-b",
          "agent-b",
          "assessment-b",
          "2026-09-13T09:00:00.000Z",
          90,
          "critical",
          "BLOCK",
          "database.drop",
          "destructive_action",
        ),
      ],
    );

  const result =
    center.list(
      ws("workspace-a"),
    );

  assert.equal(
    result.length,
    1,
  );

  assert.equal(
    result[0]?.agentId,
    "agent-a",
  );
});

test("summarizes risk and decision distributions", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
        agent("workspace-a", "agent-b"),
        agent("workspace-a", "agent-c"),
        agent("workspace-a", "agent-d"),
      ],
      [
        assessment(
          "workspace-a",
          "agent-a",
          "a1",
          "2026-09-13T09:00:00.000Z",
          10,
          "low",
          "ALLOW",
          "file.read",
          "suspicious_network",
        ),
        assessment(
          "workspace-a",
          "agent-b",
          "b1",
          "2026-09-13T09:00:00.000Z",
          45,
          "medium",
          "ESCALATE",
          "api.call",
          "sensitive_data",
        ),
        assessment(
          "workspace-a",
          "agent-c",
          "c1",
          "2026-09-13T09:00:00.000Z",
          70,
          "high",
          "BLOCK",
          "admin.execute",
          "privilege_escalation",
        ),
        assessment(
          "workspace-a",
          "agent-d",
          "d1",
          "2026-09-13T09:00:00.000Z",
          95,
          "critical",
          "BLOCK",
          "database.drop",
          "destructive_action",
        ),
      ],
    );

  const summary =
    center.summarize(
      ws("workspace-a"),
    );

  assert.equal(summary.totalAgents, 4);
  assert.equal(summary.assessedAgents, 4);
  assert.equal(summary.unassessedAgents, 0);

  assert.equal(summary.low, 1);
  assert.equal(summary.medium, 1);
  assert.equal(summary.high, 1);
  assert.equal(summary.critical, 1);

  assert.equal(summary.allow, 1);
  assert.equal(summary.escalate, 1);
  assert.equal(summary.block, 2);

  assert.equal(summary.averageScore, 55);
  assert.equal(summary.maxScore, 95);
});

test("aggregates top risk signals across latest assessments only", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
        agent("workspace-a", "agent-b"),
      ],
      [
        assessment(
          "workspace-a",
          "agent-a",
          "old-a",
          "2026-09-13T08:00:00.000Z",
          80,
          "critical",
          "BLOCK",
          "database.drop",
          "destructive_action",
        ),
        assessment(
          "workspace-a",
          "agent-a",
          "new-a",
          "2026-09-13T09:00:00.000Z",
          70,
          "high",
          "BLOCK",
          "admin.execute",
          "privilege_escalation",
        ),
        assessment(
          "workspace-a",
          "agent-b",
          "new-b",
          "2026-09-13T09:10:00.000Z",
          65,
          "high",
          "ESCALATE",
          "secret.read",
          "sensitive_data",
        ),
      ],
    );

  const summary =
    center.summarize(
      ws("workspace-a"),
    );

  assert.deepEqual(
    summary.topSignals,
    [
      {
        type: "privilege_escalation",
        count: 1,
      },
      {
        type: "sensitive_data",
        count: 1,
      },
    ],
  );
});

test("computes upward, downward, and stable agent risk trends", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "up"),
        agent("workspace-a", "down"),
        agent("workspace-a", "stable"),
      ],
      [
        assessment(
          "workspace-a",
          "up",
          "up-old",
          "2026-09-13T08:00:00.000Z",
          20,
          "low",
          "ALLOW",
          "file.read",
          "suspicious_network",
        ),
        assessment(
          "workspace-a",
          "up",
          "up-new",
          "2026-09-13T09:00:00.000Z",
          70,
          "high",
          "BLOCK",
          "admin.execute",
          "privilege_escalation",
        ),
        assessment(
          "workspace-a",
          "down",
          "down-old",
          "2026-09-13T08:00:00.000Z",
          80,
          "critical",
          "BLOCK",
          "database.drop",
          "destructive_action",
        ),
        assessment(
          "workspace-a",
          "down",
          "down-new",
          "2026-09-13T09:30:00.000Z",
          30,
          "medium",
          "ESCALATE",
          "file.read",
          "sensitive_data",
        ),
        assessment(
          "workspace-a",
          "stable",
          "stable-old",
          "2026-09-13T08:00:00.000Z",
          50,
          "medium",
          "ESCALATE",
          "api.call",
          "sensitive_data",
        ),
        assessment(
          "workspace-a",
          "stable",
          "stable-new",
          "2026-09-13T09:30:00.000Z",
          50,
          "medium",
          "ESCALATE",
          "api.call",
          "sensitive_data",
        ),
      ],
    );

  assert.equal(
    center.get(ws("workspace-a"), aid("up"))?.trend,
    "up",
  );

  assert.equal(
    center.get(ws("workspace-a"), aid("down"))?.trend,
    "down",
  );

  assert.equal(
    center.get(ws("workspace-a"), aid("stable"))?.trend,
    "stable",
  );
});

test("supports stale-assessment classification", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
      ],
      [
        assessment(
          "workspace-a",
          "agent-a",
          "stale-1",
          "2026-09-13T08:00:00.000Z",
          75,
          "high",
          "BLOCK",
          "admin.execute",
          "privilege_escalation",
        ),
      ],
    );

  const posture =
    center.get(
      ws("workspace-a"),
      aid("agent-a"),
      {
        now: "2026-09-13T10:00:00.000Z",
        staleAfterMs: 60 * 60 * 1000,
      },
    );

  assert.ok(posture);
  assert.equal(
    posture.stale,
    true,
  );
});

test("rejects invalid stale threshold", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
      ],
      [],
    );

  assert.throws(
    () =>
      center.get(
        ws("workspace-a"),
        aid("agent-a"),
        {
          staleAfterMs: -1,
        },
      ),
    /staleAfterMs/,
  );
});

test("snapshot remains isolated when caller mutates returned arrays", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
        agent("workspace-a", "agent-b"),
      ],
      [
        assessment(
          "workspace-a",
          "agent-a",
          "a1",
          "2026-09-13T09:00:00.000Z",
          85,
          "critical",
          "BLOCK",
          "database.drop",
          "destructive_action",
        ),
        assessment(
          "workspace-a",
          "agent-b",
          "b1",
          "2026-09-13T09:00:00.000Z",
          20,
          "low",
          "ALLOW",
          "file.read",
          "suspicious_network",
        ),
      ],
    );

  const first =
    center.list(
      ws("workspace-a"),
    );

  assert.equal(
    first.length,
    2,
  );

  const mutable =
    first as RegisteredAgent[];

  mutable.pop();

  const second =
    center.list(
      ws("workspace-a"),
    );

  assert.equal(
    second.length,
    2,
  );
});

test("repeated summary for identical inputs is deterministic", () => {

  const center =
    buildCenter(
      [
        agent("workspace-a", "agent-a"),
        agent("workspace-a", "agent-b"),
      ],
      [
        assessment(
          "workspace-a",
          "agent-a",
          "a1",
          "2026-09-13T09:00:00.000Z",
          45,
          "medium",
          "ESCALATE",
          "api.call",
          "sensitive_data",
        ),
        assessment(
          "workspace-a",
          "agent-b",
          "b1",
          "2026-09-13T09:10:00.000Z",
          90,
          "critical",
          "BLOCK",
          "database.drop",
          "destructive_action",
        ),
      ],
    );

  const first =
    center.summarize(
      ws("workspace-a"),
    );

  const second =
    center.summarize(
      ws("workspace-a"),
    );

  assert.deepEqual(
    second,
    first,
  );
});
