import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ContinuitySealEngine,
} from "../src/enterprise/continuity-seal";

import type {
  ContinuitySeal,
  ContinuitySealCurrentState,
  ContinuitySealInput,
} from "../src/enterprise/continuity-seal";

import type {
  TransitiveAuthorityResult,
} from "../src/enterprise/transitive-authority";

function authority(
  overrides: Partial<TransitiveAuthorityResult> = {},
): TransitiveAuthorityResult {
  return {
    workspaceId:
      "workspace-seal",

    sourceAgentId:
      "seal-agent",

    directlyReachableAgentIds:
      [],

    transitivelyReachableAgentIds:
      [],

    delegationHops:
      [],

    delegationDepth:
      0,

    transitivePaths:
      [],

    reachableResources:
      [],

    sensitiveResources:
      [],

    productionResources:
      [],

    blastRadiusScore:
      0,

    riskLevel:
      "LOW",

    directBlastRadiusScore:
      0,

    transitiveBlastRadiusIncrease:
      0,

    ...overrides,
  };
}

function input(
  overrides: Partial<ContinuitySealInput> = {},
): ContinuitySealInput {
  return {
    workspaceId:
      "workspace-seal",

    agentId:
      "seal-agent",

    executionId:
      "execution-001",

    action:
      "tool.execute",

    resource:
      "tool:database.read",

    tool:
      "database.read",

    input:
      {
        z: 3,
        nested: {
          b: true,
          a: "stable",
        },
        a: 1,
      },

    transitiveAuthority:
      authority(),

    authorityDriftSeverity:
      "NONE",

    createdAt:
      "2026-09-23T00:00:00.000Z",

    ...overrides,
  };
}

function currentFrom(
  base: ContinuitySealInput,
  overrides: Partial<ContinuitySealCurrentState> = {},
): ContinuitySealCurrentState {
  return {
    workspaceId:
      base.workspaceId,

    agentId:
      base.agentId,

    executionId:
      base.executionId,

    action:
      base.action,

    resource:
      base.resource,

    tool:
      base.tool,

    input:
      base.input,

    transitiveAuthority:
      base.transitiveAuthority,

    authorityDriftSeverity:
      base.authorityDriftSeverity,

    containmentAction:
      base.containmentAction,

    ...overrides,
  };
}

function cloneSeal(
  seal: ContinuitySeal,
): ContinuitySeal {
  return {
    ...seal,
  };
}

describe(
  "4.0 Continuity Seal™ adversarial engine",
  () => {

    it(
      "creates a deterministic frozen seal for identical execution state",
      () => {

        const engine =
          new ContinuitySealEngine();

        const one =
          engine.create(
            input(),
          );

        const two =
          engine.create(
            input(),
          );

        assert.equal(
          one.sealHash,
          two.sealHash,
        );

        assert.equal(
          one.sealId,
          two.sealId,
        );

        assert.equal(
          Object.isFrozen(one),
          true,
        );
      },
    );

    it(
      "canonicalizes nested input order deterministically",
      () => {

        const engine =
          new ContinuitySealEngine();

        const one =
          engine.create(
            input({
              input: {
                a: 1,
                z: 3,
                nested: {
                  a: "stable",
                  b: true,
                },
              },
            }),
          );

        const two =
          engine.create(
            input({
              input: {
                z: 3,
                nested: {
                  b: true,
                  a: "stable",
                },
                a: 1,
              },
            }),
          );

        assert.equal(
          one.sealHash,
          two.sealHash,
        );
      },
    );

    it(
      "rejects creation across workspace boundaries",
      () => {

        const engine =
          new ContinuitySealEngine();

        assert.throws(
          () =>
            engine.create(
              input({
                transitiveAuthority:
                  authority({
                    workspaceId:
                      "foreign-workspace",
                  }),
              }),
            ),
          /workspace mismatch/i,
        );
      },
    );

    it(
      "rejects creation for a different source agent",
      () => {

        const engine =
          new ContinuitySealEngine();

        assert.throws(
          () =>
            engine.create(
              input({
                transitiveAuthority:
                  authority({
                    sourceAgentId:
                      "foreign-agent",
                  }),
              }),
            ),
          /agent mismatch/i,
        );
      },
    );

    it(
      "rejects seal creation while authority drift is active",
      () => {

        const engine =
          new ContinuitySealEngine();

        assert.throws(
          () =>
            engine.create(
              input({
                authorityDriftSeverity:
                  "HIGH",
              }),
            ),
          /authority drift/i,
        );
      },
    );

    it(
      "rejects seal creation while containment is active",
      () => {

        const engine =
          new ContinuitySealEngine();

        assert.throws(
          () =>
            engine.create(
              input({
                containmentAction:
                  "BLOCK_EXECUTION",
              }),
            ),
          /containment/i,
        );
      },
    );

    const identityCases: Array<{
      name: string;
      mutate: (
        current: ContinuitySealCurrentState,
      ) => ContinuitySealCurrentState;
      code:
        string;
    }> = [

      {
        name:
          "workspace",

        mutate:
          (current) => ({
            ...current,
            workspaceId:
              "foreign-workspace",
          }),

        code:
          "WORKSPACE_MISMATCH",
      },

      {
        name:
          "agent",

        mutate:
          (current) => ({
            ...current,
            agentId:
              "foreign-agent",
          }),

        code:
          "AGENT_MISMATCH",
      },

      {
        name:
          "executionId",

        mutate:
          (current) => ({
            ...current,
            executionId:
              "execution-002",
          }),

        code:
          "EXECUTION_ID_MISMATCH",
      },

      {
        name:
          "action",

        mutate:
          (current) => ({
            ...current,
            action:
              "tool.execute.other",
          }),

        code:
          "ACTION_MISMATCH",
      },

      {
        name:
          "resource",

        mutate:
          (current) => ({
            ...current,
            resource:
              "tool:database.write",
          }),

        code:
          "RESOURCE_MISMATCH",
      },

      {
        name:
          "tool",

        mutate:
          (current) => ({
            ...current,
            tool:
              "different.tool",
          }),

        code:
          "TOOL_MISMATCH",
      },

      {
        name:
          "input",

        mutate:
          (current) => ({
            ...current,
            input:
              {
                mutated:
                  true,
              },
          }),

        code:
          "INPUT_MISMATCH",
      },
    ];

    for (const testCase of identityCases) {

      it(
        `rejects ${testCase.name} mismatch`,
        () => {

          const engine =
            new ContinuitySealEngine();

          const base =
            input();

          const seal =
            engine.create(
              base,
            );

          const verification =
            engine.verify(
              seal,
              testCase.mutate(
                currentFrom(
                  base,
                ),
              ),
            );

          assert.equal(
            verification.valid,
            false,
          );

          assert.equal(
            verification.code,
            testCase.code,
          );
        },
      );
    }

    it(
      "rejects tampered seal hash",
      () => {

        const engine =
          new ContinuitySealEngine();

        const base =
          input();

        const seal =
          engine.create(
            base,
          );

        const tampered =
          {
            ...cloneSeal(seal),
            sealHash:
              "00".repeat(32),
          };

        const verification =
          engine.verify(
            tampered,
            currentFrom(base),
          );

        assert.equal(
          verification.valid,
          false,
        );

        assert.equal(
          verification.code,
          "SEAL_TAMPERED",
        );
      },
    );

    it(
      "rejects tampered seal identity",
      () => {

        const engine =
          new ContinuitySealEngine();

        const base =
          input();

        const seal =
          engine.create(
            base,
          );

        const tampered =
          {
            ...cloneSeal(seal),
            sealId:
              "aseal_tampered",
          };

        const verification =
          engine.verify(
            tampered,
            currentFrom(base),
          );

        assert.equal(
          verification.valid,
          false,
        );

        assert.equal(
          verification.code,
          "SEAL_TAMPERED",
        );
      },
    );

    it(
      "detects effective authority change",
      () => {

        const engine =
          new ContinuitySealEngine();

        const base =
          input();

        const seal =
          engine.create(
            base,
          );

        const changed =
          authority({
            reachableResources:
              [
                "resource:production-db",
              ],

            productionResources:
              [
                "resource:production-db",
              ],

            blastRadiusScore:
              22,

            riskLevel:
              "MEDIUM",
          });

        const verification =
          engine.verify(
            seal,
            currentFrom(
              base,
              {
                transitiveAuthority:
                  changed,
              },
            ),
          );

        assert.equal(
          verification.valid,
          false,
        );

        assert.equal(
          verification.code,
          "AUTHORITY_CHANGED",
        );
      },
    );

    it(
      "invalidates the seal when authority drift becomes active",
      () => {

        const engine =
          new ContinuitySealEngine();

        const base =
          input();

        const seal =
          engine.create(
            base,
          );

        const verification =
          engine.verify(
            seal,
            currentFrom(
              base,
              {
                authorityDriftSeverity:
                  "HIGH",
              },
            ),
          );

        assert.equal(
          verification.valid,
          false,
        );

        assert.equal(
          verification.code,
          "AUTHORITY_DRIFT",
        );
      },
    );

    it(
      "invalidates the seal when containment activates",
      () => {

        const engine =
          new ContinuitySealEngine();

        const base =
          input();

        const seal =
          engine.create(
            base,
          );

        const verification =
          engine.verify(
            seal,
            currentFrom(
              base,
              {
                containmentAction:
                  "BLOCK_EXECUTION",
              },
            ),
          );

        assert.equal(
          verification.valid,
          false,
        );

        assert.equal(
          verification.code,
          "CONTAINMENT_ACTIVE",
        );
      },
    );

    it(
      "reconciles the expected effect with the sealed execution",
      () => {

        const engine =
          new ContinuitySealEngine();

        const base =
          input();

        const seal =
          engine.create(
            base,
          );

        const result =
          engine.reconcileEffect(
            seal,
            {
              workspaceId:
                base.workspaceId,

              agentId:
                base.agentId,

              executionId:
                base.executionId,

              action:
                base.action,

              resource:
                base.resource,

              tool:
                base.tool,

              input:
                base.input,
            },
          );

        assert.equal(
          result.valid,
          true,
        );
      },
    );

    it(
      "rejects effect reconciliation after input mutation",
      () => {

        const engine =
          new ContinuitySealEngine();

        const base =
          input();

        const seal =
          engine.create(
            base,
          );

        const result =
          engine.reconcileEffect(
            seal,
            {
              workspaceId:
                base.workspaceId,

              agentId:
                base.agentId,

              executionId:
                base.executionId,

              action:
                base.action,

              resource:
                base.resource,

              tool:
                base.tool,

              input:
                {
                  mutated:
                    true,
                },
            },
          );

        assert.equal(
          result.valid,
          false,
        );

        assert.equal(
          result.code,
          "INPUT_MISMATCH",
        );
      },
    );

  },
);
