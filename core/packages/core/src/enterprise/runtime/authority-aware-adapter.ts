import {
  AuthorityAwareExecutionControlEngine,
} from "../authority-aware-execution-control";

import type {
  RuntimeDecisionAdapter,
} from "./adapter";

import type {
  RuntimeExecutionRequest,
} from "./types";

type AuthorityAwareExecutionInput =
  Parameters<
    AuthorityAwareExecutionControlEngine["decide"]
  >[0];

export type AuthorityAwareRuntimeContext =
  Omit<
    AuthorityAwareExecutionInput,
    | "workspaceId"
    | "agentId"
    | "executionId"
    | "action"
  >;

export interface AuthorityAwareRuntimeContextProvider {

  resolve(
    request: RuntimeExecutionRequest,
  ): AuthorityAwareRuntimeContext;
}

export interface RuntimeExecutionIdResolver {

  resolve(
    request: RuntimeExecutionRequest,
  ): string;
}

export class AuthorityAwareRuntimeDecisionAdapter
  implements RuntimeDecisionAdapter {

  constructor(
    private readonly contextProvider:
      AuthorityAwareRuntimeContextProvider,

    private readonly control:
      AuthorityAwareExecutionControlEngine =
        new AuthorityAwareExecutionControlEngine(),

    private readonly executionIdResolver:
      RuntimeExecutionIdResolver = {
        resolve:
          (request) =>
            request.requestId,
      },
  ) {}

  authorize(
    request: RuntimeExecutionRequest,
  ) {

    const context =
      this.contextProvider.resolve(
        request,
      );

    const executionId =
      this.executionIdResolver.resolve(
        request,
      );

    if (
      typeof executionId !== "string" ||
      executionId.trim().length === 0
    ) {
      return {
        allowed: false as const,
        decision: "BLOCK" as const,
        reason:
          "Execution identity is required before authority evaluation.",
      };
    }

    const decision =
      this.control.decide({
        ...context,

        workspaceId:
          request.workspaceId,

        agentId:
          request.agentId,

        executionId,

        action:
          request.action,
      });

    if (
      decision.decision === "ALLOW"
    ) {
      return {
        allowed: true as const,
        decision: "ALLOW" as const,
      };
    }

    return {
      allowed: false as const,
      decision:
        decision.decision,
      reason:
        decision.reason,
    };
  }
}
