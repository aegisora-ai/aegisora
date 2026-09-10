import type {
  ControlSurface,
} from "../control";

import type {
  RuntimeControlBridge,
  RuntimeControlDecision,
  RuntimeExecutionRequest,
} from "./types";

export class EnterpriseRuntimeControlBridge
  implements RuntimeControlBridge {

  constructor(
    private readonly control:
      ControlSurface,
  ) {}

  evaluate(
    request: RuntimeExecutionRequest,
  ): RuntimeControlDecision {

    const controlRequest = {
      requestId:
        request.requestId,

      workspaceId:
        request.workspaceId,

      agentId:
        request.agentId,

      action:
        request.action,

      payload:
        request.payload,

      environment:
        request.environment,

      declaredTool:
        request.declaredTool,

      historyRiskScore:
        request.historyRiskScore,
    };

    const decision =
      this.control.evaluate(
        controlRequest,
      );

    return {
      requestId:
        request.requestId,

      workspaceId:
        request.workspaceId,

      agentId:
        request.agentId,

      action:
        request.action,

      decision:
        decision.decision,

      control:
        decision,
    };
  }
}
