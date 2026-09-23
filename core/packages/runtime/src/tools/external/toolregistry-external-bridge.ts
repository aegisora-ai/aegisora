import type {
  ToolRegistry,
} from "../tool-registry";

import type {
  ToolContext,
  RuntimeTool,
} from "../tool";

import type {
  ExternalToolAdapter,
  ExternalToolDescriptor,
  ExternalToolExecutionResult,
  ExternalToolRequest,
} from "./types";

import {
  assertExternalToolDescriptor,
  assertExternalToolRequest,
} from "./types";

export class ToolRegistryExternalBridge {

  constructor(
    private readonly registry: ToolRegistry,
    private readonly executionToken: symbol,
  ) {}

  register(
    descriptor: ExternalToolDescriptor,
    adapter: ExternalToolAdapter,
  ): RuntimeTool {
    assertExternalToolDescriptor(
      descriptor,
    );

    if (
      adapter.transport !==
      descriptor.transport
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External adapter transport does not match tool descriptor.",
      );
    }

    const runtimeTool: RuntimeTool = {
      name:
        descriptor.id,

      description:
        descriptor.name,

      execute:
        async (
          input: unknown,
          context: ToolContext,
        ): Promise<unknown> => {

          const request =
            context.metadata
              ?.externalToolRequest as
              | ExternalToolRequest
              | undefined;

          if (!request) {
            throw new Error(
              "[ENFORCEMENT:BLOCK] External tool request context is missing.",
            );
          }

          assertExternalToolRequest(
            request,
          );

          if (
            request.toolId !==
            descriptor.id
          ) {
            throw new Error(
              "[ENFORCEMENT:BLOCK] External tool identity mismatch.",
            );
          }

          if (
            request.workspaceId !==
            descriptor.workspaceId
          ) {
            throw new Error(
              "[ENFORCEMENT:BLOCK] External tool workspace mismatch.",
            );
          }

          if (
            request.agentId !==
            context.agentId
          ) {
            throw new Error(
              "[ENFORCEMENT:BLOCK] External tool agent identity mismatch.",
            );
          }

          const result =
            await adapter.execute(
              descriptor,
              {
                ...request,
                input,
              },
            );

          this.assertResult(
            descriptor,
            request,
            result,
          );

          return result.output;
        },
    };

    this.registry.register(
      runtimeTool,
    );

    return runtimeTool;
  }

  async execute(
    descriptor: ExternalToolDescriptor,
    request: ExternalToolRequest,
    adapter: ExternalToolAdapter,
  ): Promise<unknown> {
    assertExternalToolDescriptor(
      descriptor,
    );

    assertExternalToolRequest(
      request,
    );

    if (
      descriptor.id !==
      request.toolId
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External tool identity mismatch.",
      );
    }

    if (
      descriptor.workspaceId !==
      request.workspaceId
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External tool workspace mismatch.",
      );
    }

    if (
      descriptor.transport !==
      request.transport
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External tool transport mismatch.",
      );
    }

    if (
      adapter.transport !==
      request.transport
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External adapter transport mismatch.",
      );
    }

    if (!this.registry.has(descriptor.id)) {
      throw new Error(
        `[ENFORCEMENT:BLOCK] Unknown or unregistered external tool: ${descriptor.id}`,
      );
    }

    const context = {
      agentId:
        request.agentId,

      traceId:
        request.traceId,

      decisionId:
        request.decisionId,

      executionId:
        request.executionId,

      evidenceId:
        request.evidenceId,

      metadata: {
        ...(request.metadata ?? {}),
        externalToolRequest:
          request,
      },
    };

    const receipt =
      await this.registry.authorize(
        request.agentId,
        descriptor.id,
        request.input,
        context.metadata,
      );

    const result =
      await this.registry.execute(
        descriptor.id,
        request.input,
        context,
        this.executionToken,
        receipt,
      );

    return result;
  }

  private assertResult(
    descriptor: ExternalToolDescriptor,
    request: ExternalToolRequest,
    result: ExternalToolExecutionResult,
  ): void {
    if (
      result.toolId !==
      descriptor.id
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External adapter returned mismatched tool identity.",
      );
    }

    if (
      result.workspaceId !==
      request.workspaceId
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External adapter returned mismatched workspace.",
      );
    }

    if (
      result.agentId !==
      request.agentId
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External adapter returned mismatched agent identity.",
      );
    }

    if (
      result.transport !==
      request.transport
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External adapter returned mismatched transport.",
      );
    }

    if (
      result.traceId !== request.traceId ||
      result.decisionId !== request.decisionId ||
      result.executionId !== request.executionId ||
      result.evidenceId !== request.evidenceId
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] External adapter returned mismatched execution correlation.",
      );
    }
  }
}
