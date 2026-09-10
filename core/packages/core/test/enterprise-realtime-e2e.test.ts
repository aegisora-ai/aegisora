import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseRealtimeRuntimeBridge,
} from "../../runtime/src/events/enterprise-realtime-bridge";

import type {
  EnterpriseRealtimeEvent,
  EnterpriseRealtimeWriter,
} from "../src/enterprise/realtime";

test("13D-D - runtime bridge persists before notifying subscribers", async () => {
  const order: string[] = [];
  const written: EnterpriseRealtimeEvent[] = [];

  const writer: EnterpriseRealtimeWriter = {
    async publish(event) {
      order.push("writer:start");

      await Promise.resolve();

      written.push(event);

      order.push("writer:end");
    },
  };

  const bridge =
    new EnterpriseRealtimeRuntimeBridge({
      writer,
    });

  bridge.subscribe(() => {
    order.push("subscriber");
  });

  await bridge.publish({
    id: "event-e2e-001",
    workspaceId: "workspace-a",
    type: "execution.completed",
    traceId: "trace-e2e-001",
    decisionId: "decision-e2e-001",
    executionId: "execution-e2e-001",
    evidenceId: "evidence-e2e-001",
    agentId: "agent-e2e-001",
    action: "provider.generate",
    decision: "ALLOW",
    riskScore: 8,
    metadata: {
      source: "runtime",
    },
  });

  assert.deepEqual(
    order,
    [
      "writer:start",
      "writer:end",
      "subscriber",
    ],
  );

  assert.equal(written.length, 1);
  assert.equal(
    written[0]?.workspaceId,
    "workspace-a",
  );
});

test("13D-D - persistence failure prevents subscriber notification", async () => {
  let notified = false;

  const writer: EnterpriseRealtimeWriter = {
    async publish() {
      throw new Error("persistence failed");
    },
  };

  const bridge =
    new EnterpriseRealtimeRuntimeBridge({
      writer,
    });

  bridge.subscribe(() => {
    notified = true;
  });

  await assert.rejects(
    () =>
      bridge.publish({
        id: "event-fail-001",
        workspaceId: "workspace-a",
        type: "execution.failed",
        traceId: "trace-fail-001",
        decisionId: "decision-fail-001",
        executionId: "execution-fail-001",
        evidenceId: "evidence-fail-001",
        agentId: "agent-fail-001",
        action: "provider.generate",
        decision: "ESCALATE",
        riskScore: 91,
      }),
    /persistence failed/,
  );

  assert.equal(notified, false);
});

test("13D-D - duplicate event identity is preserved for database idempotency", async () => {
  const rows = new Set<string>();

  const writer: EnterpriseRealtimeWriter = {
    async publish(event) {
      if (rows.has(event.id)) {
        throw new Error(
          `duplicate realtime event: ${event.id}`,
        );
      }

      rows.add(event.id);
    },
  };

  const bridge =
    new EnterpriseRealtimeRuntimeBridge({
      writer,
    });

  const input = {
    id: "event-duplicate-001",
    workspaceId: "workspace-a",
    type: "decision.created" as const,
    traceId: "trace-duplicate-001",
    decisionId: "decision-duplicate-001",
    executionId: "execution-duplicate-001",
    evidenceId: "evidence-duplicate-001",
    agentId: "agent-duplicate-001",
    action: "policy.evaluate",
    decision: "BLOCK" as const,
    riskScore: 100,
  };

  await bridge.publish(input);

  await assert.rejects(
    () => bridge.publish(input),
    /duplicate realtime event/,
  );

  assert.equal(
    rows.size,
    1,
  );
});

test("13D-D - workspace identity cannot be rewritten by writer", async () => {
  const written: EnterpriseRealtimeEvent[] = [];

  const writer: EnterpriseRealtimeWriter = {
    async publish(event) {
      written.push(event);
    },
  };

  const bridge =
    new EnterpriseRealtimeRuntimeBridge({
      writer,
    });

  await bridge.publish({
    id: "event-workspace-a",
    workspaceId: "workspace-a",
    type: "execution.blocked",
    traceId: "trace-a",
    decisionId: "decision-a",
    executionId: "execution-a",
    evidenceId: "evidence-a",
    agentId: "agent-a",
    action: "tool.execute",
    decision: "BLOCK",
    riskScore: 99,
  });

  await bridge.publish({
    id: "event-workspace-b",
    workspaceId: "workspace-b",
    type: "execution.blocked",
    traceId: "trace-b",
    decisionId: "decision-b",
    executionId: "execution-b",
    evidenceId: "evidence-b",
    agentId: "agent-b",
    action: "tool.execute",
    decision: "BLOCK",
    riskScore: 99,
  });

  assert.deepEqual(
    written.map(
      (event) => event.workspaceId,
    ),
    [
      "workspace-a",
      "workspace-b",
    ],
  );
});
