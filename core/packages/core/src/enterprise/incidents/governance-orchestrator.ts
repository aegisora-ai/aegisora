import {
  EnterpriseAlertEngine,
  type EnterpriseAlertEvent,
  type EnterpriseAlertMatch,
} from "../alerts";

import {
  EnterpriseIncidentLedger,
  type EnterpriseIncident,
} from "../incidents";

import {
  EnterpriseWebhookGovernance,
  type EnterpriseWebhookEventType,
} from "../webhooks";

import {
  EnterpriseRealtimeBus,
  type EnterpriseRealtimeEvent,
} from "../realtime";

import {
  EnterpriseAuditLedger,
  type CreateEnterpriseAuditInput,
} from "../audit";

export type EnterpriseGovernanceOrchestratorInput =
  Readonly<{
    event: EnterpriseAlertEvent;

    incidentTitle?: string;
    incidentReason?: string;

    webhookId?: string;
    deliveryId?: string;
    idempotencyKey?: string;
    webhookEventType?: EnterpriseWebhookEventType;
    webhookMetadata?: Readonly<Record<string, unknown>>;
  }>;

export type EnterpriseGovernanceOrchestratorResult =
  Readonly<{
    matches: readonly EnterpriseAlertMatch[];
    incidents: readonly EnterpriseIncident[];
    webhookDeliveryId?: string;
    auditIds: readonly string[];
    realtimeEventTypes: readonly string[];
  }>;

function assertCorrelation(
  event: EnterpriseAlertEvent,
): void {
  if (!event.workspaceId.trim()) {
    throw new Error(
      "[ENFORCEMENT:BLOCK] Governance event requires workspace identity.",
    );
  }

  if (!event.traceId?.trim()) {
    throw new Error(
      "[ENFORCEMENT:BLOCK] Governance event requires traceId.",
    );
  }

  if (!event.decisionId?.trim()) {
    throw new Error(
      "[ENFORCEMENT:BLOCK] Governance event requires decisionId.",
    );
  }

  if (!event.executionId?.trim()) {
    throw new Error(
      "[ENFORCEMENT:BLOCK] Governance event requires executionId.",
    );
  }

  if (!event.evidenceId?.trim()) {
    throw new Error(
      "[ENFORCEMENT:BLOCK] Governance event requires evidenceId.",
    );
  }

  if (
    event.riskScore !== undefined &&
    (
      !Number.isInteger(event.riskScore) ||
      event.riskScore < 0 ||
      event.riskScore > 100
    )
  ) {
    throw new Error(
      "[ENFORCEMENT:BLOCK] Governance event riskScore is invalid.",
    );
  }
}

function buildIncidentId(
  match: EnterpriseAlertMatch,
): string {
  return [
    "incident",
    match.ruleId,
    match.workspaceId,
    match.traceId,
    match.decisionId,
    match.executionId,
  ].join(":");
}

function buildAuditId(
  traceId: string,
  incidentId: string,
): string {
  return [
    "incident-audit",
    traceId,
    incidentId,
  ].join(":");
}

function freezeMetadata(
  metadata: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ...metadata,
  });
}

export class EnterpriseGovernanceOrchestrator {
  constructor(
    private readonly alerts: EnterpriseAlertEngine,
    private readonly incidents: EnterpriseIncidentLedger,
    private readonly webhooks: EnterpriseWebhookGovernance,
    private readonly realtime: EnterpriseRealtimeBus,
    private readonly audit: EnterpriseAuditLedger,
  ) {}

  async process(
    input: EnterpriseGovernanceOrchestratorInput,
  ): Promise<EnterpriseGovernanceOrchestratorResult> {
    assertCorrelation(input.event);

    const matches =
      this.alerts.evaluate(input.event);

    const createdIncidents: EnterpriseIncident[] = [];
    const auditIds: string[] = [];
    const realtimeEventTypes: string[] = [];

    let webhookDeliveryId: string | undefined;

    for (const match of matches) {
      const traceId = match.traceId;
      const decisionId = match.decisionId;
      const executionId = match.executionId;
      const evidenceId = match.evidenceId;
      const agentId = match.agentId;

      if (
        !traceId ||
        !decisionId ||
        !executionId ||
        !evidenceId ||
        !agentId
      ) {
        throw new Error(
          "[ENFORCEMENT:BLOCK] Alert match is missing canonical correlation identity.",
        );
      }

      const incidentId =
        buildIncidentId(match);

      const incidentAuditId =
        buildAuditId(
          traceId,
          incidentId,
        );

      const decision =
        input.event.decision ??
        "ESCALATE";

      const riskScore =
        input.event.riskScore ??
        0;

      const incident =
        this.incidents.create({
          incidentId,
          workspaceId:
            match.workspaceId,

          severity:
            match.severity,


          source:
            "decision",

          title:
            input.incidentTitle ??
            `Governance alert: ${match.ruleId}`,

          reason:
            input.incidentReason ??
            match.reason,

          traceId,
          decisionId,
          executionId,
          evidenceId,

          auditId:
            incidentAuditId,

          agentId,

          metadata:
            freezeMetadata({
              alertRuleId:
                match.ruleId,

              decision,
              riskScore,
            }),
        });

      createdIncidents.push(
        incident,
      );

      const auditInput:
        CreateEnterpriseAuditInput = {
          auditId:
            incidentAuditId,

          workspaceId:
            match.workspaceId,

          traceId,
          decisionId,
          executionId,
          evidenceId,

          agentId,

          action:
            "incident.create",

          resourceType:
            "incident",

          resource:
            incident.incidentId,

          decision,

          riskScore,

          enforcementStatus:
            "prevented",

          eventType:
            "incident",

          reason:
            match.reason,

          createdAt:
            new Date().toISOString(),

          metadata:
            freezeMetadata({
              incidentId:
                incident.incidentId,

              alertRuleId:
                match.ruleId,
            }),
        };

      const auditRecord =
        this.audit.create(
          auditInput,
        );

      auditIds.push(
        auditRecord.auditId,
      );

      const realtimeEvent:
        EnterpriseRealtimeEvent = {
          id:
            [
              "realtime",
              incident.incidentId,
            ].join(":"),

          workspaceId:
            incident.workspaceId,

          type:
            "incident.created",

          traceId,
          decisionId,
          executionId,
          evidenceId,

          agentId,

          action:
            "incident.create",

          decision,
          riskScore,

          timestamp:
            new Date(),

          metadata:
            freezeMetadata({
              incidentId:
                incident.incidentId,

              alertRuleId:
                match.ruleId,

              auditId:
                auditRecord.auditId,
            }),
        };

      await this.realtime.publish(
        realtimeEvent,
      );

      realtimeEventTypes.push(
        realtimeEvent.type,
      );

      if (
        input.webhookId &&
        input.deliveryId &&
        input.idempotencyKey &&
        input.webhookEventType
      ) {
        const delivery =
          this.webhooks.createDelivery({
            deliveryId:
              input.deliveryId,

            webhookId:
              input.webhookId,

            workspaceId:
              match.workspaceId,

            eventType:
              input.webhookEventType,

            idempotencyKey:
              input.idempotencyKey,

            metadata:
              input.webhookMetadata,
          });

        webhookDeliveryId =
          delivery.deliveryId;
      }
    }

    return Object.freeze({
      matches:
        Object.freeze([
          ...matches,
        ]),

      incidents:
        Object.freeze([
          ...createdIncidents,
        ]),

      ...(webhookDeliveryId !== undefined
        ? {
            webhookDeliveryId,
          }
        : {}),

      auditIds:
        Object.freeze([
          ...auditIds,
        ]),

      realtimeEventTypes:
        Object.freeze([
          ...realtimeEventTypes,
        ]),
    });
  }
}
