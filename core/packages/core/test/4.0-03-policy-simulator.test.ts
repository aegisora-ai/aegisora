import assert from "node:assert/strict";
import test from "node:test";

import {
  DeterministicDetectionEngine,
  DeterministicRiskEngine,
} from "../src/enterprise/risk";

import {
  InMemoryPolicyRegistry,
  policyId,
} from "../src/enterprise/policies";

import {
  PolicySimulator,
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
  requestId = `${action}-request`,
): ControlRequest {
  return {
    requestId,
    workspaceId: workspace,
    agentId: "agent-alpha",
    action,
    environment: "development",
    declaredTool: true,
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

function setup() {
  const registry =
    new InMemoryPolicyRegistry();

  const workspace =
    workspaceId("workspace-1");

  const policy =
    registry.createPolicy({
      id: policyId("operations-policy"),
      workspaceId: workspace,
      name: "Operations Policy",
      document: document(
        "database.write",
        "allow",
      ),
    });

  const v1Id =
    policy.currentVersionId!;

  registry.publishVersion(
    workspace,
    v1Id,
    "release-manager",
  );

  const v2 =
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
    v1Id,
    v2,
    simulator,
  };
}

test(
  "4.0-03 contract: ALLOW -> BLOCK is measured",
  () => {
    const {
      workspace,
      v2,
      simulator,
    } = setup();

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId:
          policyId("operations-policy"),
        candidateVersionId: v2.id,
        requests: [
          request(
            workspace,
            "database.write",
          ),
        ],
      });

    assert.equal(
      result.totalRequests,
      1,
    );

    assert.equal(
      result.changedRequests,
      1,
    );

    assert.equal(
      result.transitions["ALLOW->BLOCK"],
      1,
    );
  },
);

test(
  "4.0-03 contract: BLOCK -> ALLOW is measured",
  () => {
    const {
      registry,
      workspace,
      policy,
    } = setup();

    const v1 =
      registry.getVersion(
        workspace,
        policy.currentVersionId!,
      )!;

    const candidate =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: document(
          "database.write",
          "block",
        ),
      });

    registry.publishVersion(
      workspace,
      candidate.id,
      "release-manager",
    );

    const v3 =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: document(
          "database.write",
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

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policy.id,
        candidateVersionId: v3.id,
        requests: [
          request(
            workspace,
            "database.write",
            "block-to-allow",
          ),
        ],
      });

    assert.equal(
      v1.policyId,
      policy.id,
    );

    assert.equal(
      result.transitions["BLOCK->ALLOW"],
      1,
    );
  },
);

test(
  "4.0-03 contract: ALLOW -> ESCALATE is measured",
  () => {
    const {
      registry,
      workspace,
      policy,
    } = setup();

    const candidate =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: document(
          "database.write",
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

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policy.id,
        candidateVersionId: candidate.id,
        requests: [
          request(
            workspace,
            "database.write",
            "allow-to-escalate",
          ),
        ],
      });

    assert.equal(
      result.transitions["ALLOW->ESCALATE"],
      1,
    );
  },
);

test(
  "4.0-03 contract: BLOCK -> ESCALATE is measured",
  () => {
    const {
      registry,
      workspace,
      policy,
    } = setup();

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

    const candidate =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: document(
          "database.write",
          "escalate",
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

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId: policy.id,
        candidateVersionId: candidate.id,
        requests: [
          request(
            workspace,
            "unknown.action",
            "block-to-escalate",
          ),
        ],
      });

    assert.equal(
      result.transitions["BLOCK->ESCALATE"],
      1,
    );
  },
);

test(
  "4.0-03 contract: unchanged decisions are counted",
  () => {
    const {
      workspace,
      v2,
      simulator,
    } = setup();

    const result =
      simulator.simulate({
        workspaceId: workspace,
        policyId:
          policyId("operations-policy"),
        candidateVersionId: v2.id,
        requests: [
          request(
            workspace,
            "unknown.action",
            "unchanged",
          ),
        ],
      });

    assert.equal(
      result.totalRequests,
      1,
    );

    assert.equal(
      result.changedRequests,
      0,
    );

    assert.equal(
      result.unchangedRequests,
      1,
    );
  },
);

test(
  "4.0-03 contract: mixed request set produces deterministic impact summary",
  () => {
    const {
      workspace,
      v2,
      simulator,
    } = setup();

    const requests = [
      request(
        workspace,
        "database.write",
        "mixed-1",
      ),
      request(
        workspace,
        "unknown.action",
        "mixed-2",
      ),
      request(
        workspace,
        "database.write",
        "mixed-3",
      ),
    ];

    const first =
      simulator.simulate({
        workspaceId: workspace,
        policyId:
          policyId("operations-policy"),
        candidateVersionId: v2.id,
        requests,
      });

    const second =
      simulator.simulate({
        workspaceId: workspace,
        policyId:
          policyId("operations-policy"),
        candidateVersionId: v2.id,
        requests,
      });

    assert.deepEqual(
      first,
      second,
    );

    assert.equal(
      first.totalRequests,
      3,
    );
  },
);

test(
  "4.0-03 contract: candidate version must belong to requested policy",
  () => {
    const {
      registry,
      workspace,
      simulator,
    } = setup();

    const otherPolicy =
      registry.createPolicy({
        id: policyId("other-policy"),
        workspaceId: workspace,
        name: "Other Policy",
        document: document(
          "database.write",
          "block",
        ),
      });

    assert.throws(
      () =>
        simulator.simulate({
          workspaceId: workspace,
          policyId:
            policyId("operations-policy"),
          candidateVersionId:
            otherPolicy.currentVersionId!,
          requests: [
            request(
              workspace,
              "database.write",
              "cross-policy",
            ),
          ],
        }),
      /another policy|policy/i,
    );
  },
);

test(
  "4.0-03 contract: candidate version must belong to workspace",
  () => {
    const {
      registry,
      workspace,
      simulator,
    } = setup();

    const foreignWorkspace =
      workspaceId("workspace-2");

    const foreignPolicy =
      registry.createPolicy({
        id: policyId("foreign-policy"),
        workspaceId: foreignWorkspace,
        name: "Foreign Policy",
        document: document(
          "database.write",
          "block",
        ),
      });

    assert.throws(
      () =>
        simulator.simulate({
          workspaceId: workspace,
          policyId:
            policyId("operations-policy"),
          candidateVersionId:
            foreignPolicy.currentVersionId!,
          requests: [
            request(
              workspace,
              "database.write",
              "cross-workspace",
            ),
          ],
        }),
      /not found|workspace/i,
    );
  },
);

test(
  "4.0-03 contract: candidate simulation does not publish the candidate",
  () => {
    const {
      registry,
      workspace,
      policy,
      v2,
      simulator,
    } = setup();

    const before =
      registry.getVersion(
        workspace,
        v2.id,
      )!;

    assert.equal(
      before.publishedAt,
      undefined,
    );

    simulator.simulate({
      workspaceId: workspace,
      policyId: policy.id,
      candidateVersionId: v2.id,
      requests: [
        request(
          workspace,
          "database.write",
          "shadow-only",
        ),
      ],
    });

    const after =
      registry.getVersion(
        workspace,
        v2.id,
      )!;

    assert.equal(
      after.publishedAt,
      undefined,
    );

    assert.equal(
      after.immutable,
      true,
    );
  },
);

test(
  "4.0-03 contract: invalid candidate version is rejected",
  () => {
    const {
      registry,
      workspace,
      policy,
      simulator,
    } = setup();

    const invalid =
      registry.createVersion({
        policyId: policy.id,
        workspaceId: workspace,
        document: {
          version: 1,
          defaultEffect: "block",
          rules: [
            {
              id: "duplicate",
              effect: "allow",
              action: "database.write",
              conditions: {},
              priority: 1,
            },
            {
              id: "duplicate",
              effect: "block",
              action: "database.delete",
              conditions: {},
              priority: 2,
            },
          ],
        },
      });

    assert.equal(
      invalid.validation,
      "invalid",
    );

    assert.throws(
      () =>
        simulator.simulate({
          workspaceId: workspace,
          policyId: policy.id,
          candidateVersionId: invalid.id,
          requests: [
            request(
              workspace,
              "database.write",
              "invalid-candidate",
            ),
          ],
        }),
      /valid/i,
    );
  },
);
