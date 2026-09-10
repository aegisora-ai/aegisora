import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseRealtimeBus,
  type EnterpriseRealtimeEvent,
} from "../src/enterprise/realtime";

import {
  EnterpriseRealtimeRuntimeBridge,
} from "../../runtime/src/events/enterprise-realtime-bridge";

function createEvent(
  workspaceId: string,
  overrides: Partial<EnterpriseRealtimeEvent> = {},
): EnterpriseRealtimeEvent {
  return Object.freeze({
    id: "realtime-event-001",
    workspaceId,
    type: "decision.created",
    traceId: "trace-001",
    decisionId: "decision-001",
    executionId: "execution-001",
    evidenceId: "evidence-001",
    agentId: "agent-001",
    action: "provider.generate",
    decision: "ALLOW",
    riskScore: 10,
    timestamp: new Date("2026-01-01T00:00:00.000Z"),
    metadata: Object.freeze({
      source: "test",
    }),
    ...overrides,
  });
}

test("13C - publish reaches subscribers", async () => {
  const bus = new EnterpriseRealtimeBus();
  const received: EnterpriseRealtimeEvent[] = [];

  bus.subscribe((event) => {
    received.push(event);
  });

  const event = createEvent("workspace-a");

  await bus.publish(event);

  assert.equal(received.length, 1);
  assert.equal(received[0]?.workspaceId, "workspace-a");
  assert.equal(received[0]?.decision, "ALLOW");
});

test("13C - unsubscribe stops delivery", async () => {
  const bus = new EnterpriseRealtimeBus();
  let count = 0;

  const unsubscribe = bus.subscribe(() => {
    count += 1;
  });

  await bus.publish(createEvent("workspace-a"));

  unsubscribe();

  await bus.publish(createEvent("workspace-a"));

  assert.equal(count, 1);
  assert.equal(bus.listenerCount(), 0);
});

test("13C - workspace identity is preserved", async () => {
  const bus = new EnterpriseRealtimeBus();
  const received: EnterpriseRealtimeEvent[] = [];

  bus.subscribe((event) => {
    received.push(event);
  });

  await bus.publish(createEvent("workspace-a"));
  await bus.publish(createEvent("workspace-b"));

  assert.deepEqual(
    received.map((event) => event.workspaceId),
    ["workspace-a", "workspace-b"],
  );
});

test("13C - writer receives canonical event", async () => {
  const written: EnterpriseRealtimeEvent[] = [];

  const bus = new EnterpriseRealtimeBus({
    publish(event) {
      written.push(event);
    },
  });

  const event = createEvent("workspace-a");

  await bus.publish(event);

  assert.equal(written.length, 1);
  assert.equal(written[0]?.id, event.id);
  assert.equal(written[0]?.traceId, event.traceId);
  assert.equal(written[0]?.decisionId, event.decisionId);
  assert.equal(written[0]?.executionId, event.executionId);
  assert.equal(written[0]?.evidenceId, event.evidenceId);
});

test("13C - runtime bridge preserves authoritative correlation IDs", () => {
  const received: EnterpriseRealtimeEvent[] = [];

  const bridge = new EnterpriseRealtimeRuntimeBridge();

  bridge.subscribe((event) => {
    received.push(event);
  });

  bridge.publish({
    id: "realtime-event-002",
    workspaceId: "workspace-a",
    type: "execution.blocked",
    traceId: "trace-authoritative",
    decisionId: "decision-authoritative",
    executionId: "execution-authoritative",
    evidenceId: "evidence-authoritative",
    agentId: "agent-authoritative",
    action: "tool.execute",
    decision: "BLOCK",
    riskScore: 99,
    metadata: {
      source: "runtime",
    },
  });

  assert.equal(received.length, 1);

  const event = received[0]!;

  assert.equal(event.workspaceId, "workspace-a");
  assert.equal(event.traceId, "trace-authoritative");
  assert.equal(event.decisionId, "decision-authoritative");
  assert.equal(event.executionId, "execution-authoritative");
  assert.equal(event.evidenceId, "evidence-authoritative");
  assert.equal(event.agentId, "agent-authoritative");
  assert.equal(event.decision, "BLOCK");
  assert.equal(event.riskScore, 99);
});

test("13C - event metadata is frozen", () => {
  const bus = new EnterpriseRealtimeBus();

  let received: EnterpriseRealtimeEvent | undefined;

  bus.subscribe((event) => {
    received = event;
  });

  bus.publish(
    createEvent("workspace-a", {
      metadata: Object.freeze({
        source: "runtime",
      }),
    }),
  );

  assert.ok(received);
  assert.equal(Object.isFrozen(received), true);
  assert.equal(Object.isFrozen(received.metadata), true);
});
