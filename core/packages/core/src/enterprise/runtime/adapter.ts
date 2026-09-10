import type {
  RuntimeControlBridge,
  RuntimeExecutionRequest,
} from "./types";

export interface RuntimeDecisionAdapter {

  authorize(
    request: RuntimeExecutionRequest,
  ):
    | {
        allowed: true;
        decision: "ALLOW";
      }
    | {
        allowed: false;
        decision:
          | "BLOCK"
          | "ESCALATE";
        reason: string;
      };
}

export class ControlPlaneRuntimeDecisionAdapter
  implements RuntimeDecisionAdapter {

  constructor(
    private readonly bridge:
      RuntimeControlBridge,
  ) {}

  authorize(
    request: RuntimeExecutionRequest,
  ) {

    const result =
      this.bridge.evaluate(
        request,
      );

    if (
      result.decision === "BLOCK"
    ) {

      return {
        allowed: false as const,
        decision: "BLOCK" as const,
        reason:
          "Enterprise control plane denied execution.",
      };
    }

    if (
      result.decision === "ESCALATE"
    ) {

      return {
        allowed: false as const,
        decision: "ESCALATE" as const,
        reason:
          "Enterprise control plane requires approval.",
      };
    }

    return {
      allowed: true as const,
      decision: "ALLOW" as const,
    };
  }
}
