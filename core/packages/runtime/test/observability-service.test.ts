import assert from "node:assert/strict";
import test from "node:test";

import type {
  RuntimeEvent,
  SecurityEvent,
  PolicyEvent,
} from "@aegisora/observability";

import { ObservabilityService } from "../src/services/observability-service";

function makeRuntimeEvent(overrides: Partial<RuntimeEvent> = {}): RuntimeEvent {
  return {
    id: "rt-1",
    type: "EXECUTION_STARTED",
    requestId: "req-1",
    agentId: "agent-1",
    timestamp: new Date("2026-11-14T00:00:00.000Z"),
    ...overrides,
  };
}

function makeSecurityEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  return {
    id: "sec-1",
    type: "THREAT_DETECTED",
    requestId: "req-1",
    agentId: "agent-1",
    threat: "prompt-injection",
    severity: "HIGH",
    timestamp: new Date("2026-11-14T00:00:00.000Z"),
    ...overrides,
  };
}

function makePolicyEvent(overrides: Partial<PolicyEvent> = {}): PolicyEvent {
  return {
    id: "pol-1",
    type: "POLICY_ALLOWED",
    requestId: "req-1",
    agentId: "agent-1",
    policyId: "pol-1",
    decision: "ALLOW",
    timestamp: new Date("2026-11-14T00:00:00.000Z"),
    ...overrides,
  };
}

test("ObservabilityService: recordRuntimeEvent, recordSecurityEvent and recordPolicyEvent add to collected events", () => {
  const service = new ObservabilityService();

  const runtime = makeRuntimeEvent();
  const security = makeSecurityEvent();
  const policy = makePolicyEvent();

  service.recordRuntimeEvent(runtime);
  service.recordSecurityEvent(security);
  service.recordPolicyEvent(policy);

  const events = service.getEvents();

  assert.equal(events.length, 3);
  assert.deepEqual(events[0], runtime);
  assert.deepEqual(events[1], security);
  assert.deepEqual(events[2], policy);
});

test("ObservabilityService: getEvents returns a copy so mutation does not affect service state", () => {
  const service = new ObservabilityService();

  const runtime = makeRuntimeEvent();
  service.recordRuntimeEvent(runtime);

  const events = service.getEvents();
  events.push(makeSecurityEvent());
  events[0] = makePolicyEvent();

  const again = service.getEvents();

  assert.equal(again.length, 1);
  assert.deepEqual(again[0], runtime);
});

test("ObservabilityService: clear empties the events", () => {
  const service = new ObservabilityService();

  service.recordRuntimeEvent(makeRuntimeEvent());
  service.recordSecurityEvent(makeSecurityEvent());
  service.recordPolicyEvent(makePolicyEvent());

  assert.equal(service.getEvents().length, 3);

  service.clear();

  assert.deepEqual(service.getEvents(), []);
});
