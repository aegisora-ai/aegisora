import type {
  AgentRuntime,
  ToolContext,
} from "@aegisora/runtime";
import type {
  AegisoraTaskContract,
  AegisoraToolDefinition,
  ProtectedAegisoraTool,
  ProtectToolsOptions,
} from "./types";

const TOOL_NAME = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function requireIdentifier(value: string, field: string): string {
  if (typeof value !== "string" || value.trim() !== value || !value || !TOOL_NAME.test(value)) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

function uniqueNames(values: readonly string[], field: string): Set<string> {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${field} must contain at least one exact capability name.`);
  }
  const result = new Set<string>();
  for (const value of values) {
    const normalized = requireIdentifier(value, field);
    if (result.has(normalized)) {
      throw new Error(`${field} contains duplicate capability: ${normalized}`);
    }
    result.add(normalized);
  }
  return result;
}

function validateContract(contract: AegisoraTaskContract, agentId: string) {
  if (!contract || typeof contract !== "object") {
    throw new Error("Aegisora task contract is required.");
  }
  const contractId = requireIdentifier(contract.contractId, "contractId");
  const contractAgentId = requireIdentifier(contract.agentId, "contract.agentId");
  if (contractAgentId !== agentId) {
    throw new Error("Task contract agentId does not match the protected agent.");
  }

  const allowedTools = uniqueNames(contract.allowedTools, "allowedTools");

  const rawApprovalRequiredTools =
    contract.approvalRequiredTools ?? [];

  if (!Array.isArray(rawApprovalRequiredTools)) {
    throw new Error("approvalRequiredTools must be an array.");
  }

  const approvalRequiredTools = new Set<string>();

  for (const name of rawApprovalRequiredTools) {
    const normalized = requireIdentifier(
      name,
      "approvalRequiredTools",
    );

    if (approvalRequiredTools.has(normalized)) {
      throw new Error(
        `Duplicate approval capability: ${normalized}`,
      );
    }

    approvalRequiredTools.add(normalized);
  }

  for (const name of approvalRequiredTools) {
    if (!allowedTools.has(name)) {
      throw new Error(`Approval capability is not allowed by the task contract: ${name}`);
    }
  }

  let expiresAtMs: number | undefined;
  if (contract.expiresAt !== undefined) {
    if (typeof contract.expiresAt !== "string") {
      throw new Error("contract.expiresAt must be an ISO date string.");
    }
    expiresAtMs = Date.parse(contract.expiresAt);
    if (!Number.isFinite(expiresAtMs)) {
      throw new Error("contract.expiresAt is not a valid date.");
    }
  }

  const maxExecutions = contract.maxExecutions;
  if (maxExecutions !== undefined &&
      (!Number.isSafeInteger(maxExecutions) || maxExecutions < 1 || maxExecutions > 1_000_000)) {
    throw new Error("contract.maxExecutions must be an integer between 1 and 1000000.");
  }

  return {
    contractId,
    allowedTools,
    approvalRequiredTools,
    expiresAtMs,
    maxExecutions,
  };
}

/**
 * Register tools with the canonical runtime and return framework-neutral wrappers.
 * Every wrapper invocation goes through ToolRegistry authorization and execution.
 */
export function protectTools(
  runtime: AgentRuntime,
  options: ProtectToolsOptions,
): ProtectedAegisoraTool[] {
  if (!options || typeof options !== "object") {
    throw new Error("protectTools options are required.");
  }

  const agentId = requireIdentifier(options.agentId, "agentId");
  if (!runtime.getAgentById(agentId)) {
    throw new Error(`Agent must be registered before protecting tools: ${agentId}`);
  }

  const contract = validateContract(options.contract, agentId);
  if (!Array.isArray(options.tools) || options.tools.length === 0) {
    throw new Error("At least one tool definition is required.");
  }

  /*
   * Read each tool field only once through its own data
   * property descriptor. Accessors are rejected, never invoked.
   *
   * All validation, registration and returned wrappers use
   * this single immutable snapshot.
   */
  const names = new Set<string>();

  const registeredTools = options.tools.map((tool) => {

    if (!tool || typeof tool !== "object") {
      throw new Error("Tool definition must be an object.");
    }

    const nameDescriptor =
      Object.getOwnPropertyDescriptor(tool, "name");

    const descriptionDescriptor =
      Object.getOwnPropertyDescriptor(tool, "description");

    const executeDescriptor =
      Object.getOwnPropertyDescriptor(tool, "execute");

    if (
      !nameDescriptor ||
      !Object.prototype.hasOwnProperty.call(nameDescriptor, "value") ||
      !descriptionDescriptor ||
      !Object.prototype.hasOwnProperty.call(descriptionDescriptor, "value") ||
      !executeDescriptor ||
      !Object.prototype.hasOwnProperty.call(executeDescriptor, "value")
    ) {
      throw new Error(
        "Tool name, description, and execute must be own data properties; accessors are not accepted.",
      );
    }

    const name = requireIdentifier(
      nameDescriptor.value,
      "tool.name",
    );

    const description = descriptionDescriptor.value;
    const execute = executeDescriptor.value;

    if (names.has(name)) {
      throw new Error(`Duplicate tool definition: ${name}`);
    }

    names.add(name);

    if (!contract.allowedTools.has(name)) {
      throw new Error(
        `Tool is not permitted by task contract: ${name}`,
      );
    }

    if (
      typeof description !== "string" ||
      !description.trim()
    ) {
      throw new Error(
        `Tool description is required: ${name}`,
      );
    }

    if (typeof execute !== "function") {
      throw new Error(
        `Tool execute function is required: ${name}`,
      );
    }

    if (runtime.getToolRegistry().has(name)) {
      throw new Error(
        `Runtime tool is already registered: ${name}`,
      );
    }

    const handler = Function.prototype.bind.call(
      execute,
      tool,
    ) as (
      input: unknown,
      context: ToolContext,
    ) => unknown;

    return Object.freeze({
      name,
      description,

      execute: async (
        input: unknown,
        context: ToolContext,
      ): Promise<unknown> =>
        handler(input, context),
    });
  });

  runtime.registerProtectedTools(
    registeredTools,
    {
      contractId: contract.contractId,
      agentId,
      allowedTools: [...contract.allowedTools],
      approvalRequiredTools: [...contract.approvalRequiredTools],

      ...(options.contract.expiresAt !== undefined
        ? { expiresAt: options.contract.expiresAt }
        : {}),

      ...(contract.maxExecutions !== undefined
        ? { maxExecutions: contract.maxExecutions }
        : {}),
    },
  );

  return registeredTools.map((tool) => {

    const name = tool.name;
    const description = tool.description;

    return Object.freeze({
      name,
      description,

      execute: async (
        input: unknown,
        options?: { readonly approvalId?: string },
      ): Promise<unknown> => {
        let metadata: Record<string, unknown> = {};
        if (options !== undefined) {
          if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new Error("Invalid execute options.");
          }
          const approvalId = options.approvalId;
          if (approvalId !== undefined) {
            if (typeof approvalId !== "string" || approvalId.length === 0 || approvalId.length > 128) {
              throw new Error("approvalId must be a non-empty string.");
            }
            metadata = { approvalId };
          }
        }
        return runtime.executeRegisteredTool(agentId, name, input, metadata);
      },
    });
  });
}