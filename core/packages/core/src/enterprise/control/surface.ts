import type {
  RiskEngine,
} from "../risk";

import {
  ControlPolicyResolver,
} from "./policy-resolver";

import {
  resolveControlDecision,
} from "./decision";

import type {
  ControlDecision,
  ControlRequest,
  ControlSurface,
} from "./types";

function decisionId(
  requestId: string,
): string {

  return `decision:${requestId}:${Date.now()}`;
}

export class EnterpriseControlSurface
  implements ControlSurface {

  constructor(
    private readonly risk:
      RiskEngine,
    private readonly policy:
      ControlPolicyResolver,
  ) {}

  evaluate(
    request: ControlRequest,
  ): ControlDecision {

    const assessment =
      this.risk.assess({
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
      });

    const policy =
      this.policy.resolve(
        request,
      );

    const resolved =
      resolveControlDecision(
        assessment,
        policy,
      );

    return {
      requestId:
        request.requestId,

      workspaceId:
        request.workspaceId,

      agentId:
        request.agentId,

      decision:
        resolved.decision,

      reason:
        resolved.reason,

      risk:
        {
          ...assessment,
          id: assessment.id,
        },

      policy,

      decidedAt:
        new Date().toISOString(),
    };
  }
}
