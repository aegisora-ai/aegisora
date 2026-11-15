const test = require("node:test");
const assert = require("node:assert/strict");
const { AegisoraClient, protect } = require("../dist/index.js");

function createClient(agentId) {
  const client = new AegisoraClient();
  client.agent({ name: agentId });
  return client;
}

function contract(agentId, overrides = {}) {
  return {
    contractId: `task-${agentId}`,
    agentId,
    allowedTools: ["crm.lookup"],
    ...overrides,
  };
}

test("v4.5: allowed tool executes through the runtime and preserves its output", async () => {
  const client = createClient("v45-allowed-agent");
  let calls = 0;
  const [lookup] = client.protectTools({
    agentId: "v45-allowed-agent",
    contract: contract("v45-allowed-agent"),
    tools: [{
      name: "crm.lookup",
      description: "Look up one customer record.",
      async execute(input) {
        calls += 1;
        return { result: input };
      },
    }],
  });

  const result = await lookup.execute({ customerId: "customer-42" });
  assert.deepEqual(result, { result: { customerId: "customer-42" } });
  assert.equal(calls, 1);
  assert.ok(client.runtimeInstance().getEvidence().length > 0);
});

test("v4.5: tool outside the task contract is rejected before registration", () => {
  const client = createClient("v45-scope-agent");
  assert.throws(() => client.protectTools({
    agentId: "v45-scope-agent",
    contract: contract("v45-scope-agent"),
    tools: [{
      name: "crm.export",
      description: "Export CRM records.",
      async execute() { return "must-not-run"; },
    }],
  }), /not permitted by task contract/);
  assert.equal(client.runtimeInstance().getToolRegistry().has("crm.export"), false);
});

test("v4.5: expired task contract fails closed", async () => {
  const client = createClient("v45-expired-agent");
  let calls = 0;
  const [lookup] = client.protectTools({
    agentId: "v45-expired-agent",
    contract: contract("v45-expired-agent", { expiresAt: "2020-01-01T00:00:00.000Z" }),
    tools: [{
      name: "crm.lookup",
      description: "Look up a customer record.",
      async execute() { calls += 1; return "must-not-run"; },
    }],
  });
  await assert.rejects(() => lookup.execute({ customerId: "customer-42" }), /contract expired/i);
  assert.equal(calls, 0);
});

test("v4.5: max execution count is reserved before concurrent work", async () => {
  const client = createClient("v45-limit-agent");
  let calls = 0;
  const [lookup] = client.protectTools({
    agentId: "v45-limit-agent",
    contract: contract("v45-limit-agent", { maxExecutions: 1 }),
    tools: [{
      name: "crm.lookup",
      description: "Look up a customer record.",
      async execute() {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return "ok";
      },
    }],
  });

  const first = lookup.execute({ customerId: "customer-42" });
  await assert.rejects(
    () => lookup.execute({ customerId: "customer-43" }),
    /execution limit reached/i,
  );
  assert.equal(await first, "ok");
  assert.equal(calls, 1);
});

test("v4.5: approval-required tool escalates before its handler runs", async () => {
  const client = createClient("v45-approval-agent");
  let calls = 0;
  const [write] = client.protectTools({
    agentId: "v45-approval-agent",
    contract: contract("v45-approval-agent", {
      allowedTools: ["crm.lookup", "crm.write"],
      approvalRequiredTools: ["crm.write"],
    }),
    tools: [{
      name: "crm.write",
      description: "Update an authorized CRM record.",
      async execute() { calls += 1; return "must-not-run"; },
    }],
  });

  await assert.rejects(
    () => write.execute({ customerId: "customer-42", status: "closed" }),
    /ENFORCEMENT:ESCALATE/i,
  );
  assert.equal(calls, 0);
});

test("v4.5: mutable caller input is snapshotted before asynchronous authorization", async () => {
  const client = createClient("v45-snapshot-agent");
  const [lookup] = client.protectTools({
    agentId: "v45-snapshot-agent",
    contract: contract("v45-snapshot-agent"),
    tools: [{
      name: "crm.lookup",
      description: "Return the authorized input snapshot.",
      async execute(input) { return input; },
    }],
  });

  const callerInput = { nested: { customerId: "customer-before" } };
  const pending = lookup.execute(callerInput);
  callerInput.nested.customerId = "customer-after";
  const result = await pending;
  assert.deepEqual(result, { nested: { customerId: "customer-before" } });
});

test("v4.5: legacy protect gates the top-level run entry point", async () => {
  let calls = 0;
  const protectedAgent = protect({
    async run(input) {
      calls += 1;
      return `processed:${input}`;
    },
  });

  const result = await protectedAgent.run({ input: "hello" });
  assert.match(result.output, /processed:hello/);
  assert.equal(calls, 1);
});

test("v4.5: protected contract is enforced through direct runtime execution", async () => {
  const agentId = "v45-runtime-boundary-agent";
  const client = createClient(agentId);
  const runtime = client.runtimeInstance();

  let calls = 0;

  client.protectTools({
    agentId,
    contract: contract(agentId, { maxExecutions: 1 }),
    tools: [{
      name: "crm.lookup",
      description: "Runtime-protected lookup.",
      async execute(input) {
        calls += 1;
        return input;
      },
    }],
  });

  const result = await runtime.executeRegisteredTool(
    agentId,
    "crm.lookup",
    { customerId: "first" },
  );

  assert.deepEqual(result, { customerId: "first" });

  await assert.rejects(
    () => runtime.executeRegisteredTool(
      agentId,
      "crm.lookup",
      { customerId: "second" },
    ),
    /execution limit reached/i,
  );

  assert.equal(calls, 1);
});

test("v4.5: approval requirement cannot be bypassed through runtime entry point", async () => {
  const agentId = "v45-runtime-approval-agent";
  const client = createClient(agentId);
  const runtime = client.runtimeInstance();

  let calls = 0;

  client.protectTools({
    agentId,
    contract: contract(agentId, {
      allowedTools: ["crm.lookup", "crm.write"],
      approvalRequiredTools: ["crm.write"],
    }),
    tools: [{
      name: "crm.write",
      description: "Write protected CRM data.",
      async execute() {
        calls += 1;
        return "must-not-run";
      },
    }],
  });

  await assert.rejects(
    () => runtime.executeRegisteredTool(
      agentId,
      "crm.write",
      { customerId: "customer-42" },
    ),
    /ENFORCEMENT:ESCALATE/i,
  );

  assert.equal(calls, 0);
});

test("v4.5: every contract capability is reserved against unprotected registration", () => {
  const agentId = "v45-reserved-capability-agent";
  const client = createClient(agentId);
  const runtime = client.runtimeInstance();

  client.protectTools({
    agentId,
    contract: contract(agentId, {
      allowedTools: ["crm.lookup", "crm.write"],
    }),
    tools: [{
      name: "crm.write",
      description: "Protected write capability.",
      async execute() {
        return "ok";
      },
    }],
  });

  assert.equal(
    runtime.getToolRegistry().has("crm.lookup"),
    false,
  );

  assert.throws(
    () => runtime.registerTool({
      name: "crm.lookup",
      description: "Attempted unprotected registration.",
      async execute() {
        return "must-not-run";
      },
    }),
    /already registered or reserved/i,
  );
});

test("v4.5: protected registration does not expose raw executable handlers", () => {
  const agentId = "v45-no-handler-leak-agent";
  const client = createClient(agentId);
  const runtime = client.runtimeInstance();

  const registered = runtime.registerProtectedTools(
    [{
      name: "crm.lookup",
      description: "Protected lookup.",
      async execute() {
        return "ok";
      },
    }],
    {
      contractId: "v45-no-handler-contract",
      agentId,
      allowedTools: ["crm.lookup"],
    },
  );

  assert.equal(registered.length, 1);
  assert.equal(registered[0].name, "crm.lookup");
  assert.equal(registered[0].description, "Protected lookup.");
  assert.equal(registered[0].execute, undefined);
});

test("v4.5: SDK snapshots tool identity and handler at registration", async () => {
  const agentId = "v45-handler-snapshot-agent";
  const client = createClient(agentId);
  const runtime = client.runtimeInstance();

  let attackerCalls = 0;

  const toolDefinition = {
    calls: 0,
    name: "crm.lookup",
    description: "Original CRM lookup.",

    async execute(input) {
      this.calls += 1;

      return {
        source: "original-handler",
        calls: this.calls,
        input,
      };
    },
  };

  const [lookup] = client.protectTools({
    agentId,
    contract: contract(agentId),
    tools: [toolDefinition],
  });

  // Attempt to substitute the original handler and identity
  // after Aegisora has registered the protected tool.
  toolDefinition.execute = async () => {
    attackerCalls += 1;
    return "SUBSTITUTED_HANDLER";
  };

  toolDefinition.name = "crm.attacker";
  toolDefinition.description = "Mutated tool.";

  const sdkResult = await lookup.execute({
    path: "sdk",
  });

  assert.deepEqual(sdkResult, {
    source: "original-handler",
    calls: 1,
    input: { path: "sdk" },
  });

  const runtimeResult = await runtime.executeRegisteredTool(
    agentId,
    "crm.lookup",
    { path: "runtime" },
  );

  assert.deepEqual(runtimeResult, {
    source: "original-handler",
    calls: 2,
    input: { path: "runtime" },
  });

  assert.equal(attackerCalls, 0);
  assert.equal(toolDefinition.calls, 2);

  assert.equal(lookup.name, "crm.lookup");
  assert.equal(lookup.description, "Original CRM lookup.");

  assert.equal(runtime.getToolRegistry().has("crm.lookup"), true);
  assert.equal(runtime.getToolRegistry().has("crm.attacker"), false);
});

test("v4.5: protected tool rejects accessor-backed properties", () => {
  const agentId = "v45-accessor-rejection-agent";
  const client = createClient(agentId);
  const runtime = client.runtimeInstance();

  const getterCalls = {
    name: 0,
    description: 0,
    execute: 0,
  };

  const tool = {};

  Object.defineProperties(tool, {
    name: {
      configurable: true,
      enumerable: true,
      get() {
        getterCalls.name += 1;
        return "crm.lookup";
      },
    },
    description: {
      configurable: true,
      enumerable: true,
      get() {
        getterCalls.description += 1;
        return "Accessor-backed tool.";
      },
    },
    execute: {
      configurable: true,
      enumerable: true,
      get() {
        getterCalls.execute += 1;
        return async () => "must-not-run";
      },
    },
  });

  assert.throws(
    () => client.protectTools({
      agentId,
      contract: contract(agentId),
      tools: [tool],
    }),
    /own data properties|accessors are not accepted/i,
  );

  assert.deepEqual(getterCalls, {
    name: 0,
    description: 0,
    execute: 0,
  });

  assert.equal(
    runtime.getToolRegistry().has("crm.lookup"),
    false,
  );
});

test("v4.5: protected tool properties are snapshotted once", async () => {
  const agentId = "v45-single-read-agent";
  const client = createClient(agentId);

  const descriptorReads = {
    name: 0,
    description: 0,
    execute: 0,
  };

  const propertyReads = {
    name: 0,
    description: 0,
    execute: 0,
  };

  let calls = 0;

  const target = {
    name: "crm.lookup",
    description: "Single-read protected tool.",

    async execute() {
      calls += 1;
      return "original-handler";
    },
  };

  const tool = new Proxy(target, {
    getOwnPropertyDescriptor(object, property) {
      if (
        typeof property === "string" &&
        Object.prototype.hasOwnProperty.call(
          descriptorReads,
          property,
        )
      ) {
        descriptorReads[property] += 1;
      }

      return Reflect.getOwnPropertyDescriptor(
        object,
        property,
      );
    },

    get(object, property, receiver) {
      if (
        typeof property === "string" &&
        Object.prototype.hasOwnProperty.call(
          propertyReads,
          property,
        )
      ) {
        propertyReads[property] += 1;
      }

      return Reflect.get(object, property, receiver);
    },
  });

  const [lookup] = client.protectTools({
    agentId,
    contract: contract(agentId),
    tools: [tool],
  });

  assert.deepEqual(descriptorReads, {
    name: 1,
    description: 1,
    execute: 1,
  });

  assert.deepEqual(propertyReads, {
    name: 0,
    description: 0,
    execute: 0,
  });

  assert.equal(
    await lookup.execute({ probe: true }),
    "original-handler",
  );

  assert.equal(calls, 1);

  assert.deepEqual(propertyReads, {
    name: 0,
    description: 0,
    execute: 0,
  });
});
