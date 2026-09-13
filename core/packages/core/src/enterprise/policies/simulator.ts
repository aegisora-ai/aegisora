import type {
  WorkspaceId,
} from "../access";

import type {
  RiskEngine,
} from "../risk";

import {
  resolveControlDecision,
} from "../control/decision";

import type {
  ControlRequest,
  PolicyResolution,
} from "../control";

import type {
  PolicyDefinition,
  PolicyDocument,
  PolicyId,
  PolicyVersion,
  PolicyVersionId,
  PolicyDecisionEffect,
  PolicyRule,
} from "./types";

import type {
  PolicyRegistry,
} from "./registry";
export type PolicyDecisionStatus =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type PolicyDecisionTransition =
  | "ALLOW->ALLOW"
  | "ALLOW->BLOCK"
  | "ALLOW->ESCALATE"
  | "BLOCK->ALLOW"
  | "BLOCK->BLOCK"
  | "BLOCK->ESCALATE"
  | "ESCALATE->ALLOW"
  | "ESCALATE->BLOCK"
  | "ESCALATE->ESCALATE";

export interface PolicySimulationRequest {
  readonly workspaceId: WorkspaceId;
  readonly policyId: PolicyId;
  readonly candidateVersionId: PolicyVersionId;
  readonly requests: readonly ControlRequest[];
}

export interface PolicySimulationTransitionSummary {
  readonly "ALLOW->ALLOW": number;
  readonly "ALLOW->BLOCK": number;
  readonly "ALLOW->ESCALATE": number;

  readonly "BLOCK->ALLOW": number;
  readonly "BLOCK->BLOCK": number;
  readonly "BLOCK->ESCALATE": number;

  readonly "ESCALATE->ALLOW": number;
  readonly "ESCALATE->BLOCK": number;
  readonly "ESCALATE->ESCALATE": number;
}

export interface PolicySimulationCase {
  readonly requestId: string;
  readonly baselineDecision: PolicyDecisionStatus;
  readonly candidateDecision: PolicyDecisionStatus;
  readonly changed: boolean;
  readonly transition: PolicyDecisionTransition;
}

export interface PolicySimulationResult {
  readonly workspaceId: WorkspaceId;
  readonly policyId: PolicyId;
  readonly baselineVersionId: PolicyVersionId;
  readonly candidateVersionId: PolicyVersionId;

  readonly totalRequests: number;
  readonly changedRequests: number;
  readonly unchangedRequests: number;

  readonly transitions:
    PolicySimulationTransitionSummary;

  readonly cases: readonly PolicySimulationCase[];
}

export interface PolicySimulatorOptions {
  readonly registry: PolicyRegistry;
  readonly riskEngine: RiskEngine;
}

type MutablePolicySimulationTransitionSummary = {
  -readonly [K in PolicyDecisionTransition]: number;
};

function emptyTransitions():
  MutablePolicySimulationTransitionSummary {
  return {
    "ALLOW->ALLOW": 0,
    "ALLOW->BLOCK": 0,
    "ALLOW->ESCALATE": 0,

    "BLOCK->ALLOW": 0,
    "BLOCK->BLOCK": 0,
    "BLOCK->ESCALATE": 0,

    "ESCALATE->ALLOW": 0,
    "ESCALATE->BLOCK": 0,
    "ESCALATE->ESCALATE": 0,
  };
}

function policyEffectForRequest(
  document: PolicyDocument,
  request: ControlRequest,
): PolicyDecisionEffect {

  const matchedRule =
    document.rules.find(
      (rule: PolicyRule) =>
        rule.action === request.action ||
        rule.action === "*",
    );

  return (
    matchedRule?.effect ??
    document.defaultEffect
  );
}

function policyResolution(
  policy: PolicyDefinition,
  version: PolicyVersion,
  request: ControlRequest,
): PolicyResolution {

  const effect =
    policyEffectForRequest(
      version.document,
      request,
    );

  return {
    policy,
    version,
    matched:
      version.document.rules.some(
        (rule: PolicyRule) =>
          rule.action === request.action ||
          rule.action === "*",
      ),
    effect,
  };
}

function transition(
  baseline: PolicyDecisionStatus,
  candidate: PolicyDecisionStatus,
): PolicyDecisionTransition {
  return `${baseline}->${candidate}` as PolicyDecisionTransition;
}

export class PolicySimulator {

  constructor(
    private readonly options:
      PolicySimulatorOptions,
  ) {}

  simulate(
    input: PolicySimulationRequest,
  ): PolicySimulationResult {

    const {
      registry,
      riskEngine,
    } = this.options;

    const policy =
      registry.getPolicy(
        input.workspaceId,
        input.policyId,
      );

    if (!policy) {
      throw new Error(
        `Policy not found: ${input.policyId}`,
      );
    }

    const candidate =
      registry.getVersion(
        input.workspaceId,
        input.candidateVersionId,
      );

    if (!candidate) {
      throw new Error(
        `Candidate policy version not found: ${input.candidateVersionId}`,
      );
    }

    if (
      candidate.policyId !==
      input.policyId
    ) {
      throw new Error(
        "Candidate policy version belongs to another policy.",
      );
    }

    if (
      candidate.workspaceId !==
      input.workspaceId
    ) {
      throw new Error(
        "Candidate policy version belongs to another workspace.",
      );
    }

    if (
      candidate.validation !==
      "valid"
    ) {
      throw new Error(
        `Candidate policy version must be valid: ${candidate.id}`,
      );
    }

    const publishedVersions =
      registry.listVersions({
        workspaceId:
          input.workspaceId,
        policyId:
          input.policyId,
        publishedOnly: true,
      });

    if (
      publishedVersions.length === 0
    ) {
      throw new Error(
        `Policy has no published baseline: ${input.policyId}`,
      );
    }

    const baseline =
      [...publishedVersions].sort(
        (left, right) =>
          right.version - left.version,
      )[0];

    const summaries =
      emptyTransitions();

    const cases:
      PolicySimulationCase[] = [];

    for (const request of input.requests) {

      if (
        request.workspaceId !==
        input.workspaceId
      ) {
        throw new Error(
          `Simulation request belongs to another workspace: ${request.requestId}`,
        );
      }

      const risk =
        riskEngine.assess(
          request,
        );

      const baselineResolution =
        policyResolution(
          policy,
          baseline,
          request,
        );

      const candidateResolution =
        policyResolution(
          policy,
          candidate,
          request,
        );

      const baselineResult =
        resolveControlDecision(
          risk,
          baselineResolution,
        );

      const candidateResult =
        resolveControlDecision(
          risk,
          candidateResolution,
        );

      const baselineDecision =
        baselineResult.decision;

      const candidateDecision =
        candidateResult.decision;

      const currentTransition =
        transition(
          baselineDecision,
          candidateDecision,
        );

      summaries[currentTransition] += 1;

      cases.push({
        requestId:
          request.requestId,
        baselineDecision,
        candidateDecision,
        changed:
          baselineDecision !==
          candidateDecision,
        transition:
          currentTransition,
      });
    }

    const changedRequests =
      cases.filter(
        (item) => item.changed,
      ).length;

    return {
      workspaceId:
        input.workspaceId,

      policyId:
        input.policyId,

      baselineVersionId:
        baseline.id,

      candidateVersionId:
        candidate.id,

      totalRequests:
        cases.length,

      changedRequests,

      unchangedRequests:
        cases.length -
        changedRequests,

      transitions:
        summaries,

      cases,
    };
  }
}



