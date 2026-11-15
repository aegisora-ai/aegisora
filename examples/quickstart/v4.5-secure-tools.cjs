const { AegisoraClient } = require("@aegisora/sdk");

async function main() {
  const aegisora = new AegisoraClient();
  aegisora.agent({ name: "demo-support-agent" });

  let crmCalls = 0;
  const [lookupCustomer] = aegisora.protectTools({
    agentId: "demo-support-agent",
    contract: {
      contractId: "demo-support-task-v1",
      agentId: "demo-support-agent",
      allowedTools: ["crm.lookup"],
      maxExecutions: 5,
    },
    tools: [{
      name: "crm.lookup",
      description: "Read one customer record.",
      async execute(input) {
        crmCalls += 1;
        return { customerId: input.customerId, status: "active" };
      },
    }],
  });

  const result = await lookupCustomer.execute({ customerId: "customer-42" });
  console.log(result);
  console.log({ crmCalls });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});