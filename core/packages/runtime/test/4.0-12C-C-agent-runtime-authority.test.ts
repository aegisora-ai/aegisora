import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
  CompromiseSimulationGraph,
  ProviderRequest,
  ProviderResponse,
} from "@aegisora/core";

import {
  BaseProvider,
} from "../src/providers/base-provider";

import {
  AgentRuntime,
} from "../src/agent/runtime/agent-runtime";


class RuntimeTestProvider extends BaseProvider {

  public readonly name = "test";

  public calls = 0;

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {

    this.calls += 1;

    return this.buildResponse(
      "test",
      request.model ?? "test-model",
      `RUNTIME:${request.prompt}`,
    );
  }
}


function lowGraph(
  agentId: string,
): CompromiseSimulationGraph {

  return {
    nodes: [
      {
        id: `agent:${agentId}`,
        workspaceId: "workspace-runtime",
        type: "agent",
      },
    ],

    edges: [],
  };
}


function highGraph(
  agentId: string,
): CompromiseSimulationGraph {

  return {
    nodes: [
      {
        id: `agent:${agentId}`,
        workspaceId: "workspace-runtime",
        type: "agent",
      },

      {
        id: "agent:runtime-delegate",
        workspaceId: "workspace-runtime",
        type: "agent",
      },

      {
        id: "resource:runtime-prod-sensitive",
        workspaceId: "workspace-runtime",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
    ],

    edges: [
      {
        id: "runtime-high-delegation",
        workspaceId: "workspace-runtime",
        from: `agent:${agentId}`,
        to: "agent:runtime-delegate",
        type: "DELEGATES_TO",
      },

      {
        id: "runtime-high-resource",
        workspaceId: "workspace-runtime",
        from: "agent:runtime-delegate",
        to: "resource:runtime-prod-sensitive",
        type: "REACHES",
      },
    ],
  };
}


function criticalGraph(
  agentId: string,
): CompromiseSimulationGraph {

  return {
    nodes: [
      {
        id: `agent:${agentId}`,
        workspaceId: "workspace-runtime",
        type: "agent",
      },

      {
        id: "agent:runtime-critical-1",
        workspaceId: "workspace-runtime",
        type: "agent",
      },

      {
        id: "agent:runtime-critical-2",
        workspaceId: "workspace-runtime",
        type: "agent",
      },

      {
        id: "resource:runtime-critical-1",
        workspaceId: "workspace-runtime",
        type: "resource",
        sensitive: true,
        environment: "production",
      },

      {
        id: "resource:runtime-critical-2",
        workspaceId: "workspace-runtime",
        type: "resource",
        sensitive: true,
        environment: "production",
      },

      {
        id: "resource:runtime-critical-3",
        workspaceId: "workspace-runtime",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
    ],

    edges: [
      {
        id: "runtime-critical-delegation-1",
        workspaceId: "workspace-runtime",
        from: `agent:${agentId}`,
        to: "agent:runtime-critical-1",
        type: "DELEGATES_TO",
      },

      {
        id: "runtime-critical-delegation-2",
        workspaceId: "workspace-runtime",
        from: "agent:runtime-critical-1",
        to: "agent:runtime-critical-2",
        type: "DELEGATES_TO",
      },

      {
        id: "runtime-critical-resource-1",
        workspaceId: "workspace-runtime",
        from: "agent:runtime-critical-2",
        to: "resource:runtime-critical-1",
        type: "REACHES",
      },

      {
        id: "runtime-critical-resource-2",
        workspaceId: "workspace-runtime",
        from: "agent:runtime-critical-2",
        to: "resource:runtime-critical-2",
        type: "REACHES",
      },

      {
        id: "runtime-critical-resource-3",
        workspaceId: "workspace-runtime",
        from: "agent:runtime-critical-2",
        to: "resource:runtime-critical-3",
        type: "REACHES",
      },
    ],
  };
}


function createRuntimeFixture() {

  const runtime =
    new AgentRuntime();

  const agentId =
    "4.0-12C-runtime-agent";

  runtime.create(
    agentId,
  );

  const provider =
    new RuntimeTestProvider();

  const gateway =
    runtime.getProviderGateway();

  gateway.registerProvider(
    "openai",
    provider,
  );

  gateway.configureAuthorityAwareExecutionFromRuntimeContext();

  return {
    runtime,
    provider,
    gateway,
    agentId,
  };
}


describe(
  "4.0-12C-C AgentRuntime authority boundary",
  () => {

    it(
      "uses the real AgentRuntime RuntimeContext for LOW authority and executes provider",
      async () => {

        const fixture =
          createRuntimeFixture();

        const context =
          fixture.runtime.getContext();

        context.configureAuthorityContext({
          workspaceId:
            "workspace-runtime",

          graph:
            lowGraph(
              fixture.agentId,
            ),
        });

        const authority =
          context.getTransitiveAuthority(
            fixture.agentId,
          );

        assert.equal(
          authority.riskLevel,
          "LOW",
        );

        const response =
          await fixture.gateway.generate({
            agentId:
              fixture.agentId,

            provider:
              "openai",

            request: {
              prompt:
                "runtime-low-allowed",
            },
          });

        assert.equal(
          response.output,
          "RUNTIME:runtime-low-allowed",
        );

        assert.equal(
          fixture.provider.calls,
          1,
        );
      },
    );


    it(
      "uses the real AgentRuntime RuntimeContext for HIGH authority and escalates before provider invocation",
      async () => {

        const fixture =
          createRuntimeFixture();

        const context =
          fixture.runtime.getContext();

        context.configureAuthorityContext({
          workspaceId:
            "workspace-runtime",

          graph:
            highGraph(
              fixture.agentId,
            ),
        });

        const authority =
          context.getTransitiveAuthority(
            fixture.agentId,
          );

        assert.equal(
          authority.riskLevel,
          "HIGH",
        );

        assert.equal(
          authority.sensitiveResources.length,
          1,
        );

        assert.equal(
          authority.productionResources.length,
          1,
        );

        await assert.rejects(
          () =>
            fixture.gateway.generate({
              agentId:
                fixture.agentId,

              provider:
                "openai",

              request: {
                prompt:
                  "runtime-high-blocked",
              },
            }),

          /ENFORCEMENT:ESCALATE/,
        );

        assert.equal(
          fixture.provider.calls,
          0,
        );
      },
    );


    it(
      "uses the real AgentRuntime RuntimeContext for CRITICAL authority and blocks before provider invocation",
      async () => {

        const fixture =
          createRuntimeFixture();

        const context =
          fixture.runtime.getContext();

        context.configureAuthorityContext({
          workspaceId:
            "workspace-runtime",

          graph:
            criticalGraph(
              fixture.agentId,
            ),
        });

        const authority =
          context.getTransitiveAuthority(
            fixture.agentId,
          );

        assert.equal(
          authority.riskLevel,
          "CRITICAL",
        );

        assert.equal(
          authority.sensitiveResources.length,
          3,
        );

        assert.equal(
          authority.productionResources.length,
          3,
        );

        await assert.rejects(
          () =>
            fixture.gateway.generate({
              agentId:
                fixture.agentId,

              provider:
                "openai",

              request: {
                prompt:
                  "runtime-critical-blocked",
              },
            }),

          /ENFORCEMENT:BLOCK/,
        );

        assert.equal(
          fixture.provider.calls,
          0,
        );
      },
    );


    it(
      "keeps the runtime boundary live after authority graph changes",
      async () => {

        const fixture =
          createRuntimeFixture();

        const context =
          fixture.runtime.getContext();

        context.configureAuthorityContext({
          workspaceId:
            "workspace-runtime",

          graph:
            criticalGraph(
              fixture.agentId,
            ),
        });

        await assert.rejects(
          () =>
            fixture.gateway.generate({
              agentId:
                fixture.agentId,

              provider:
                "openai",

              request: {
                prompt:
                  "runtime-dynamic-block",
              },
            }),

          /ENFORCEMENT:BLOCK/,
        );

        assert.equal(
          fixture.provider.calls,
          0,
        );

        context.updateAuthorityGraph(
          lowGraph(
            fixture.agentId,
          ),
        );

        const updatedAuthority =
          context.getTransitiveAuthority(
            fixture.agentId,
          );

        assert.equal(
          updatedAuthority.riskLevel,
          "LOW",
        );

        const response =
          await fixture.gateway.generate({
            agentId:
              fixture.agentId,

            provider:
              "openai",

            request: {
              prompt:
                "runtime-dynamic-allow",
            },
          });

        assert.equal(
          response.output,
          "RUNTIME:runtime-dynamic-allow",
        );

        assert.equal(
          fixture.provider.calls,
          1,
        );
      },
    );


    it(
      "rejects a cross-workspace authority graph at the RuntimeContext boundary",
      () => {

        const fixture =
          createRuntimeFixture();

        const context =
          fixture.runtime.getContext();

        assert.throws(
          () =>
            context.configureAuthorityContext({
              workspaceId:
                "workspace-runtime",

              graph: {
                nodes: [
                  {
                    id:
                      `agent:${fixture.agentId}`,

                    workspaceId:
                      "different-workspace",

                    type:
                      "agent",
                  },
                ],

                edges: [],
              },
            }),

          /workspace mismatch/,
        );
      },
    );


    it(
      "keeps canonical workspace identity immutable",
      () => {

        const fixture =
          createRuntimeFixture();

        const context =
          fixture.runtime.getContext();

        context.configureAuthorityContext({
          workspaceId:
            "workspace-runtime",

          graph:
            lowGraph(
              fixture.agentId,
            ),
        });

        assert.throws(
          () =>
            context.configureAuthorityContext({
              workspaceId:
                "different-workspace",

              graph:
                lowGraph(
                  fixture.agentId,
                ),
            }),

          /workspace identity is immutable/,
        );
      },
    );

  },
);