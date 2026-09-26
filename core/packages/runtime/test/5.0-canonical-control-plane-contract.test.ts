import assert from "node:assert/strict";
import test from "node:test";

import {
  agentId,
  policyId,
  policyVersionId,
  riskAssessmentId,
  workspaceId,
  assertCanonicalExecutionGraph,
  type CanonicalExecutionGraph,
} from "@aegisora/core";

const workspace = workspaceId(
  "workspace-canonical-test",
);

const agent = agentId(
  "agent-canonical-test",
);

const policy = policyId(
  "policy-canonical-test",
);

const policyVersion = policyVersionId(
  "policy-version-canonical-test",
);

const timestamp =
  "2026-09-26T15:00:00.000Z";

function baseGraph():
  CanonicalExecutionGraph {

  const intent = {
    workspaceId: workspace,
    agentId: agent,

    requestId:
      "request-canonical-test",

    correlationId:
      "correlation-canonical-test",

    action:
      "provider.generate",

    resource:
      "provider:openai",

    tool:
      "openai",

    provider:
      "openai",

    route:
      "/v1/chat",

    input: {
      prompt:
        "canonical-contract-test",
    },

    requestedAt:
      timestamp,
  };

  const identity = {
    workspaceId: workspace,
    agentId: agent,

    principalId:
      "principal-canonical-test",

    authenticationMethod:
      "workload",

    status:
      "active" as const,

    version:
      "identity-v1",

    resolvedAt:
      timestamp,
  };

  const authority = {
    workspaceId: workspace,
    agentId: agent,

    capability:
      "provider.generate",

    fingerprint:
      "authority-fingerprint-v1",

    resolvedAt:
      timestamp,

    tool:
      "openai",

    provider:
      "openai",

    model:
      "gpt-test",

    route:
      "/v1/chat",
  };

  const policyReference = {
    workspaceId: workspace,

    policyId:
      policy,

    versionId:
      policyVersion,

    version:
      1,

    digest:
      "sha256:canonical-test",
  };

  const risk = {
    assessmentId:
      riskAssessmentId(
        "risk-canonical-test",
      ),

    score:
      0,

    level:
      "low" as const,

    evaluatedAt:
      timestamp,
  };

  const decision = {
    decisionId:
      "decision-canonical-test",

    requestId:
      intent.requestId,

    correlationId:
      intent.correlationId,

    workspaceId:
      workspace,

    agentId:
      agent,

    decision:
      "ALLOW" as const,

    reasonCode:
      "POLICY_ALLOW",

    risk,

    policy:
      policyReference,

    authority,

    evaluatedAt:
      timestamp,
  };

  const execution = {
    executionId:
      "execution-canonical-test",

    requestId:
      intent.requestId,

    decisionId:
      decision.decisionId,

    workspaceId:
      workspace,

    agentId:
      agent,

    action:
      intent.action,

    resource:
      intent.resource,

    tool:
      intent.tool,

    provider:
      intent.provider,

    route:
      intent.route,

    continuitySealId:
      "aseal_canonical-test",

    status:
      "completed" as const,

    startedAt:
      timestamp,

    completedAt:
      timestamp,
  };

  const continuity = {
    sealId:
      "aseal_canonical-test",

    sealHash:
      "canonical-test-hash",

    executionId:
      execution.executionId,

    version:
      "1" as const,
  };

  const effect = {
    executionId:
      execution.executionId,

    outcome:
      "OBSERVED" as const,

    observedAt:
      timestamp,
  };

  const evidence = {
    evidenceId:
      "evidence-canonical-test",

    requestId:
      intent.requestId,

    correlationId:
      intent.correlationId,

    decisionId:
      decision.decisionId,

    executionId:
      execution.executionId,

    workspaceId:
      workspace,

    agentId:
      agent,

    policyVersionId:
      policyVersion,

    authorityFingerprint:
      authority.fingerprint,

    continuitySealId:
      continuity.sealId,

    createdAt:
      timestamp,
  };

  return {
    intent,
    identity,
    authority,
    policy:
      policyReference,
    risk,
    decision,
    continuity,
    execution,
    effect,
    evidence,
  };
}

test(
  "5.0 canonical execution graph accepts valid ALLOW flow",
  () => {
    assert.doesNotThrow(
      () =>
        assertCanonicalExecutionGraph(
          baseGraph(),
        ),
    );
  },
);

test(
  "5.0 canonical execution graph rejects identity workspace mismatch",
  () => {

    const graph =
      baseGraph();

    assert.throws(
      () =>
        assertCanonicalExecutionGraph({
          ...graph,

          identity: {
            ...graph.identity,

            workspaceId:
              workspaceId(
                "workspace-attacker",
              ),
          },
        }),

      /CANONICAL_WORKSPACE_MISMATCH: identity/,
    );
  },
);

test(
  "5.0 canonical execution graph requires approval for ESCALATE",
  () => {

    const graph =
      baseGraph();

    assert.throws(
      () =>
        assertCanonicalExecutionGraph({
          ...graph,

          decision: {
            ...graph.decision,

            decision:
              "ESCALATE",
          },

          approval:
            undefined,

          continuity:
            undefined,

          execution:
            undefined,

          effect:
            undefined,

          evidence:
            undefined,
        }),

      /CANONICAL_ESCALATION_APPROVAL_REQUIRED/,
    );
  },
);

test(
  "5.0 canonical execution graph permits pending ESCALATE without execution",
  () => {

    const graph =
      baseGraph();

    assert.doesNotThrow(
      () =>
        assertCanonicalExecutionGraph({
          ...graph,

          decision: {
            ...graph.decision,

            decision:
              "ESCALATE",
          },

          approval: {
            approvalId:
              "approval-canonical-test",

            requestId:
              graph.intent.requestId,

            decisionId:
              graph.decision.decisionId,

            workspaceId:
              workspace,

            agentId:
              agent,

            policyVersionId:
              policyVersion,

            authorityFingerprint:
              graph.authority.fingerprint,

            state:
              "pending",

            expiresAt:
              "2099-01-01T00:00:00.000Z",
          },

          continuity:
            undefined,

          execution:
            undefined,

          effect:
            undefined,

          evidence:
            undefined,
        }),
    );
  },
);

test(
  "5.0 canonical execution graph rejects side effect after BLOCK",
  () => {

    const graph =
      baseGraph();

    assert.throws(
      () =>
        assertCanonicalExecutionGraph({
          ...graph,

          decision: {
            ...graph.decision,

            decision:
              "BLOCK",
          },

          continuity:
            undefined,

          execution: {
            ...graph.execution,

            continuitySealId:
              undefined,

            status:
              "completed",
          },

          effect: {
            ...graph.effect,

            outcome:
              "NOT_ATTEMPTED",
          },

          evidence:
            undefined,
        }),

      /CANONICAL_NO_SIDE_EFFECT_VIOLATION/,
    );
  },
);

test(
  "5.0 canonical execution graph permits blocked execution without continuity seal",
  () => {

    const graph =
      baseGraph();

    assert.doesNotThrow(
      () =>
        assertCanonicalExecutionGraph({
          ...graph,

          decision: {
            ...graph.decision,

            decision:
              "BLOCK",
          },

          continuity:
            undefined,

          execution: {
            ...graph.execution,

            continuitySealId:
              undefined,

            status:
              "blocked",
          },

          effect:
            undefined,

          evidence:
            undefined,
        }),
    );
  },
);
