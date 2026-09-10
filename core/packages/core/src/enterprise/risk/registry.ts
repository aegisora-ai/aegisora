import type {
  WorkspaceId,
} from "../access";

import type {
  RiskAssessment,
  RiskAssessmentId,
  RiskRequest,
} from "./types";

import type {
  RiskEngine,
} from "./types";

export class RiskAssessmentRegistry {

  private readonly assessments =
    new Map<string, RiskAssessment>();

  constructor(
    private readonly engine:
      RiskEngine,
  ) {}

  assess(
    request: RiskRequest,
  ): RiskAssessment {

    const result =
      this.engine.assess(
        request,
      );

    this.assessments.set(
      `${result.workspaceId}:${result.id}`,
      result,
    );

    return result;
  }

  get(
    workspaceId: WorkspaceId,
    id: RiskAssessmentId,
  ): RiskAssessment | null {

    return this.assessments.get(
      `${workspaceId}:${id}`,
    ) ?? null;
  }

  list(
    workspaceId: WorkspaceId,
  ): readonly RiskAssessment[] {

    return [
      ...this.assessments.values(),
    ].filter(
      (item) =>
        item.workspaceId ===
        workspaceId,
    );
  }
}
