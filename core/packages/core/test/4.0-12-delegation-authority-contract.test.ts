import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DelegationAuthorityContractEngine,
} from "../src/enterprise/delegation-authority-contract";

import {
  CompromiseSimulationGraph,
} from "../src/enterprise/compromise-simulation";

function graph(): CompromiseSimulationGraph {
  return {
    nodes: [
      {
        id: "agent:a",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "agent:b",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "agent:c",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "identity:a",
        workspaceId: "workspace-a",
        type: "identity",
      },
      {
        id: "identity:b",
        workspaceId: "workspace-a",
        type: "identity",
      },
      {
        id: "identity:c",
        workspaceId: "workspace-a",
        type: "identity",
      },
      {
        id: "capability:reports",
        workspaceId: "workspace-a",
        type: "capability",
      },
      {
        id: "capability:payments",
        workspaceId: "workspace-a",
        type: "capability",
      },
      {
        id: "tool:reports",
        workspaceId: "workspace-a",
        type: "tool",
      },
      {
        id: "tool:payments",
        workspaceId: "workspace-a",
        type: "tool",
      },
      {
        id: "provider:internal",
        workspaceId: "workspace-a",
        type: "provider",
      },
      {
        id: "provider:stripe",
        workspaceId: "workspace-a",
        type: "provider",
      },
      {
        id: "resource:reports",
        workspaceId: "workspace-a",
        type: "resource",
        environment: "development",
      },
      {
        id: "resource:payments",
        workspaceId: "workspace-a",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
      {
        id: "resource:future",
        workspaceId: "workspace-a",
        type: "resource",
        environment: "staging",
      },
      {
        id: "agent:external",
        workspaceId: "workspace-b",
        type: "agent",
      },
    ],
    edges: [
      {
        id: "a1",
        workspaceId: "workspace-a",
        from: "agent:a",
        to: "identity:a",
        type: "IDENTIFIED_AS",
      },
      {
        id: "a2",
        workspaceId: "workspace-a",
        from: "identity:a",
        to: "capability:reports",
        type: "GRANTS",
      },
      {
        id: "a3",
        workspaceId: "workspace-a",
        from: "capability:reports",
        to: "tool:reports",
        type: "USES",
      },
      {
        id: "a4",
        workspaceId: "workspace-a",
        from: "tool:reports",
        to: "provider:internal",
        type: "ROUTES_TO",
      },
      {
        id: "a5",
        workspaceId: "workspace-a",
        from: "provider:internal",
        to: "resource:reports",
        type: "REACHES",
      },

      {
        id: "b1",
        workspaceId: "workspace-a",
        from: "agent:b",
        to: "identity:b",
        type: "IDENTIFIED_AS",
      },
      {
        id: "b2",
        workspaceId: "workspace-a",
        from: "identity:b",
        to: "capability:reports",
        type: "GRANTS",
      },
      {
        id: "b3",
        workspaceId: "workspace-a",
        from: "capability:reports",
        to: "tool:reports",
        type: "USES",
      },
      {
        id: "b4",
        workspaceId: "workspace-a",
        from: "tool:reports",
        to: "provider:internal",
        type: "ROUTES_TO",
      },
      {
        id: "b5",
        workspaceId: "workspace-a",
        from: "provider:internal",
        to: "resource:reports",
        type: "REACHES",
      },

      {
        id: "b6",
        workspaceId: "workspace-a",
        from: "agent:b",
        to: "identity:b",
        type: "REQUIRES_APPROVAL",
      },

      {
        id: "c1",
        workspaceId: "workspace-a",
        from: "agent:c",
        to: "identity:c",
        type: "IDENTIFIED_AS",
      },
      {
        id: "c2",
        workspaceId: "workspace-a",
        from: "identity:c",
        to: "capability:payments",
        type: "GRANTS",
      },
      {
        id: "c3",
        workspaceId: "workspace-a",
        from: "capability:payments",
        to: "tool:payments",
        type: "USES",
      },
      {
        id: "c4",
        workspaceId: "workspace-a",
        from: "tool:payments",
        to: "provider:stripe",
        type: "ROUTES_TO",
      },
      {
        id: "c5",
        workspaceId: "workspace-a",
        from: "provider:stripe",
        to: "resource:payments",
        type: "REACHES",
      },

      {
        id: "d1",
        workspaceId: "workspace-a",
        from: "agent:b",
        to: "agent:c",
        type: "DELEGATES_TO",
      },
    ],
  };
}

function graphWithoutDelegation(): CompromiseSimulationGraph {
  const source = graph();

  return {
    ...source,
    edges: source.edges.filter(
      (edge) =>
        edge.type !== "DELEGATES_TO",
    ),
  };
}
function baseContractInput() {
  return {
    workspaceId: "workspace-a",
    contractId: "contract-001",
    issuerAgentId: "a",
    delegateAgentId: "b",
    taskId: "task-42",
    scope: {
      capabilityIds: [
        "capability:reports",
      ],
      toolIds: [
        "tool:reports",
      ],
      providerIds: [
        "provider:internal",
      ],
      resourceIds: [
        "resource:reports",
      ],
    },
    issuedAt: "2026-09-17T10:00:00.000Z",
    expiresAt: "2026-09-17T12:00:00.000Z",
    maxDelegationDepth: 1,
  };
}

describe(
  "4.0-12 delegation authority contracts",
  () => {
    it(
      "issues a canonical tamper-evident contract",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const first = engine.issue({
          ...baseContractInput(),
          scope: {
            capabilityIds: [
              "capability:reports",
            ],
            toolIds: [
              "tool:reports",
            ],
            providerIds: [
              "provider:internal",
            ],
            resourceIds: [
              "resource:reports",
            ],
          },
        });

        const second = engine.issue({
          ...baseContractInput(),
          scope: {
            capabilityIds: [
              "capability:reports",
            ],
            toolIds: [
              "tool:reports",
            ],
            providerIds: [
              "provider:internal",
            ],
            resourceIds: [
              "resource:reports",
            ],
          },
        });

        assert.equal(
          first.contractHash,
          second.contractHash,
        );

        assert.equal(
          first.expiresAt,
          "2026-09-17T12:00:00.000Z",
        );
      },
    );

    it(
      "allows authority that is fully non-amplifying and task-bound",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue(
            baseContractInput(),
          );

        const result =
          engine.evaluate({
            contract,
            graph: graphWithoutDelegation(),
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "ALLOW",
        );

        assert.deepEqual(
          result.unauthorizedChildAuthority,
          {
            capabilityIds: [],
            toolIds: [],
            providerIds: [],
            resourceIds: [],
          },
        );
      },
    );

    it(
      "blocks when the child holds authority outside the contract scope",
      () => {
        const source = graph();

        source.edges = [
          ...source.edges,
          {
            id: "b-payments-1",
            workspaceId: "workspace-a",
            from: "agent:b",
            to: "identity:c",
            type: "IDENTIFIED_AS",
          },
        ];

        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue(
            baseContractInput(),
          );

        const result =
          engine.evaluate({
            contract,
            graph: source,
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "BLOCK",
        );

        assert.ok(
          result.reasonCodes.includes(
            "CHILD_AUTHORITY_EXCEEDS_SCOPE",
          ),
        );

        assert.ok(
          result.unauthorizedChildAuthority
            .resourceIds.includes(
              "resource:payments",
            ),
        );
      },
    );

    it(
      "blocks authority amplification when the contract grants beyond the issuer",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue({
            ...baseContractInput(),
            scope: {
              ...baseContractInput()
                .scope,
              resourceIds: [
                "resource:reports",
                "resource:future",
              ],
            },
          });

        const result =
          engine.evaluate({
            contract,
            graph: graph(),
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "BLOCK",
        );

        assert.ok(
          result.reasonCodes.includes(
            "GRANT_OUTSIDE_PARENT_AUTHORITY",
          ),
        );

        assert.deepEqual(
          result.scopeOutsideParentAuthority.resourceIds,
          ["resource:future"],
        );
      },
    );

    it(
      "blocks expired contracts",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue(
            baseContractInput(),
          );

        const result =
          engine.evaluate({
            contract,
            graph: graph(),
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T12:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "BLOCK",
        );

        assert.ok(
          result.reasonCodes.includes(
            "EXPIRED",
          ),
        );
      },
    );

    it(
      "blocks task replay against a different task",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue(
            baseContractInput(),
          );

        const result =
          engine.evaluate({
            contract,
            graph: graph(),
            workspaceId:
              "workspace-a",
            taskId: "task-other",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "BLOCK",
        );

        assert.ok(
          result.reasonCodes.includes(
            "TASK_MISMATCH",
          ),
        );
      },
    );

    it(
      "blocks tampered contracts through canonical hash binding",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue(
            baseContractInput(),
          );

        const tampered = {
          ...contract,
          expiresAt:
            "2026-09-17T18:00:00.000Z",
        };

        const result =
          engine.evaluate({
            contract: tampered,
            graph: graph(),
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "BLOCK",
        );

        assert.ok(
          result.reasonCodes.includes(
            "HASH_MISMATCH",
          ),
        );
      },
    );

    it(
      "blocks further delegation when the contract forbids it",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue(
            baseContractInput(),
          );

        const result =
          engine.evaluate({
            contract,
            graph: graph(),
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "BLOCK",
        );

        assert.ok(
          result.reasonCodes.includes(
            "FURTHER_DELEGATION_FORBIDDEN",
          ),
        );

        assert.equal(
          result.observedDelegationDepth,
          1,
        );
      },
    );

    it(
      "allows bounded further delegation within max depth",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue({
            ...baseContractInput(),
            maxDelegationDepth: 2,
            allowFurtherDelegation:
              true,
          });

        const result =
          engine.evaluate({
            contract,
            graph: graph(),
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "ALLOW",
        );

        assert.equal(
          result.observedDelegationDepth,
          1,
        );
      },
    );

    it(
      "escalates contracts that explicitly require human approval",
      () => {
        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue({
            ...baseContractInput(),
            requiresHumanApproval:
              true,
          });

        const result =
          engine.evaluate({
            contract,
            graph: graphWithoutDelegation(),
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "ESCALATE",
        );

        assert.ok(
          result.reasonCodes.includes(
            "HUMAN_APPROVAL_REQUIRED",
          ),
        );
      },
    );

    it(
      "blocks cross-workspace delegation paths",
      () => {
        const source = graph();

        source.edges = [
          ...source.edges,
          {
            id: "cross-1",
            workspaceId: "workspace-a",
            from: "agent:b",
            to: "agent:external",
            type: "DELEGATES_TO",
          },
        ];

        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue({
            ...baseContractInput(),
            maxDelegationDepth: 2,
            allowFurtherDelegation:
              true,
          });

        const result =
          engine.evaluate({
            contract,
            graph: source,
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "BLOCK",
        );
      },
    );

    it(
      "prevents depth amplification beyond the contract ceiling",
      () => {
        const source = graph();

        source.edges = [
          ...source.edges,
          {
            id: "d2",
            workspaceId: "workspace-a",
            from: "agent:c",
            to: "agent:b",
            type: "DELEGATES_TO",
          },
        ];

        const engine =
          new DelegationAuthorityContractEngine();

        const contract =
          engine.issue({
            ...baseContractInput(),
            maxDelegationDepth: 1,
            allowFurtherDelegation:
              true,
          });

        const result =
          engine.evaluate({
            contract,
            graph: source,
            workspaceId:
              "workspace-a",
            taskId: "task-42",
            now: "2026-09-17T11:00:00.000Z",
          });

        assert.equal(
          result.decision,
          "BLOCK",
        );

        assert.ok(
          result.reasonCodes.includes(
            "DELEGATION_DEPTH_EXCEEDED",
          ),
        );
      },
    );
  },
);
