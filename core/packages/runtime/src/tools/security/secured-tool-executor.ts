import type {
  ToolSecurityContext,
  ToolSecurityPolicy,
  ToolSecurityResult,
} from "./types";

import {
  ToolSecurityEvaluator,
} from "./evaluator";

export type SecuredToolExecutor<TInput = unknown, TOutput = unknown> =
  Readonly<{
    evaluate(
      context: ToolSecurityContext,
      policy: ToolSecurityPolicy,
    ): ToolSecurityResult;

    execute(
      context: ToolSecurityContext,
      policy: ToolSecurityPolicy,
      tool: Readonly<{
        id: string;
        execute(input: TInput): Promise<TOutput>;
      }>,
      input: TInput,
    ): Promise<TOutput>;
  }>;

export class CanonicalSecuredToolExecutor<
  TInput = unknown,
  TOutput = unknown,
> {
  private readonly evaluator =
    new ToolSecurityEvaluator();

  evaluate(
    context: ToolSecurityContext,
    policy: ToolSecurityPolicy,
  ): ToolSecurityResult {
    return this.evaluator.evaluate(
      context,
      policy,
    );
  }

  async execute(
    context: ToolSecurityContext,
    policy: ToolSecurityPolicy,
    tool: Readonly<{
      id: string;
      execute(input: TInput): Promise<TOutput>;
    }>,
    input: TInput,
  ): Promise<TOutput> {
    const result =
      this.evaluator.evaluate(
        context,
        policy,
      );

    if (result.decision !== "ALLOW") {
      throw new Error(
        `Tool execution ${result.decision}: ${result.reason}`,
      );
    }

    if (!result.allowed) {
      throw new Error(
        `Tool execution BLOCK: ${result.reason}`,
      );
    }

    if (tool.id !== context.toolId) {
      throw new Error(
        "Tool execution BLOCK: tool identity mismatch.",
      );
    }

    return tool.execute(input);
  }
}
