import type {
  ToolSecurityContext,
  ToolSecurityPolicy,
  ToolSecurityResult,
} from "./types";

import {
  evaluateToolSecurity,
} from "./types";

export class ToolSecurityEvaluator {
  evaluate(
    context: ToolSecurityContext,
    policy: ToolSecurityPolicy,
  ): ToolSecurityResult {
    return evaluateToolSecurity(
      context,
      policy,
    );
  }
}
