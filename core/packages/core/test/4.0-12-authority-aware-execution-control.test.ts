import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AuthorityAwareExecutionControlEngine,
} from "../src/enterprise/authority-aware-execution-control";

import type {
  TransitiveAuthorityResult,
} from "../src/enterprise/transitive-authority";

function authority(
  riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL",
): TransitiveAuthorityResult {
  return {
    workspaceId: "workspace-a",
    sourceAgentId: "finance",

    directlyReachableAgentIds: [],
    transitivelyReachableAgentIds:
      riskLevel === "LOW"
        ? []
        : ["worker-a"],

    delegationHops:
      riskLevel === "LOW"
        ? []
        : [
            {
              fromAgentId: "finance",
              toAgentId: "worker-a",
              edgeId: "delegation-1",
              depth: 1,
            },
          ],

    delegationDepth:
      riskLevel === "LOW"
        ? 0
        : 1,

    transitivePaths: [],

    reachableResources:
      riskLevel === "LOW"
        ? ["resource:reports"]
        : [
            "resource:reports",
            "resource:production-db",
          ],

    sensitiveResources:
      riskLevel === "LOW"
        ? []
        : ["resource:production-db"],

    productionResources:
      riskLevel === "LOW"
        ? []
        : ["resource:production-db"],

    blastRadiusScore:
      riskLevel === "LOW"
        ? 7
        : riskLevel === "MEDIUM"
          ? 40
          : riskLevel === "HIGH"
            ? 75
            : 100,

    riskLevel,

    directBlastRadiusScore: 7,

    transitiveBlastRadiusIncrease:
      riskLevel === "LOW"
        ? 0
        : 60,
  };
}

function inputFor(
  riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL",
) {
  return {
    workspaceId: "workspace-a",
    agentId: "finance",
    executionId: "execution-1",
    action: "read_report",
    resource: "reports",

    transitiveAuthority:
      authority(riskLevel),

    authorityDriftSeverity:
      "NONE" as const,
  };
}

describe(
  "4.0-12 authority-aware execution control",
  () => {
    it(
      "allows execution inside the normal authority envelope",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide(
            inputFor("LOW"),
          );

        assert.equal(
          decision.decision,
          "ALLOW",
        );

        assert.equal(
          decision.reasonCode,
          "AUTHORITY_OK",
        );
      },
    );

    it(
      "blocks critical transitive authority",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide(
            inputFor("CRITICAL"),
          );

        assert.equal(
          decision.decision,
          "BLOCK",
        );

        assert.equal(
          decision.reasonCode,
          "CRITICAL_TRANSITIVE_RISK",
        );
      },
    );

    it(
      "escalates high transitive authority without approval",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide(
            inputFor("HIGH"),
          );

        assert.equal(
          decision.decision,
          "ESCALATE",
        );

        assert.equal(
          decision.reasonCode,
          "HIGH_TRANSITIVE_RISK",
        );

        assert.equal(
          decision.requiresApproval,
          true,
        );
      },
    );

    it(
      "allows an approved high-risk execution with matching executionId",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide({
            ...inputFor("HIGH"),
            approval: {
              status: "approved",
              executionId: "execution-1",
              approvalId: "approval-1",
            },
          });

        assert.equal(
          decision.decision,
          "ALLOW",
        );

        assert.equal(
          decision.requiresApproval,
          true,
        );
      },
    );

    it(
      "blocks when approval executionId does not match",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide({
            ...inputFor("HIGH"),
            approval: {
              status: "approved",
              executionId: "different-execution",
              approvalId: "approval-1",
            },
          });

        assert.equal(
          decision.decision,
          "BLOCK",
        );

        assert.equal(
          decision.reasonCode,
          "APPROVAL_EXECUTION_MISMATCH",
        );
      },
    );

    it(
      "keeps pending approval deferred",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide({
            ...inputFor("MEDIUM"),
            approval: {
              status: "pending",
              executionId: "execution-1",
              approvalId: "approval-1",
            },
          });

        assert.equal(
          decision.decision,
          "ESCALATE",
        );

        assert.equal(
          decision.reasonCode,
          "APPROVAL_PENDING",
        );
      },
    );

    it(
      "blocks rejected approval",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide({
            ...inputFor("MEDIUM"),
            approval: {
              status: "rejected",
              executionId: "execution-1",
              approvalId: "approval-1",
            },
          });

        assert.equal(
          decision.decision,
          "BLOCK",
        );

        assert.equal(
          decision.reasonCode,
          "APPROVAL_REJECTED",
        );
      },
    );

    it(
      "blocks critical authority drift before execution",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide({
            ...inputFor("LOW"),
            authorityDriftSeverity:
              "CRITICAL",
          });

        assert.equal(
          decision.decision,
          "BLOCK",
        );

        assert.equal(
          decision.reasonCode,
          "CRITICAL_AUTHORITY_DRIFT",
        );
      },
    );

    it(
      "blocks when containment explicitly suspends the agent",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const decision =
          engine.decide({
            ...inputFor("LOW"),
            containmentAction:
              "SUSPEND_AGENT",
          });

        assert.equal(
          decision.decision,
          "BLOCK",
        );

        assert.equal(
          decision.reasonCode,
          "CRITICAL_CONTAINMENT",
        );
      },
    );

    it(
      "prevents the side effect for BLOCK",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        let calls = 0;

        const result =
          engine.execute(
            inputFor("CRITICAL"),
            () => {
              calls += 1;
              return "MUST_NOT_RUN";
            },
          );

        assert.equal(
          result.executed,
          false,
        );

        assert.equal(
          calls,
          0,
        );

        assert.equal(
          result.value,
          undefined,
        );
      },
    );

    it(
      "prevents the side effect for ESCALATE",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        let calls = 0;

        const result =
          engine.execute(
            inputFor("HIGH"),
            () => {
              calls += 1;
              return "MUST_NOT_RUN";
            },
          );

        assert.equal(
          result.executed,
          false,
        );

        assert.equal(
          calls,
          0,
        );
      },
    );

    it(
      "executes exactly once for ALLOW",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        let calls = 0;

        const result =
          engine.execute(
            inputFor("LOW"),
            () => {
              calls += 1;
              return "executed";
            },
          );

        assert.equal(
          result.executed,
          true,
        );

        assert.equal(
          calls,
          1,
        );

        assert.equal(
          result.value,
          "executed",
        );
      },
    );

    it(
      "produces a deterministic authority snapshot identity",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const first =
          engine.decide(
            inputFor("HIGH"),
          );

        const second =
          engine.decide(
            inputFor("HIGH"),
          );

        assert.equal(
          first.authoritySnapshotId,
          second.authoritySnapshotId,
        );

        assert.equal(
          first.authoritySnapshotId.length,
          64,
        );
      },
    );

    it(
      "changes the authority snapshot when the execution context changes",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const first =
          engine.decide(
            inputFor("LOW"),
          );

        const second =
          engine.decide({
            ...inputFor("LOW"),
            action: "delete_report",
          });

        assert.notEqual(
          first.authoritySnapshotId,
          second.authoritySnapshotId,
        );
      },
    );

    it(
      "remains workspace isolated",
      () => {
        const engine =
          new AuthorityAwareExecutionControlEngine();

        const authorityResult =
          authority("LOW");

        const decision =
          engine.decide({
            ...inputFor("LOW"),
            workspaceId:
              "workspace-b",
            transitiveAuthority:
              authorityResult,
          });

        assert.equal(
          decision.decision,
          "BLOCK",
        );

        assert.equal(
          decision.reasonCode,
          "AUTHORITY_CONTEXT_MISMATCH",
        );
      },
    );
  },
);