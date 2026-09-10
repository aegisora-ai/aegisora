import {
  riskAssessmentId,
} from "./types";

import type {
  DetectionEngine,
  RiskAssessment,
  RiskLevel,
  RiskEngine,
  RiskRequest,
} from "./types";

function riskLevel(
  score: number,
  criticalSignal: boolean,
): RiskLevel {

  if (criticalSignal || score >= 80) {
    return "critical";
  }

  if (score >= 60) {
    return "high";
  }

  if (score >= 30) {
    return "medium";
  }

  return "low";
}

function decision(
  score: number,
  critical: boolean,
): RiskAssessment["recommendedDecision"] {

  if (critical || score >= 80) {
    return "BLOCK";
  }

  if (score >= 30) {
    return "ESCALATE";
  }

  return "ALLOW";
}

export class DeterministicRiskEngine
  implements RiskEngine {

  constructor(
    private readonly detector:
      DetectionEngine,
  ) {}

  assess(
    request: RiskRequest,
  ): RiskAssessment {

    const signals =
      this.detector.detect(
        request,
      );

    let score =
      signals.reduce(
        (total, item) =>
          total + item.score,
        0,
      );

    if (
      request.environment ===
      "production"
    ) {
      score += 10;
    }

    if (
      request.environment ===
      "restricted"
    ) {
      score += 15;
    }

    if (
      typeof request.historyRiskScore ===
      "number"
    ) {
      score += Math.round(
        Math.max(
          0,
          Math.min(
            20,
            request.historyRiskScore / 10,
          ),
        ),
      );
    }

    score = Math.min(
      100,
      score,
    );

    const critical =
      signals.some(
        (item) =>
          item.severity ===
          "critical",
      );

    const level =
      riskLevel(
        score,
        critical,
      );

    return {
      id: riskAssessmentId(
        `${request.workspaceId}:${request.agentId}:${Date.now()}`,
      ),
      workspaceId:
        request.workspaceId,
      agentId:
        request.agentId,
      action:
        request.action,
      score,
      level,
      recommendedDecision:
        decision(
          score,
          critical,
        ),
      signals: [...signals],
      evaluatedAt:
        new Date().toISOString(),
    };
  }
}
