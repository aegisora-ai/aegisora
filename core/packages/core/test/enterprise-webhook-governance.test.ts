import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseWebhookGovernance,
  isRetryableWebhookDelivery,
  isTerminalWebhookDelivery,
} from "../src/enterprise/webhooks";

function endpoint(
  overrides: Record<string, unknown> = {},
) {
  return {
    webhookId:
      "webhook-15c",

    workspaceId:
      "workspace-a",

    name:
      "Security Webhook",

    url:
      "https://example.invalid/aegisora",

    secretFingerprint:
      "sha256:test-fingerprint",

    eventTypes:
      [
        "alert.created",
        "incident.created",
      ] as const,

    maxAttempts:
      3,

    ...overrides,
  };
}

function delivery(
  overrides: Record<string, unknown> = {},
) {
  return {
    deliveryId:
      "delivery-15c",

    webhookId:
      "webhook-15c",

    workspaceId:
      "workspace-a",

    eventType:
      "alert.created" as const,

    idempotencyKey:
      "idem-15c",

    metadata: {
      origin:
        "15c-test",
    },

    ...overrides,
  };
}

test(
  "15C - endpoint registration is workspace scoped",
  () => {
    const governance =
      new EnterpriseWebhookGovernance();

    const created =
      governance.register(
        endpoint(),
      );

    assert.equal(
      created.status,
      "ACTIVE",
    );

    assert.ok(
      governance.getForWorkspace(
        "workspace-a",
        "webhook-15c",
      ),
    );

    assert.equal(
      governance.getForWorkspace(
        "workspace-b",
        "webhook-15c",
      ),
      undefined,
    );
  },
);

test(
  "15C - subscribed event creates pending delivery",
  () => {
    const governance =
      new EnterpriseWebhookGovernance();

    governance.register(
      endpoint(),
    );

    const created =
      governance.createDelivery(
        delivery(),
      );

    assert.equal(
      created.status,
      "PENDING",
    );

    assert.equal(
      created.attemptCount,
      0,
    );
  },
);

test(
  "15C - unsubscribed event is blocked",
  () => {
    const governance =
      new EnterpriseWebhookGovernance();

    governance.register(
      endpoint(),
    );

    assert.throws(
      () =>
        governance.createDelivery(
          delivery({
            eventType:
              "incident.resolved" as never,
          }),
        ),
      /\[ENFORCEMENT:BLOCK\].*not subscribed/i,
    );
  },
);

test(
  "15C - cross-workspace delivery is blocked",
  () => {
    const governance =
      new EnterpriseWebhookGovernance();

    governance.register(
      endpoint(),
    );

    assert.throws(
      () =>
        governance.createDelivery(
          delivery({
            workspaceId:
              "workspace-b",
          }),
        ),
      /\[ENFORCEMENT:BLOCK\].*workspace/i,
    );
  },
);

test(
  "15C - idempotency returns the original delivery",
  () => {
    const governance =
      new EnterpriseWebhookGovernance();

    governance.register(
      endpoint(),
    );

    const first =
      governance.createDelivery(
        delivery(),
      );

    const second =
      governance.createDelivery(
        delivery({
          deliveryId:
            "delivery-15c-replay",
        }),
      );

    assert.equal(
      second.deliveryId,
      first.deliveryId,
    );
  },
);

test(
  "15C - delivery lifecycle succeeds",
  () => {
    const governance =
      new EnterpriseWebhookGovernance();

    governance.register(
      endpoint(),
    );

    governance.createDelivery(
      delivery(),
    );

    governance.markDelivering(
      "workspace-a",
      "delivery-15c",
    );

    const succeeded =
      governance.markSucceeded(
        "workspace-a",
        "delivery-15c",
        204,
      );

    assert.equal(
      succeeded.status,
      "SUCCEEDED",
    );

    assert.equal(
      succeeded.responseCode,
      204,
    );

    assert.ok(
      succeeded.succeededAt,
    );
  },
);

test(
  "15C - retry respects max attempts",
  () => {
    const governance =
      new EnterpriseWebhookGovernance();

    governance.register(
      endpoint({
        maxAttempts:
          1,
      }),
    );

    governance.createDelivery(
      delivery(),
    );

    governance.markDelivering(
      "workspace-a",
      "delivery-15c",
    );

    const failed =
      governance.markRetrying(
        "workspace-a",
        "delivery-15c",
        "network failure",
        new Date(),
      );

    assert.equal(
      failed.status,
      "FAILED",
    );
  },
);

test(
  "15C - terminal delivery cannot be delivered again",
  () => {
    const governance =
      new EnterpriseWebhookGovernance();

    governance.register(
      endpoint(),
    );

    governance.createDelivery(
      delivery(),
    );

    governance.markDelivering(
      "workspace-a",
      "delivery-15c",
    );

    governance.markSucceeded(
      "workspace-a",
      "delivery-15c",
    );

    assert.throws(
      () =>
        governance.markDelivering(
          "workspace-a",
          "delivery-15c",
        ),
      /\[ENFORCEMENT:BLOCK\].*Terminal/i,
    );
  },
);

test(
  "15C - delivery helpers are deterministic",
  () => {
    assert.equal(
      isTerminalWebhookDelivery(
        "SUCCEEDED",
      ),
      true,
    );

    assert.equal(
      isRetryableWebhookDelivery(
        "RETRYING",
      ),
      true,
    );
  },
);

console.log(
  "15C webhook governance tests loaded.",
);
