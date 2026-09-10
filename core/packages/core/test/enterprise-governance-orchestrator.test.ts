import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseAlertEngine,
} from "../src/enterprise/alerts";

import {
  EnterpriseIncidentLedger,
  EnterpriseGovernanceOrchestrator,
} from "../src/enterprise/incidents";

import {
  EnterpriseWebhookGovernance,
} from "../src/enterprise/webhooks";

import {
  EnterpriseRealtimeBus,
} from "../src/enterprise/realtime";

import {
  EnterpriseAuditLedger,
} from "../src/enterprise/audit";

function createFixture() {
  const alerts =
    new EnterpriseAlertEngine();

  alerts.createRule({
    ruleId:
      "15d-critical-block",

    workspaceId:
      "workspace-a",

    name:
      "Critical block governance rule",

    description:
      "Create an incident for critical blocked decisions.",

    source:
      "decision",

    severity:
      "CRITICAL",

    minRiskScore:
      80,

    requiredDecision:
      "BLOCK",

    dedupeWindowMs:
      0,
  });

  const incidents =
    new EnterpriseIncidentLedger();

  const webhooks =
    new EnterpriseWebhookGovernance();

  webhooks.register({
    webhookId:
      "15d-webhook",

    workspaceId:
      "workspace-a",

    name:
      "15D Incident Webhook",

    url:
      "https://example.invalid/incident",

    secretFingerprint:
      "sha256:15d",

    eventTypes:
      [
        "incident.created",
      ],

    maxAttempts:
      3,
  });

  const realtimeEvents:
    unknown[] = [];

  const realtime =
    new EnterpriseRealtimeBus({
      async publish(event) {
        realtimeEvents.push(
          event,
        );
      },
    });

  const audit =
    new EnterpriseAuditLedger();

  const orchestrator =
    new EnterpriseGovernanceOrchestrator(
      alerts,
      incidents,
      webhooks,
      realtime,
      audit,
    );

  return {
    alerts,
    incidents,
    webhooks,
    realtime,
    realtimeEvents,
    audit,
    orchestrator,
  };
}

function makeEvent(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    workspaceId:
      "workspace-a",

    source:
      "decision" as const,

    riskScore:
      95,

    decision:
      "BLOCK" as const,

    traceId:
      "trace-15d",

    decisionId:
      "decision-15d",

    executionId:
      "execution-15d",

    evidenceId:
      "evidence-15d",

    agentId:
      "agent-15d",

    ...overrides,
  };
}

test(
  "15D - alert -> incident -> audit -> realtime -> webhook",
  async () => {
    const fixture =
      createFixture();

    const result =
      await fixture.orchestrator.process({
        event:
          makeEvent(),

        webhookEventType:
          "incident.created",

        webhookId:
          "15d-webhook",

        deliveryId:
          "15d-delivery",

        idempotencyKey:
          "15d-idempotency",
      });

    assert.equal(
      result.matches.length,
      1,
    );

    assert.equal(
      result.incidents.length,
      1,
    );

    assert.equal(
      result.auditIds.length,
      1,
    );

    assert.deepEqual(
      result.realtimeEventTypes,
      [
        "incident.created",
      ],
    );

    assert.equal(
      result.webhookDeliveryId,
      "15d-delivery",
    );

    assert.equal(
      fixture.incidents
        .listForWorkspace("workspace-a")
        .length,
      1,
    );

    assert.equal(
      fixture.audit
        .listForWorkspace("workspace-a")
        .length,
      1,
    );

    assert.equal(
      fixture.realtimeEvents.length,
      1,
    );

    assert.ok(
      fixture.webhooks
        .getDeliveryForWorkspace(
          "workspace-a",
          "15d-delivery",
        ),
    );
  },
);

test(
  "15D - audit and incident share canonical correlation identity",
  async () => {
    const fixture =
      createFixture();

    await fixture.orchestrator.process({
      event:
        makeEvent(),
    });

    const incident =
      fixture.incidents
        .listForWorkspace(
          "workspace-a",
        )[0];

    const audit =
      fixture.audit
        .listForWorkspace(
          "workspace-a",
        )[0];

    assert.equal(
      incident?.traceId,
      "trace-15d",
    );

    assert.equal(
      incident?.decisionId,
      "decision-15d",
    );

    assert.equal(
      incident?.executionId,
      "execution-15d",
    );

    assert.equal(
      incident?.evidenceId,
      "evidence-15d",
    );

    assert.equal(
      incident?.auditId,
      audit?.auditId,
    );

    assert.equal(
      audit?.traceId,
      "trace-15d",
    );

    assert.equal(
      audit?.decisionId,
      "decision-15d",
    );

    assert.equal(
      audit?.executionId,
      "execution-15d",
    );

    assert.equal(
      audit?.evidenceId,
      "evidence-15d",
    );
  },
);

test(
  "15D - cross-workspace event does not create incident",
  async () => {
    const fixture =
      createFixture();

    const result =
      await fixture.orchestrator.process({
        event:
          makeEvent({
            workspaceId:
              "workspace-b",
          }),
      });

    assert.equal(
      result.matches.length,
      0,
    );

    assert.equal(
      result.incidents.length,
      0,
    );

    assert.equal(
      fixture.audit
        .listForWorkspace(
          "workspace-a",
        ).length,
      0,
    );
  },
);

test(
  "15D - below-threshold risk does not create incident",
  async () => {
    const fixture =
      createFixture();

    const result =
      await fixture.orchestrator.process({
        event:
          makeEvent({
            riskScore:
              79,
          }),
      });

    assert.equal(
      result.matches.length,
      0,
    );

    assert.equal(
      result.incidents.length,
      0,
    );
  },
);

test(
  "15D - missing evidence correlation is blocked",
  async () => {
    const fixture =
      createFixture();

    await assert.rejects(
      fixture.orchestrator.process({
        event:
          makeEvent({
            evidenceId:
              "",
          }),
      }),
      /\[ENFORCEMENT:BLOCK\].*evidenceId/i,
    );
  },
);

test(
  "15D - webhook remains optional",
  async () => {
    const fixture =
      createFixture();

    const result =
      await fixture.orchestrator.process({
        event:
          makeEvent(),
      });

    assert.equal(
      result.incidents.length,
      1,
    );

    assert.equal(
      result.webhookDeliveryId,
      undefined,
    );

    assert.equal(
      fixture.audit
        .listForWorkspace(
          "workspace-a",
        ).length,
      1,
    );

    assert.equal(
      fixture.realtimeEvents.length,
      1,
    );
  },
);

console.log(
  "15D governance orchestration tests loaded.",
);
