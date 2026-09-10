import type {
  WorkspaceId,
} from "../access";

import type {
  ControlDecision,
  ControlRequest,
} from "../control";

export interface RuntimeExecutionRequest {

  readonly workspaceId: WorkspaceId;

  readonly requestId: string;

  readonly agentId: string;

  readonly action: string;

  readonly payload?: unknown;

  readonly environment?:
    | "production"
    | "staging"
    | "development"
    | "restricted";

  readonly declaredTool?: boolean;

  readonly historyRiskScore?: number;
}

export interface RuntimeControlDecision {

  readonly requestId: string;

  readonly workspaceId: WorkspaceId;

  readonly agentId: string;

  readonly action: string;

  readonly decision:
    | "ALLOW"
    | "BLOCK"
    | "ESCALATE";

  readonly control:
    ControlDecision;
}

export interface RuntimeControlBridge {

  evaluate(
    request: RuntimeExecutionRequest,
  ): RuntimeControlDecision;
}
