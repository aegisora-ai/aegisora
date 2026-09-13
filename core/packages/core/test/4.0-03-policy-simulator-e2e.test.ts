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
  workspaceId: WorkspaceId,
  action: string,
  requestId: string,
  overrides: Partial<ControlRequest> = {},
): ControlRequest {
  return {
    requestId,
    workspaceId,
    agentId: "agent-e2e",
    action,
    environment: "development",
    declaredTool: true,
    ...overrides,
  };
}

function document(
  rules: PolicyDocument["rules"],
  defaultEffect:
    | "allow"
    | "block"
    | "escalate",
): PolicyDocument {
  return {
    version: 1,
    rules,
    defaultEffect,
  };
}

test(
  "4.0-03 E2E: enterprise shadow simulation produces complete policy impact report",
  () => {
    const registry =
      new InMemoryPolicyRegistry();

    const workspace =
      workspaceId("e2e-workspace");

    const policyIdValue =
      policyId("production-governance");

    const baselinePolicy =
      registry.createPolicy({
        id: policyIdValue,
        workspaceId: workspace,
        name: "Production Governance",
        document: document(
          [
            {
              id: "db-write",
              effect: "allow",
              action: "database.write",
              conditions: {},
              priority: 1,
            },
            {
              id: "external-send",
              effect: "allow",
              action: "external.send",
              conditions: {},
              priority: 1,
            },
            {
              id: "admin-change",
              effect: "escalate",
              action: "admin.change",
              conditions: {},
              priority: 1,
            },
          ],
          "block",
        ),
      });

    const v1 =
      baselinePolicy.currentVersionId!;

    registry.publishVersion(
      workspace,
      v1,
      "release-manager",
    );

    const candidate =
      registry.createVersion({
        policyId: policyIdValue,
        workspaceId: workspace,
        document: document(
          [
            {
              id: "db-write",
              effect: "block",
              action: "database.write",
              conditions: {},
              priority: 1,
            },
            {
              id: "external-send",
              effect: "block",
              action: "external.send",
              conditions: {},
              priority: 1,
            },
            {
              id: "admin-change",
              effect: "block",
              action: "admin.change",
              conditions: {},
              priority: 1,
            },
          ],
          "escalate",
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

    const requests = [
      request(
        workspace,
        "database.write",
        "e2e-allow-block",
      ),
      request(
        workspace,
        "unknown.action",
        "e2e-block-escalate",
      ),
      request(
        workspace,
        "admin.change",
        "e2e-escalate-block",
      ),
      request(
        workspace,
        "database.write",
        "e2e-risk-block",
        {
          action: "drop.database",
          declaredTool: false,
          payload: "secret",
        },
      ),
    ];

    const beforePolicy =
      registry.getPolicy(
        workspace,
        policyIdValue,
      )!;

    const beforeCandidate =
      registry.getVersion(
        workspace,
        candidate.id,
      )!;

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policyIdValue,
        candidateVersionId: candidate.id,
        requests,
      });

    assert.equal(
      result.workspaceId,
      workspace,
    );

    assert.equal(
      result.policyId,
      policyIdValue,
    );

    assert.equal(
      result.baselineVersionId,
      v1,
    );

    assert.equal(
      result.candidateVersionId,
      candidate.id,
    );

    assert.equal(
      result.totalRequests,
      4,
    );

    assert.equal(
      result.cases.length,
      4,
    );

    assert.equal(
      result.changedRequests,
      3,
    );

    assert.equal(
      result.unchangedRequests,
      1,
    );

    assert.equal(
      result.transitions["ALLOW->BLOCK"],
      1,
    );

    assert.equal(
      result.transitions["BLOCK->ESCALATE"],
      1,
    );

    assert.equal(
      result.transitions["ESCALATE->BLOCK"],
      1,
    );

    assert.equal(
      result.transitions["BLOCK->BLOCK"],
      1,
    );

    const ids =
      result.cases.map(
        (item) => item.requestId,
      );

    assert.deepEqual(
      ids,
      [
        "e2e-allow-block",
        "e2e-block-escalate",
        "e2e-escalate-block",
        "e2e-risk-block",
      ],
    );

    const afterPolicy =
      registry.getPolicy(
        workspace,
        policyIdValue,
      )!;

    const afterCandidate =
      registry.getVersion(
        workspace,
        candidate.id,
      )!;

    assert.equal(
      afterPolicy.currentVersionId,
      beforePolicy.currentVersionId,
    );

    assert.equal(
      afterPolicy.state,
      beforePolicy.state,
    );

    assert.equal(
      afterCandidate.publishedAt,
      beforeCandidate.publishedAt,
    );

    assert.equal(
      afterCandidate.publishedBy,
      beforeCandidate.publishedBy,
    );

    assert.equal(
      afterCandidate.immutable,
      true,
    );

    const repeat =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policyIdValue,
        candidateVersionId: candidate.id,
        requests,
      });

    assert.deepEqual(
      repeat,
      result,
    );
  },
);

test(
  "4.0-03 E2E: published baseline and candidate remain isolated from another workspace",
  () => {
    const registry =
      new InMemoryPolicyRegistry();

    const workspaceA =
      workspaceId("workspace-a");

    const workspaceB =
      workspaceId("workspace-b");

    const policyA =
      registry.createPolicy({
        id: policyId("isolated-policy"),
        workspaceId: workspaceA,
        name: "Isolated Policy",
        document: document(
          [],
          "block",
        ),
      });

    const versionA =
      policyA.currentVersionId!;

    registry.publishVersion(
      workspaceA,
      versionA,
      "release-manager",
    );

    const policyB =
      registry.createPolicy({
        id: policyId("isolated-policy"),
        workspaceId: workspaceB,
        name: "Isolated Policy",
        document: document(
          [],
          "allow",
        ),
      });

    const versionB =
      policyB.currentVersionId!;

    registry.publishVersion(
      workspaceB,
      versionB,
      "release-manager",
    );

    const candidateA =
      registry.createVersion({
        policyId: policyA.id,
        workspaceId: workspaceA,
        document: document(
          [],
          "allow",
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

    assert.throws(
      () =>
        simulator.simulate({
          workspaceId: workspaceA,
          policyId: policyA.id,
          candidateVersionId: versionB,
          requests: [
            request(
              workspaceA,
              "unknown.action",
              "foreign-version",
            ),
          ],
        }),
      /not found|another workspace|another policy/i,
    );

    const result =
      simulator.simulate({
        workspaceId: workspaceA,
        policyId: policyA.id,
        candidateVersionId: candidateA.id,
        requests: [
          request(
            workspaceA,
            "unknown.action",
            "isolated-e2e",
          ),
        ],
      });

    assert.equal(
      result.workspaceId,
      workspaceA,
    );

    assert.equal(
      result.baselineVersionId,
      versionA,
    );
  },
);

