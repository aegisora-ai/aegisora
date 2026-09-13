import assert from "node:assert/strict";
import test from "node:test";

import {
  DeterministicDetectionEngine,
  DeterministicRiskEngine,
} from "../src/enterprise/risk";

import {
  InMemoryPolicyRegistry,
  PolicySimulator,
  policyId,
} from "../src/enterprise/policies";

import type {
  ControlRequest,
} from "../src/enterprise/control";

import type {
  PolicyDocument,
} from "../src/enterprise/policies";

import type {
  WorkspaceId,
} from "../src/enterprise/access";

function workspaceId(
  value: string,
): WorkspaceId {
  return value as WorkspaceId;
}

function request(
  workspace: WorkspaceId,
  action: string,
  requestId: string,
  overrides: Partial<ControlRequest> = {},
): ControlRequest {
  return {
    requestId,
    workspaceId: workspace,
    agentId: "agent-alpha",
    action,
    environment: "development",
    declaredTool: true,
    ...overrides,
  };
}

function document(
  action: string,
  effect: "allow" | "block" | "escalate",
  defaultEffect:
    | "allow"
    | "block"
    | "escalate" = "block",
): PolicyDocument {
  return {
    version: 1,
    rules: [
      {
        id: `${action}-rule`,
        effect,
        action,
        conditions: {},
        priority: 1,
      },
    ],
    defaultEffect,
  };
}

function simulatorFixture() {
  const registry =
    new InMemoryPolicyRegistry();

  const workspace =
    workspaceId("hardening-workspace");

  const policy =
    registry.createPolicy({
      id: policyId("hardening-policy"),
      workspaceId: workspace,
      name: "Hardening Policy",
      document: document(
        "database.write",
        "allow",
      ),
    });

  const v1 =
    policy.currentVersionId!;

  registry.publishVersion(
    workspace,
    v1,
    "release-manager",
  );

  const candidate =
    registry.createVersion({
      policyId: policy.id,
      workspaceId: workspace,
      document: document(
        "database.write",
        "block",
      ),
    });

  const simulator =
    new PolicySimulator({
      registry,
      riskEngine:
        new DeterministicRiskEngine(
          new DeterministicDetectionEngine(),
        ),
    });

  return {
    registry,
    workspace,
    policy,
    v1,
    candidate,
    simulator,
  };
}

test(
  "4.0-03 hardening: latest published version remains the baseline",
  () => {
    const fixture =
      simulatorFixture();

    const {
      registry,
      workspace,
      policy,
      v1,
      candidate,
      simulator,
    } = fixture;

    const intermediate =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: document(
          "database.write",
          "escalate",
        ),
      });

    registry.publishVersion(
      workspace,
      intermediate.id,
      "release-manager",
    );

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policy.id,
        candidateVersionId:
          candidate.id,
        requests: [
          request(
            workspace,
            "database.write",
            "baseline-selection",
          ),
        ],
      });

    assert.equal(
      result.baselineVersionId,
      intermediate.id,
    );

    assert.notEqual(
      result.baselineVersionId,
      v1,
    );
  },
);

test(
  "4.0-03 hardening: risk BLOCK dominates candidate ALLOW",
  () => {
    const {
      registry,
      workspace,
      policy,
      simulator,
    } = simulatorFixture();

    const candidate =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: document(
          "database.write",
          "allow",
        ),
      });

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policy.id,
        candidateVersionId:
          candidate.id,
        requests: [
          request(
            workspace,
            "database.write",
            "risk-block",
            {
              action: "drop.database",
            },
          ),
        ],
      });

    assert.equal(
      result.cases[0].baselineDecision,
      "BLOCK",
    );

    assert.equal(
      result.cases[0].candidateDecision,
      "BLOCK",
    );

    assert.equal(
      result.changedRequests,
      0,
    );

    assert.equal(
      result.transitions["BLOCK->BLOCK"],
      1,
    );
  },
);

test(
  "4.0-03 hardening: cross-workspace request is rejected before partial result",
  () => {
    const {
      workspace,
      candidate,
      policy,
      simulator,
    } = simulatorFixture();

    assert.throws(
      () =>
        simulator.simulate({
          workspaceId: workspace,
          policyId: policy.id,
          candidateVersionId:
            candidate.id,
          requests: [
            request(
              workspaceId(
                "foreign-workspace",
              ),
              "database.write",
              "foreign-request",
            ),
          ],
        }),
      /another workspace/i,
    );
  },
);

test(
  "4.0-03 hardening: simulation does not mutate policy current version",
  () => {
    const {
      registry,
      workspace,
      policy,
      candidate,
      simulator,
    } = simulatorFixture();

    const before =
      registry.getPolicy(
        workspace,
        policy.id,
      )!;

    const beforeVersion =
      before.currentVersionId;

    simulator.simulate({
      workspaceId: workspace,
      policyId: policy.id,
      candidateVersionId:
        candidate.id,
      requests: [
        request(
          workspace,
          "database.write",
          "no-mutation",
        ),
      ],
    });

    const after =
      registry.getPolicy(
        workspace,
        policy.id,
      )!;

    assert.equal(
      after.currentVersionId,
      beforeVersion,
    );

    assert.equal(
      after.state,
      before.state,
    );
  },
);

test(
  "4.0-03 hardening: ESCALATE -> BLOCK is reported",
  () => {
    const {
      registry,
      workspace,
      policy,
      simulator,
    } = simulatorFixture();

    const baseline =
      registry.getPolicy(
        workspace,
        policy.id,
      )!.currentVersionId!;

    registry.publishVersion(
      workspace,
      baseline,
      "release-manager",
    );

    const escalate =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: document(
          "database.write",
          "escalate",
          "escalate",
        ),
      });

    registry.publishVersion(
      workspace,
      escalate.id,
      "release-manager",
    );

    const candidate =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: document(
          "database.write",
          "block",
          "block",
        ),
      });

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policy.id,
        candidateVersionId:
          candidate.id,
        requests: [
          request(
            workspace,
            "unknown.action",
            "escalate-to-block",
          ),
        ],
      });

    assert.equal(
      result.transitions["ESCALATE->BLOCK"],
      1,
    );

    assert.equal(
      result.changedRequests,
      1,
    );
  },
);

test(
  "4.0-03 hardening: identical request set produces identical case ordering",
  () => {
    const {
      workspace,
      policy,
      candidate,
      simulator,
    } = simulatorFixture();

    const requests = [
      request(
        workspace,
        "database.write",
        "ordered-1",
      ),
      request(
        workspace,
        "unknown.action",
        "ordered-2",
      ),
      request(
        workspace,
        "database.write",
        "ordered-3",
      ),
    ];

    const first =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policy.id,
        candidateVersionId:
          candidate.id,
        requests,
      });

    const second =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policy.id,
        candidateVersionId:
          candidate.id,
        requests,
      });

    assert.deepEqual(
      first.cases,
      second.cases,
    );
  },
);
