import assert from "node:assert/strict";

import {
  ProviderExecutionGateway,
} from "../src/providers/provider-execution-gateway";

import {
  ProviderRouter,
} from "../src/providers/provider-router";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

import {
  BaseProvider,
} from "../src/providers/base-provider";

import type {
  ProviderRequest,
  ProviderResponse,
} from "../src/providers/base-provider";

class SpyProvider extends BaseProvider {
  public readonly name = "openai";

  public calls = 0;

  public lastRequest?: ProviderRequest;

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {
    this.calls++;
    this.lastRequest = request;

    return this.buildResponse(
      "openai",
      request.model ?? "external-decision-test-model",
      `EXTERNAL-DECISION-EXECUTED:${request.prompt}`,
    );
  }
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log(" AEGISORA EXTERNAL DECISION BINDING PROBE");
  console.log("============================================================");

  const context = new RuntimeContext();

  const executionToken =
    Symbol("aegisora.external-decision-binding-test");

  const router =
    new ProviderRouter(executionToken);

  const spy =
    new SpyProvider();

  router.register("openai", spy);

  const gateway =
    new ProviderExecutionGateway(
      context,
      router,
      undefined,
      undefined,
      executionToken,
    );

  const agentId =
    "invinoveritas-aegisora-test-vector";

  context.agentRegistry.register({
    id: agentId,
    name: "External Decision Test Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("");
  console.log("[CASE A] Exact execution context");
  console.log("--------------------------------");

  let caseA: "EXECUTED" | "BLOCKED" = "BLOCKED";

  try {
    const response =
      await gateway.generate({
        agentId,
        provider: "openai",
        request: {
          prompt:
            "send_email to ops@ routine report",
        },
        metadata: {
          externalDecision: {
            source: "invinoveritas",
            fixture: "A",
            decisionRef:
              "sha256:26032df096887118a2bc3558061bb9017e11afde3dcdba835c695ac5dcaa5b34",
            actionBindingToolHash:
              "sha256:26d8a787f636d022f95db63ee0f572d2590cbe0ff5b63badf9f9b23d7343371c",
            actionBindingArgsHash:
              "sha256:ff542b55ead02d397bb28b2586423662c654687a0569e5f0de90a272c272de6f",
          },
        },
      });

    caseA = "EXECUTED";

    console.log("RESULT:", response.output);
    console.log("PROVIDER CALLS:", spy.calls);
  }
  catch (error) {
    console.log(
      "BLOCKED:",
      error instanceof Error ? error.message : String(error),
    );
  }

  const callsAfterA =
    spy.calls;

  console.log("");
  console.log("[CASE B] Fixture A decision + Fixture B execution context");
  console.log("-----------------------------------------------------------");

  let caseB: "EXECUTED" | "BLOCKED" = "BLOCKED";

  try {
    const response =
      await gateway.generate({
        agentId,
        provider: "openai",
        request: {
          prompt:
            "send_email to finance@ wire-transfer confirmation",
        },
        metadata: {
          externalDecision: {
            source: "invinoveritas",
            fixture: "A",
            decisionRef:
              "sha256:26032df096887118a2bc3558061bb9017e11afde3dcdba835c695ac5dcaa5b34",
            actionBindingToolHash:
              "sha256:26d8a787f636d022f95db63ee0f572d2590cbe0ff5b63badf9f9b23d7343371c",
            actionBindingArgsHash:
              "sha256:2156cea3352ab2357d213d687a5ebf30c1dd68dd657eabe7b5fa9022197e76fd",
          },
        },
      });

    caseB = "EXECUTED";

    console.log("RESULT:", response.output);
    console.log("PROVIDER CALLS:", spy.calls);
  }
  catch (error) {
    console.log(
      "BLOCKED:",
      error instanceof Error ? error.message : String(error),
    );
  }

  const callsAfterB =
    spy.calls;

  console.log("");
  console.log("============================================================");
  console.log(" RESULTS");
  console.log("============================================================");

  console.log(
    "CASE A:",
    caseA,
  );

  console.log(
    "CASE B:",
    caseB,
  );

  console.log(
    "PROVIDER CALLS AFTER A:",
    callsAfterA,
  );

  console.log(
    "PROVIDER CALLS AFTER B:",
    callsAfterB,
  );

  console.log("");

  if (caseA === "EXECUTED") {
    console.log(
      "[INFO] Current runtime can execute the exact-path request.",
    );
  }

  if (caseB === "EXECUTED") {
    console.log(
      "[SECURITY GAP] A signed-decision-shaped metadata object",
    );
    console.log(
      "was not sufficient to prevent execution of mutated context.",
    );
    console.log(
      "The runtime is not yet enforcing external decision binding.",
    );
  }
  else {
    console.log(
      "[PASS] Mutated execution context was rejected.",
    );
  }

  console.log("");
  console.log("============================================================");
  console.log(" END PROBE");
  console.log("============================================================");
}

main().catch((error) => {
  console.error("");
  console.error("[FATAL]", error);
  process.exitCode = 1;
});
