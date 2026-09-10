import assert from "node:assert/strict";
import test from "node:test";

import {
  createEnterpriseRealtimeSubscription,
  matchesEnterpriseRealtimeSubscription,
  type EnterpriseRealtimeEvent,
} from "../src/enterprise/realtime";

function event(
  workspaceId: string,
  type: EnterpriseRealtimeEvent["type"],
): EnterpriseRealtimeEvent {
  return Object.freeze({
    id: `${workspaceId}-${type}`,
    workspaceId,
    type,
    traceId: "trace-001",
    decisionId: "decision-001",
    executionId: "execution-001",
    evidenceId: "evidence-001",
    agentId: "agent-001",
    action: "provider.generate",
    decision: "ALLOW",
    riskScore: 10,
    timestamp: new Date(
      "2026-09-07T18:00:00.000Z",
    ),
    metadata: Object.freeze({}),
  });
}

test("13G - workspace is mandatory", () => {
  assert.throws(
    () =>
      createEnterpriseRealtimeSubscription({
        workspaceId: "   ",
      }),
    /workspaceId/,
  );
});

test("13G - same workspace matches", () => {
  const subscription =
    createEnterpriseRealtimeSubscription({
      workspaceId: "workspace-a",
    });

  assert.equal(
    matchesEnterpriseRealtimeSubscription(
      event(
        "workspace-a",
        "execution.completed",
      ),
      subscription,
    ),
    true,
  );
});

test("13G - cross workspace event is rejected", () => {
  const subscription =
    createEnterpriseRealtimeSubscription({
      workspaceId: "workspace-a",
    });

  assert.equal(
    matchesEnterpriseRealtimeSubscription(
      event(
        "workspace-b",
        "execution.completed",
      ),
      subscription,
    ),
    false,
  );
});

test("13G - event type filter is enforced", () => {
  const subscription =
    createEnterpriseRealtimeSubscription({
      workspaceId: "workspace-a",
      eventTypes: [
        "execution.completed",
        "execution.failed",
      ],
    });

  assert.equal(
    matchesEnterpriseRealtimeSubscription(
      event(
        "workspace-a",
        "execution.completed",
      ),
      subscription,
    ),
    true,
  );

  assert.equal(
    matchesEnterpriseRealtimeSubscription(
      event(
        "workspace-a",
        "execution.blocked",
      ),
      subscription,
    ),
    false,
  );
});

test("13G - duplicate event types are normalized", () => {
  const subscription =
    createEnterpriseRealtimeSubscription({
      workspaceId: "workspace-a",
      eventTypes: [
        "audit.created",
        "audit.created",
        "evidence.created",
      ],
    });

  assert.deepEqual(
    subscription.eventTypes,
    [
      "audit.created",
      "evidence.created",
    ],
  );
});
