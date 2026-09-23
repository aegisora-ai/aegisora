import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  TransitiveAuthorityEngine,
  workspaceId,
} from "@aegisora/core";

import type {
  CompromiseSimulationGraph,
} from "@aegisora/core";

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


class TestProvider extends BaseProvider {

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
      `TEST:${request.prompt}`,
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
        workspaceId: "workspace-a",
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
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "agent:delegate-high",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "resource:production-sensitive",
        workspaceId: "workspace-a",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
    ],

    edges: [
      {
        id: "high-delegation",
        workspaceId: "workspace-a",
        from: `agent:${agentId}`,
        to: "agent:delegate-high",
        type: "DELEGATES_TO",
      },
      {
        id: "high-resource",
        workspaceId: "workspace-a",
        from: "agent:delegate-high",
        to: "resource:production-sensitive",
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
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "agent:delegate-critical-1",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "agent:delegate-critical-2",
        workspaceId: "workspace-a",
        type: "agent",
      },

      {
        id: "resource:prod-sensitive-1",
        workspaceId: "workspace-a",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
      {
        id: "resource:prod-sensitive-2",
        workspaceId: "workspace-a",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
      {
        id: "resource:prod-sensitive-3",
        workspaceId: "workspace-a",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
    ],

    edges: [
      {
        id: "critical-delegation-1",
        workspaceId: "workspace-a",
        from: `agent:${agentId}`,
        to: "agent:delegate-critical-1",
        type: "DELEGATES_TO",
      },
      {
        id: "critical-delegation-2",
        workspaceId: "workspace-a",
        from: "agent:delegate-critical-1",
        to: "agent:delegate-critical-2",
        type: "DELEGATES_TO",
      },

      {
        id: "critical-resource-1",
        workspaceId: "workspace-a",
        from: "agent:delegate-critical-2",
        to: "resource:prod-sensitive-1",
        type: "REACHES",
      },
      {
        id: "critical-resource-2",
        workspaceId: "workspace-a",
        from: "agent:delegate-critical-2",
        to: "resource:prod-sensitive-2",
        type: "REACHES",
      },
      {
        id: "critical-resource-3",
        workspaceId: "workspace-a",
        from: "agent:delegate-critical-2",
        to: "resource:prod-sensitive-3",
        type: "REACHES",
      },
    ],
  };
}


function createFixture() {

  const context =
    new RuntimeContext();

  const provider =
    new TestProvider();

  const executionToken =
    Symbol("4.0-12C.provider.test");

  const router =
    new ProviderRouter(
      executionToken,
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
      executionToken,
    );

  const agentId =
    "gateway-authority-agent";

  context.agentRegistry.register(
    new Agent({
      id: agentId,
      name: "Gateway Authority Test Agent",
    }),
  );

  const authorityEngine =
    new TransitiveAuthorityEngine();

  let graph =
    lowGraph(agentId);

  let approved =
    false;

  gateway.configureAuthorityAwareExecution({

    resolveWorkspaceId:
      () =>
        workspaceId(
          "workspace-a",
        ),

    contextProvider: {

      resolve: (
        runtimeRequest,
      ) => {

        const authority =
          authorityEngine.analyze({
            workspaceId:
              "workspace-a",

            sourceAgentId:
              runtimeRequest.agentId,

            graph,
          });

        return {
          resource:
            "provider:openai",

          transitiveAuthority:
            authority,

          authorityDriftSeverity:
            "NONE",

          ...(approved
            ? {
                approval: {
                  status:
                    "approved" as const,

                  executionId:
                    runtimeRequest.requestId,

                  approvalId:
                    "4.0-12C-test-approval",
                },
              }
            : {}),
        };
      },
    },
  });

  return {
    context,
    provider,
    gateway,
    agentId,

    setGraph(
      nextGraph: CompromiseSimulationGraph,
    ) {
      graph = nextGraph;
    },

    setApproved(
      value: boolean,
    ) {
      approved = value;
    },
  };
}


describe(
  "4.0-12C real provider authority boundary",
  () => {

    it(
      "allows normal authority and invokes provider exactly once",
      async () => {

        const fixture =
          createFixture();

        fixture.setGraph(
          lowGraph(
            fixture.agentId,
          ),
        );

        const response =
          await fixture.gateway.generate({
            agentId:
              fixture.agentId,

            provider:
              "openai",

            request: {
              prompt:
                "authority-safe",
            },
          });

        assert.equal(
          response.output,
          "TEST:authority-safe",
        );

        assert.equal(
          fixture.provider.calls,
          1,
        );
      },
    );


    it(
      "escalates high transitive authority without approval and never invokes provider",
      async () => {

        const fixture =
          createFixture();

        fixture.setGraph(
          highGraph(
            fixture.agentId,
          ),
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
                  "authority-high",
              },
            }),
          /AUTHORITY:ESCALATE/,
        );

        assert.equal(
          fixture.provider.calls,
          0,
        );
      },
    );


    it(
      "allows high transitive authority only after matching runtime approval",
      async () => {

        const fixture =
          createFixture();

        fixture.setGraph(
          highGraph(
            fixture.agentId,
          ),
        );

        fixture.setApproved(
          true,
        );

        const response =
          await fixture.gateway.generate({
            agentId:
              fixture.agentId,

            provider:
              "openai",

            request: {
              prompt:
                "authority-approved",
            },
          });

        assert.equal(
          response.output,
          "TEST:authority-approved",
        );

        assert.equal(
          fixture.provider.calls,
          1,
        );
      },
    );


    it(
      "blocks critical transitive authority before provider invocation",
      async () => {

        const fixture =
          createFixture();

        fixture.setGraph(
          criticalGraph(
            fixture.agentId,
          ),
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
                  "authority-critical",
              },
            }),
          /AUTHORITY:BLOCK/,
        );

        assert.equal(
          fixture.provider.calls,
          0,
        );
      },
    );


    it(
      "preserves provider isolation across blocked and allowed executions",
      async () => {

        const fixture =
          createFixture();

        fixture.setGraph(
          criticalGraph(
            fixture.agentId,
          ),
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
                  "must-not-run",
              },
            }),
          /AUTHORITY:BLOCK/,
        );

        assert.equal(
          fixture.provider.calls,
          0,
        );

        fixture.setGraph(
          lowGraph(
            fixture.agentId,
          ),
        );

        const response =
          await fixture.gateway.generate({
            agentId:
              fixture.agentId,

            provider:
              "openai",

            request: {
              prompt:
                "must-run",
            },
          });

        assert.equal(
          response.output,
          "TEST:must-run",
        );

        assert.equal(
          fixture.provider.calls,
          1,
        );
      },
    );

  },
);