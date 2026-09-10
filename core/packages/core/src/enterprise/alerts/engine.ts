import {
  assertEnterpriseAlertRule,
  EnterpriseAlertEvent,
  EnterpriseAlertMatch,
  EnterpriseAlertRule,
  CreateEnterpriseAlertRuleInput,
} from "./types";

export function clone(
  value?: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ...(value ?? {}),
  });
}

export class EnterpriseAlertEngine {

  private readonly rules =
    new Map<string, EnterpriseAlertRule>();

  private readonly dedupe =
    new Map<string, number>();

  createRule(
    input: CreateEnterpriseAlertRuleInput,
  ): EnterpriseAlertRule {

    if (
      this.rules.has(
        input.ruleId,
      )
    ) {
      throw new Error(
        `Enterprise alert rule already exists: ${input.ruleId}`,
      );
    }

    const now =
      new Date();

    const rule:
      EnterpriseAlertRule =
      Object.freeze({
        ruleId:
          input.ruleId,

        workspaceId:
          input.workspaceId,

        name:
          input.name,

        description:
          input.description,

        enabled:
          input.enabled ??
          true,

        source:
          input.source,

        severity:
          input.severity,

        minRiskScore:
          input.minRiskScore,

        requiredDecision:
          input.requiredDecision,

        dedupeWindowMs:
          input.dedupeWindowMs ??
          300_000,

        createdAt:
          input.createdAt
            ? new Date(
                input.createdAt.getTime(),
              )
            : now,

        updatedAt:
          now,

        metadata:
          clone(
            input.metadata,
          ),
      });

    assertEnterpriseAlertRule(
      rule,
    );

    this.rules.set(
      rule.ruleId,
      rule,
    );

    return rule;
  }

  get(
    ruleId: string,
  ): EnterpriseAlertRule | undefined {
    return this.rules.get(
      ruleId,
    );
  }

  getForWorkspace(
    workspaceId: string,
    ruleId: string,
  ): EnterpriseAlertRule | undefined {

    const rule =
      this.rules.get(ruleId);

    if (!rule) {
      return undefined;
    }

    if (
      rule.workspaceId !==
      workspaceId
    ) {
      return undefined;
    }

    return rule;
  }

  listForWorkspace(
    workspaceId: string,
  ): readonly EnterpriseAlertRule[] {

    return Object.freeze(
      Array.from(
        this.rules.values(),
      ).filter(
        (rule) =>
          rule.workspaceId ===
          workspaceId,
      ),
    );
  }

  evaluate(
    event: EnterpriseAlertEvent,
  ): readonly EnterpriseAlertMatch[] {

    const now =
      event.occurredAt?.getTime() ??
      Date.now();

    const matches:
      EnterpriseAlertMatch[] = [];

    for (
      const rule
      of this.rules.values()
    ) {

      if (!rule.enabled) {
        continue;
      }

      if (
        rule.workspaceId !==
        event.workspaceId
      ) {
        continue;
      }

      if (
        rule.source !==
        event.source
      ) {
        continue;
      }

      if (
        rule.requiredDecision !==
          undefined &&
        rule.requiredDecision !==
          event.decision
      ) {
        continue;
      }

      if (
        rule.minRiskScore !==
          undefined &&
        (
          event.riskScore ===
            undefined ||
          event.riskScore <
            rule.minRiskScore
        )
      ) {
        continue;
      }

      const key =
        [
          rule.ruleId,
          event.workspaceId,
          event.traceId ?? "",
          event.decisionId ?? "",
          event.executionId ?? "",
        ].join(":");

      const last =
        this.dedupe.get(key);

      if (
        last !== undefined &&
        now - last <
          rule.dedupeWindowMs
      ) {
        continue;
      }

      this.dedupe.set(
        key,
        now,
      );

      matches.push(
        Object.freeze({
          matched:
            true,

          ruleId:
            rule.ruleId,

          workspaceId:
            rule.workspaceId,

          severity:
            rule.severity,

          reason:
            `Alert rule matched: ${rule.name}`,

          traceId:
            event.traceId,

          decisionId:
            event.decisionId,

          executionId:
            event.executionId,

          evidenceId:
            event.evidenceId,

          auditId:
            event.auditId,

          agentId:
            event.agentId,
        }),
      );
    }

    return Object.freeze(
      matches,
    );
  }
}
