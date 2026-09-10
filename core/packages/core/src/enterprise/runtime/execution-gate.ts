import type {
  RuntimeExecutionRequest,
} from "./types";

import type {
  RuntimeDecisionAdapter,
} from "./adapter";

export interface RuntimeExecutionGate {

  check(
    request: RuntimeExecutionRequest,
  ):
    | {
        allowed: true;
      }
    | {
        allowed: false;
        decision:
          | "BLOCK"
          | "ESCALATE";
        reason: string;
      };
}

export class EnterpriseRuntimeExecutionGate
  implements RuntimeExecutionGate {

  constructor(
    private readonly adapter:
      RuntimeDecisionAdapter,
  ) {}

  check(
    request: RuntimeExecutionRequest,
  ) {

    return this.adapter.authorize(
      request,
    );
  }
}
