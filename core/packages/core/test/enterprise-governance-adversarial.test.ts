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

function createFixture(
  realtimePublish:
    (event: unknown) => Promise<void> = async () => {},
) {
  const alerts =
    new EnterpriseAlertEngine();

  alerts.createRule({
    ruleId:
      "15e-critical-block",

    workspaceId:
      "workspace-a",

    name:
      "15E critical blocked decision",

    description:
      "Adversarial governance validation rule.",

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
      "15e-webhook",

    workspaceId:
      "workspace-a",

    name:
      "15E webhook",

    url:
      "https://example.invalid/15e",

    secretFingerprint:
      "sha256:15e",

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
        realtimeEvents.push(event);
        await realtimePublish(event);
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
      "trace-15e",

    decisionId:
      "decision-15e",

    executionId:
      "execution-15e",

    evidenceId:
      "evidence-15e",

    agentId:
      "agent-15e",

    ...overrides,
  };
}

test(
  "15E-01 - empty workspace is blocked",
  async () => {
    const fixture =
      createFixture();

    await assert.rejects(
      fixture.orchestrator.process({
        event:
          makeEvent({
            workspaceId:
              "",
          }),
      }),
      /\[ENFORCEMENT:BLOCK\].*workspace/i,
    );
  },
);

test(
  "15E-02 - missing canonical correlation fields are blocked",
  async () => {
    const fields = [
      "traceId",
      "decisionId",
      "executionId",
      "evidenceId",
    ];

    for (const field of fields) {
      const fixture =
        createFixture();

      await assert.rejects(
        fixture.orchestrator.process({
          event:
            makeEvent({
              [field]:
                "",
            }),
        }),
        new RegExp(
          `\\[ENFORCEMENT:BLOCK\\].*${field}`,
          "i",
        ),
      );
    }
  },
);

test(
  "15E-03 - invalid risk scores are blocked",
  async () => {
    const values = [
      -1,
      101,
      1.5,
    ];

    for (const riskScore of values) {
      const fixture =
        createFixture();

      await assert.rejects(
        fixture.orchestrator.process({
          event:
            makeEvent({
              riskScore,
            }),
        }),
        /\[ENFORCEMENT:BLOCK\].*riskScore/i,
      );
    }
  },
);

test(
  "15E-04 - cross-workspace event cannot trigger workspace-a governance",
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

    assert.equal(
      fixture.realtimeEvents.length,
      0,
    );
  },
);

test(
  "15E-05 - ALLOW cannot satisfy BLOCK alert rule",
  async () => {
    const fixture =
      createFixture();

    const result =
      await fixture.orchestrator.process({
        event:
          makeEvent({
            decision:
              "ALLOW" as const,
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
      fixture.audit.list().length,
      0,
    );
  },
);

test(
  "15E-06 - low risk cannot satisfy critical alert rule",
  async () => {
    const fixture =
      createFixture();

    const result =
      await fixture.orchestrator.process({
        event:
          makeEvent({
            riskScore:
              80 - 1,
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
  "15E-07 - webhook is workspace-bound",
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

    await assert.rejects(
      async () =>
        fixture.webhooks.createDelivery({
          deliveryId:
            "15e-cross-workspace-delivery",

          webhookId:
            "15e-webhook",

          workspaceId:
            "workspace-b",

          eventType:
            "incident.created",

          idempotencyKey:
            "15e-cross-workspace-key",
        }),
    );
  },
);

test(
  "15E-08 - duplicate webhook idempotency returns the original delivery",
  async () => {
    const fixture =
      createFixture();

    const first =
      await fixture.orchestrator.process({
        event:
          makeEvent(),

        webhookEventType:
          "incident.created",

        webhookId:
          "15e-webhook",

        deliveryId:
          "15e-delivery-a",

        idempotencyKey:
          "15e-idempotency-shared",
      });

    assert.equal(
      first.webhookDeliveryId,
      "15e-delivery-a",
    );

    const firstDelivery =
      fixture.webhooks
        .getDeliveryForWorkspace(
          "workspace-a",
          "15e-delivery-a",
        );

    assert.ok(firstDelivery);

    const second =
      await fixture.orchestrator.process({
        event:
          makeEvent({
            traceId:
              "trace-15e-duplicate",
            decisionId:
              "decision-15e-duplicate",
            executionId:
              "execution-15e-duplicate",
            evidenceId:
              "evidence-15e-duplicate",
          }),

        webhookEventType:
          "incident.created",

        webhookId:
          "15e-webhook",

        deliveryId:
          "15e-delivery-b",

        idempotencyKey:
          "15e-idempotency-shared",
      });

    assert.equal(
      second.webhookDeliveryId,
      "15e-delivery-a",
    );

    const preservedDelivery =
      fixture.webhooks
        .getDeliveryForWorkspace(
          "workspace-a",
          "15e-delivery-a",
        );

    assert.ok(preservedDelivery);

    assert.equal(
      preservedDelivery.deliveryId,
      firstDelivery.deliveryId,
    );

    assert.equal(
      preservedDelivery.idempotencyKey,
      "15e-idempotency-shared",
    );

    const newDelivery =
      fixture.webhooks
        .getDeliveryForWorkspace(
          "workspace-a",
          "15e-delivery-b",
        );

    assert.equal(
      newDelivery,
      undefined,
    );
  },
);

test(
  "15E-09 - realtime persistence failure is propagated",
  async () => {
    const fixture =
      createFixture(
        async () => {
          throw new Error(
            "realtime persistence unavailable",
          );
        },
      );

    await assert.rejects(
      fixture.orchestrator.process({
        event:
          makeEvent(),
      }),
      /realtime persistence unavailable/i,
    );
  },
);

test(
  "15E-10 - realtime failure cannot suppress audit creation",
  async () => {
    const fixture =
      createFixture(
        async () => {
          throw new Error(
            "realtime unavailable",
          );
        },
      );

    await assert.rejects(
      fixture.orchestrator.process({
        event:
          makeEvent(),
      }),
      /realtime unavailable/i,
    );

    assert.equal(
      fixture.incidents
        .listForWorkspace(
          "workspace-a",
        ).length,
      1,
    );

    assert.equal(
      fixture.audit
        .listForWorkspace(
          "workspace-a",
        ).length,
      1,
    );
  },
);

test(
  "15E-11 - duplicate incident identity cannot silently create a second incident",
  async () => {
    const fixture =
      createFixture();

    await fixture.orchestrator.process({
      event:
        makeEvent(),
    });

    await assert.rejects(
      fixture.orchestrator.process({
        event:
          makeEvent(),
      }),
    );

    assert.equal(
      fixture.incidents
        .listForWorkspace(
          "workspace-a",
        ).length,
      1,
    );

    assert.equal(
      fixture.audit
        .listForWorkspace(
          "workspace-a",
        ).length,
      1,
    );
  },
);

test(
  "15E-12 - correlation identity survives full adversarial chain",
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
          "15e-webhook",

        deliveryId:
          "15e-final-delivery",

        idempotencyKey:
          "15e-final-idempotency",
      });

    const incident =
      result.incidents[0];

    const audit =
      fixture.audit
        .listForWorkspace(
          "workspace-a",
        )[0];

    const realtime =
      fixture.realtimeEvents[0] as {
        workspaceId: string;
        traceId: string;
        decisionId: string;
        executionId: string;
        evidenceId: string;
      };

    assert.equal(
      incident?.workspaceId,
      "workspace-a",
    );

    assert.equal(
      incident?.traceId,
      "trace-15e",
    );

    assert.equal(
      incident?.decisionId,
      "decision-15e",
    );

    assert.equal(
      audit?.traceId,
      incident?.traceId,
    );

    assert.equal(
      audit?.decisionId,
      incident?.decisionId,
    );

    assert.equal(
      realtime.workspaceId,
      "workspace-a",
    );

    assert.equal(
      realtime.traceId,
      incident?.traceId,
    );

    assert.equal(
      realtime.decisionId,
      incident?.decisionId,
    );

    assert.equal(
      realtime.executionId,
      incident?.executionId,
    );

    assert.equal(
      realtime.evidenceId,
      incident?.evidenceId,
    );
  },
);

console.log(
  "15E adversarial governance tests loaded.",
);
