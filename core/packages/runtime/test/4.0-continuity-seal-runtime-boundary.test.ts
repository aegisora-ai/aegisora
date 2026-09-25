import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  Agent,
} from "../src/agent/core/agent";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

import {
  ProviderExecutionGateway,
} from "../src/providers/provider-execution-gateway";

import {
  ProviderRouter,
} from "../src/providers/provider-router";

import {
  BaseProvider,
} from "../src/providers/base-provider";

import type {
  ProviderRequest,
  ProviderResponse,
} from "../src/providers/base-provider";

import {
  ToolRegistry,
} from "../src/tools/tool-registry";

import {
  EnforcementGate,
} from "../src/enforcement";

import type {
  CompromiseSimulationGraph,
} from "@aegisora/core";

function lowGraph(
  agentId: string,
): CompromiseSimulationGraph {
  return {
    nodes: [
      {
        id:
          `agent:${agentId}`,

        workspaceId:
          "workspace-seal-runtime",

        type:
          "agent",
      },
    ],

    edges: [],
  };
}

function criticalGraph(
  agentId: string,
): CompromiseSimulationGraph {
  return {
    nodes: [
      {
        id:
          `agent:${agentId}`,

        workspaceId:
          "workspace-seal-runtime",

        type:
          "agent",
      },

      {
        id:
          "agent:sealed-critical-1",

        workspaceId:
          "workspace-seal-runtime",

        type:
          "agent",
      },

      {
        id:
          "agent:sealed-critical-2",

        workspaceId:
          "workspace-seal-runtime",

        type:
          "agent",
      },

      {
        id:
          "resource:sealed-prod-1",

        workspaceId:
          "workspace-seal-runtime",

        type:
          "resource",

        sensitive:
          true,

        environment:
          "production",
      },

      {
        id:
          "resource:sealed-prod-2",

        workspaceId:
          "workspace-seal-runtime",

        type:
          "resource",

        sensitive:
          true,

        environment:
          "production",
      },

      {
        id:
          "resource:sealed-prod-3",

        workspaceId:
          "workspace-seal-runtime",

        type:
          "resource",

        sensitive:
          true,

        environment:
          "production",
      },
    ],

    edges: [
      {
        id:
          "sealed-critical-delegate-1",

        workspaceId:
          "workspace-seal-runtime",

        from:
          `agent:${agentId}`,

        to:
          "agent:sealed-critical-1",

        type:
          "DELEGATES_TO",
      },

      {
        id:
          "sealed-critical-delegate-2",

        workspaceId:
          "workspace-seal-runtime",

        from:
          "agent:sealed-critical-1",

        to:
          "agent:sealed-critical-2",

        type:
          "DELEGATES_TO",
      },

      {
        id:
          "sealed-critical-resource-1",

        workspaceId:
          "workspace-seal-runtime",

        from:
          "agent:sealed-critical-2",

        to:
          "resource:sealed-prod-1",

        type:
          "REACHES",
      },

      {
        id:
          "sealed-critical-resource-2",

        workspaceId:
          "workspace-seal-runtime",

        from:
          "agent:sealed-critical-2",

        to:
          "resource:sealed-prod-2",

        type:
          "REACHES",
      },

      {
        id:
          "sealed-critical-resource-3",

        workspaceId:
          "workspace-seal-runtime",

        from:
          "agent:sealed-critical-2",

        to:
          "resource:sealed-prod-3",

        type:
          "REACHES",
      },
    ],
  };
}

class SealTestProvider extends BaseProvider {

  public readonly name =
    "seal-test";

  public calls =
    0;

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {

    this.calls += 1;

    return this.buildResponse(
      "seal-test",
      request.model ?? "seal-model",
      `SEAL:${request.prompt}`,
    );
  }
}

function registerAgent(
  context: RuntimeContext,
  agentId: string,
): void {

  context.agentRegistry.register(
    new Agent({
      id:
        agentId,

      name:
        "Continuity Seal Runtime Agent",
    }),
  );
}

describe(
  "4.0 Continuity Seal™ runtime boundary",
  () => {

    it(
      "automatically seals an allowed provider execution before side effect",
      async () => {

        const context =
          new RuntimeContext();

        const agentId =
          "continuity-runtime-allow";

        registerAgent(
          context,
          agentId,
        );

        context.configureAuthorityContext({
          workspaceId:
            "workspace-seal-runtime",

          graph:
            lowGraph(agentId),
        });

        const provider =
          new SealTestProvider();

        const token =
          Symbol(
            "continuity-seal-provider",
          );

        const router =
          new ProviderRouter(
            token,
          );

        router.register(
          "openai",
          provider,
        );

        const gateway =
          new ProviderExecutionGateway(
            context,
            router,
            undefined,
            undefined,
            token,
          );

        gateway
          .configureAuthorityAwareExecutionFromRuntimeContext();

        const response =
          await gateway.generate({
            agentId,

            provider:
              "openai",

            request: {
              prompt:
                "continuity-valid",
            },
          });

        assert.equal(
          response.output,
          "SEAL:continuity-valid",
        );

        assert.equal(
          provider.calls,
          1,
        );

        const evidence =
          context.evidenceStore.getAll();

        assert.ok(
          evidence.some(
            (record) =>
              record.metadata &&
              record.metadata
                .continuitySealStatus ===
                "SEALED",
          ),
        );
      },
    );

    it(
      "blocks a provider when effective authority changes after sealing",
      async () => {

        const context =
          new RuntimeContext();

        const agentId =
          "continuity-runtime-mutation";

        registerAgent(
          context,
          agentId,
        );

        context.configureAuthorityContext({
          workspaceId:
            "workspace-seal-runtime",

          graph:
            lowGraph(agentId),
        });

        const original =
          context
            .getTransitiveAuthority
            .bind(context);

        let authorityCalls =
          0;

        context.getTransitiveAuthority =
          ((id: string) => {

            authorityCalls += 1;

            const result =
              original(id);

            if (authorityCalls === 2) {
              context.updateAuthorityGraph(
                criticalGraph(id),
              );
            }

            return result;

          }) as RuntimeContext[
            "getTransitiveAuthority"
          ];

        const provider =
          new SealTestProvider();

        const token =
          Symbol(
            "continuity-seal-mutation",
          );

        const router =
          new ProviderRouter(
            token,
          );

        router.register(
          "openai",
          provider,
        );

        const gateway =
          new ProviderExecutionGateway(
            context,
            router,
            undefined,
            undefined,
            token,
          );

        gateway
          .configureAuthorityAwareExecutionFromRuntimeContext();

        await assert.rejects(
          () =>
            gateway.generate({
              agentId,

              provider:
                "openai",

              request: {
                prompt:
                  "must-never-run",
              },
            }),
          /CONTINUITY_SEAL:BLOCK/,
        );

        assert.equal(
          provider.calls,
          0,
        );

        assert.ok(
          authorityCalls >= 3,
        );
      },
    );

    it(
      "blocks a provider when execution input changes after sealing",
      async () => {

        const context =
          new RuntimeContext();

        const agentId =
          "continuity-runtime-input";

        registerAgent(
          context,
          agentId,
        );

        context.configureAuthorityContext({
          workspaceId:
            "workspace-seal-runtime",

          graph:
            lowGraph(agentId),
        });

        const gate =
          new EnforcementGate(
            context,
          );

        gate
          .configureAuthorityAwareExecutionFromRuntimeContext();

        const first =
          await gate.enforce({
            agentId,

            resourceType:
              "provider",

            tool:
              "provider:openai",

            action:
              "provider.generate",

            input:
              {
                model:
                  undefined,

                prompt:
                  "sealed-input",
              },
          });

        assert.equal(
          first.decision,
          "ALLOW",
        );

        assert.ok(
          first.continuitySeal,
        );

        const verification =
          gate.verifyContinuitySealForExecution(
            {
              agentId,

              resourceType:
                "provider",

              tool:
                "provider:openai",

              action:
                "provider.generate",

              input:
                {
                  model:
                    undefined,

                  prompt:
                    "tampered-input",
                },

              metadata:
                {
                  executionId:
                    first.executionId,
                },
            },

            first.continuitySeal!,
          );

        assert.equal(
          verification.valid,
          false,
        );

        assert.equal(
          verification.code,
          "INPUT_MISMATCH",
        );
      },
    );

    it(
      "binds Continuity Seal to ToolRegistry authorization receipt",
      async () => {

        const context =
          new RuntimeContext();

        const agentId =
          "continuity-tool-agent";

        registerAgent(
          context,
          agentId,
        );

        context.configureAuthorityContext({
          workspaceId:
            "workspace-seal-runtime",

          graph:
            lowGraph(agentId),
        });

        const gate =
          new EnforcementGate(
            context,
          );

        gate
          .configureAuthorityAwareExecutionFromRuntimeContext();

        const executionToken =
          Symbol(
            "continuity-tool-token",
          );

        const registry =
          new ToolRegistry(
            executionToken,
          );

        registry.setEnforcementGate(
          gate,
        );

        let calls =
          0;

        registry.register({
          name:
            "seal-tool",

          description:
            "Continuity Seal test tool",

          execute:
            async () => {

              calls += 1;

              return "TOOL_OK";
            },
        });

        const receipt =
          await registry.authorize(
            agentId,
            "seal-tool",
            {
              value:
                1,
            },
            {
              authorityWorkspaceId:
                "workspace-seal-runtime",
            },
          );

        assert.ok(
          receipt.continuitySeal,
        );

        const result =
          await registry.execute(
            "seal-tool",
            {
              value:
                1,
            },
            {
              agentId,

              metadata:
                {
                  authorityWorkspaceId:
                    "workspace-seal-runtime",
                },
            },
            executionToken,
            receipt,
          );

        assert.equal(
          result,
          "TOOL_OK",
        );

        assert.equal(
          calls,
          1,
        );
      },
    );

    it(
      "blocks ToolRegistry execution after authority mutation",
      async () => {

        const context =
          new RuntimeContext();

        const agentId =
          "continuity-tool-mutation";

        registerAgent(
          context,
          agentId,
        );

        context.configureAuthorityContext({
          workspaceId:
            "workspace-seal-runtime",

          graph:
            lowGraph(agentId),
        });

        const gate =
          new EnforcementGate(
            context,
          );

        gate
          .configureAuthorityAwareExecutionFromRuntimeContext();

        const executionToken =
          Symbol(
            "continuity-tool-mutation-token",
          );

        const registry =
          new ToolRegistry(
            executionToken,
          );

        registry.setEnforcementGate(
          gate,
        );

        let calls =
          0;

        registry.register({
          name:
            "mutation-tool",

          description:
            "Mutation boundary test tool",

          execute:
            async () => {

              calls += 1;

              return "SHOULD_NOT_RUN";
            },
        });

        const receipt =
          await registry.authorize(
            agentId,
            "mutation-tool",
            {
              value:
                7,
            },
            {
              authorityWorkspaceId:
                "workspace-seal-runtime",
            },
          );

        assert.ok(
          receipt.continuitySeal,
        );

        context.updateAuthorityGraph(
          criticalGraph(agentId),
        );

        await assert.rejects(
          () =>
            registry.execute(
              "mutation-tool",
              {
                value:
                  7,
              },
              {
                agentId,

                metadata:
                  {
                    authorityWorkspaceId:
                      "workspace-seal-runtime",
                  },
              },
              executionToken,
              receipt,
            ),
          /CONTINUITY_SEAL:BLOCK/,
        );

        assert.equal(
          calls,
          0,
        );
      },
    );

  },
);
