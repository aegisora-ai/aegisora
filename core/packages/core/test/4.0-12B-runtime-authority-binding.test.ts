import test from "node:test";
import assert from "node:assert/strict";

import {
  AuthorityAwareRuntimeDecisionAdapter,
} from "../src/enterprise/runtime/authority-aware-adapter";

import {
  EnterpriseRuntimeExecutionGate,
} from "../src/enterprise/runtime/execution-gate";

import type {
  RuntimeExecutionRequest,
} from "../src/enterprise/runtime/types";

import type {
  AuthorityAwareRuntimeContext,
} from "../src/enterprise/runtime/authority-aware-adapter";

function authority(
  riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL",
) {
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
        ? ["reports"]
        : ["reports", "production-db"],

    sensitiveResources:
      riskLevel === "LOW"
        ? []
        : ["production-db"],

    productionResources:
      riskLevel === "LOW"
        ? []
        : ["production-db"],

    blastRadiusScore:
      riskLevel === "LOW"
        ? 7
        : riskLevel === "MEDIUM"
          ? 35
          : riskLevel === "HIGH"
            ? 75
            : 100,

    riskLevel,

    directBlastRadiusScore:
      riskLevel === "LOW"
        ? 7
        : 20,

    transitiveBlastRadiusIncrease:
      riskLevel === "LOW"
        ? 0
        : 55,
  };
}

function contextFor(
  riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL",
): AuthorityAwareRuntimeContext {
  return {
    resource: "reports",

    transitiveAuthority:
      authority(riskLevel),

    authorityDriftSeverity:
      "NONE",
  };
}

function request(
  riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL",
): RuntimeExecutionRequest {
  return {
    workspaceId: "workspace-a",
    requestId: "execution-1",
    agentId: "finance",
    action: "read_report",
    payload: {
      reportId: "quarterly-01",
    },
    environment: "production",
    declaredTool: true,
    historyRiskScore:
      riskLevel === "LOW"
        ? 10
        : 90,
  };
}

function adapterFor(
  riskLevel:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL",
) {
  return new AuthorityAwareRuntimeDecisionAdapter(
    {
      resolve: () =>
        contextFor(riskLevel),
    },
  );
}

test(
  "4.0-12B runtime gate allows normal authority execution",
  () => {
    const adapter =
      adapterFor("LOW");

    const gate =
      new EnterpriseRuntimeExecutionGate(
        adapter,
      );

    const result =
      gate.check(
        request("LOW"),
      );

    assert.deepEqual(
      result,
      {
        allowed: true,
        decision: "ALLOW",
      },
    );
  },
);

test(
  "4.0-12B runtime gate blocks critical transitive authority",
  () => {
    const adapter =
      adapterFor("CRITICAL");

    const gate =
      new EnterpriseRuntimeExecutionGate(
        adapter,
      );

    const result =
      gate.check(
        request("CRITICAL"),
      );

    assert.equal(
      result.allowed,
      false,
    );

    if (!result.allowed) {
      assert.equal(
        result.decision,
        "BLOCK",
      );

      assert.match(
        result.reason,
        /critical execution impact/i,
      );
    }
  },
);

test(
  "4.0-12B runtime gate escalates high authority without approval",
  () => {
    const adapter =
      adapterFor("HIGH");

    const gate =
      new EnterpriseRuntimeExecutionGate(
        adapter,
      );

    const result =
      gate.check(
        request("HIGH"),
      );

    assert.equal(
      result.allowed,
      false,
    );

    if (!result.allowed) {
      assert.equal(
        result.decision,
        "ESCALATE",
      );

      assert.match(
        result.reason,
        /approval/i,
      );
    }
  },
);

test(
  "4.0-12B preserves execution identity across the runtime boundary",
  () => {
    let observedExecutionId:
      string | undefined;

    const adapter =
      new AuthorityAwareRuntimeDecisionAdapter(
        {
          resolve: (runtimeRequest) => {
            observedExecutionId =
              runtimeRequest.requestId;

            return contextFor(
              "LOW",
            );
          },
        },
      );

    const gate =
      new EnterpriseRuntimeExecutionGate(
        adapter,
      );

    const result =
      gate.check(
        request("LOW"),
      );

    assert.equal(
      result.allowed,
      true,
    );

    assert.equal(
      observedExecutionId,
      "execution-1",
    );
  },
);

test(
  "4.0-12B blocks an invalid execution identity before authority evaluation",
  () => {
    const adapter =
      new AuthorityAwareRuntimeDecisionAdapter(
        {
          resolve: () =>
            contextFor("LOW"),
        },
        undefined,
        {
          resolve: () => "",
        },
      );

    const gate =
      new EnterpriseRuntimeExecutionGate(
        adapter,
      );

    const result =
      gate.check({
        ...request("LOW"),
        requestId: "request-1",
      });

    assert.deepEqual(
      result,
      {
        allowed: false,
        decision: "BLOCK",
        reason:
          "Execution identity is required before authority evaluation.",
      },
    );
  },
);

test(
  "4.0-12B remains workspace isolated through the runtime gate",
  () => {
    const authorityResult =
      authority("LOW");

    const adapter =
      new AuthorityAwareRuntimeDecisionAdapter(
        {
          resolve: () => ({
            resource: "reports",
            transitiveAuthority:
              authorityResult,
            authorityDriftSeverity:
              "NONE",
          }),
        },
      );

    const gate =
      new EnterpriseRuntimeExecutionGate(
        adapter,
      );

    const result =
      gate.check({
        ...request("LOW"),
        workspaceId:
          "workspace-b",
      });

    assert.equal(
      result.allowed,
      false,
    );

    if (!result.allowed) {
      assert.equal(
        result.decision,
        "BLOCK",
      );

      assert.match(
        result.reason,
        /different workspace|workspace/i,
      );
    }
  },
);
