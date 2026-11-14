
import type {
  ContinuitySeal,
} from "@aegisora/core";

import type {
  DelegationAuthorityContract,
  CompromiseSimulationGraph,
} from "@aegisora/core";
import { isDeepStrictEqual } from "node:util";

import {
  RuntimeTool,
  ToolContext,
  ToolExecutionPolicy,
} from "./tool";

import {
  EnforcementGate,
  type EnforcementResult,
} from "../enforcement";

import {
  verifyExternalDecision,
  verifyExecutionBinding,
  type ExternalDecisionBinding,
} from "../enforcement/external-decision-binding";

import {
  DelegationAuthority,
} from "../authorization/delegation-authority";

const TOOL_AUTHORIZATION_MARKER =
  Symbol("aegisora.tool.authorization");

export interface ToolAuthorizationReceipt {
  readonly authorizationId: string;
  readonly agentId: string;
  readonly tool: string;
  readonly action: "tool.execute";
  readonly enforcement: EnforcementResult;
  readonly continuitySeal?: ContinuitySeal;
  readonly marker: symbol;
}

interface ProtectedToolPolicyState {
  readonly contractId: string;
  readonly agentId: string;
  readonly allowedTools: ReadonlySet<string>;
  readonly approvalRequiredTools: ReadonlySet<string>;
  readonly expiresAtMs?: number;
  readonly maxExecutions?: number;
  attemptedExecutions: number;
}

interface ToolAuthorizationBinding {
  readonly agentId: string;
  readonly name: string;
  readonly inputSnapshot: unknown;
  readonly tool: RuntimeTool;
  readonly handler: RuntimeTool["execute"];
  readonly metadataSnapshot: Record<string, unknown>;
  readonly enforcement: EnforcementResult;
  readonly gate: EnforcementGate;
}

interface PreparedToolAuthorization {
  readonly gate: EnforcementGate;
  readonly agentId: string;
  readonly name: string;
  readonly tool: RuntimeTool;
  readonly inputSnapshot: unknown;
  readonly metadataSnapshot: Record<string, unknown>;
}

const TOOL_AUTHORIZATION_BINDINGS =
  new WeakMap<ToolAuthorizationReceipt, ToolAuthorizationBinding>();

function deepFreezeSnapshot<T>(
  value: T,
  seen: WeakSet<object> = new WeakSet<object>(),
): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  const object = value as object;
  if (seen.has(object)) {
    return value;
  }
  const prototype = Object.getPrototypeOf(object);
  if (
    !Array.isArray(object) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    return value;
  }
  seen.add(object);
  for (const key of Reflect.ownKeys(object)) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (
      descriptor &&
      Object.prototype.hasOwnProperty.call(descriptor, "value")
    ) {
      deepFreezeSnapshot(descriptor.value, seen);
    }
  }
  return Object.freeze(value) as T;
}

export class ToolRegistry {

  constructor(
    executionToken: symbol,
  ) {
    this.#executionToken = executionToken;
  }

  #executionToken: symbol;

  #enforcement?: EnforcementGate;

  #tools = new Map<string, RuntimeTool>();

  #consumedAuthorizations = new Set<string>();

  #delegationAuthority?: DelegationAuthority;

  #protectedPoliciesByTool =
    new Map<string, ProtectedToolPolicyState>();

  setDelegationAuthority(
    authority: DelegationAuthority,
  ) {
    this.#delegationAuthority = authority;
  }

  setEnforcementGate(
    gate: EnforcementGate,
  ) {
    this.#enforcement = gate;

    gate.configureToolRegistry(
      this,
    );
  }

  private createImmutableTool(
    tool: RuntimeTool,
  ): RuntimeTool {
    if (
      !tool ||
      typeof tool.name !== "string" ||
      !tool.name ||
      typeof tool.description !== "string" ||
      typeof tool.execute !== "function"
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Invalid runtime tool registration.",
      );
    }

    const originalHandler = tool.execute;

    return Object.freeze({
      name: tool.name,
      description: tool.description,
      execute: originalHandler.bind(tool),
    });
  }

  register(
    tool: RuntimeTool,
  ) {
    if (
      !tool ||
      this.#tools.has(tool.name) ||
      this.#protectedPoliciesByTool.has(tool.name)
    ) {
      throw new Error(
        `[ENFORCEMENT:BLOCK] Tool already registered or reserved: ${tool?.name}`,
      );
    }

    const registered =
      this.createImmutableTool(tool);

    this.#tools.set(
      registered.name,
      registered,
    );

    return registered;
  }

  registerProtectedTools(
    tools: readonly RuntimeTool[],
    policy: ToolExecutionPolicy,
  ): ReadonlyArray<Pick<RuntimeTool, "name" | "description">> {

    if (
      !policy ||
      typeof policy.contractId !== "string" ||
      !policy.contractId.trim() ||
      typeof policy.agentId !== "string" ||
      !policy.agentId.trim()
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Invalid protected tool contract.",
      );
    }

    if (
      !Array.isArray(policy.allowedTools) ||
      policy.allowedTools.length === 0
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Protected contract requires allowed tools.",
      );
    }

    const allowedTools = new Set(policy.allowedTools);

    if (
      allowedTools.size !== policy.allowedTools.length ||
      [...allowedTools].some(
        (name) =>
          typeof name !== "string" ||
          !name.trim() ||
          name.trim() !== name,
      )
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Invalid or duplicate allowed tool capability.",
      );
    }

    const rawApprovalRequiredTools =
      policy.approvalRequiredTools ?? [];

    if (!Array.isArray(rawApprovalRequiredTools)) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Invalid approval capability list.",
      );
    }

    const approvalRequiredTools =
      new Set(rawApprovalRequiredTools);

    if (
      approvalRequiredTools.size !== rawApprovalRequiredTools.length ||
      [...approvalRequiredTools].some(
        (name) =>
          typeof name !== "string" ||
          !name.trim() ||
          name.trim() !== name,
      )
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Invalid or duplicate approval capability.",
      );
    }

    for (const name of approvalRequiredTools) {
      if (!allowedTools.has(name)) {
        throw new Error(
          `[ENFORCEMENT:BLOCK] Approval capability is outside contract scope: ${name}`,
        );
      }
    }

    let expiresAtMs: number | undefined;

    if (policy.expiresAt !== undefined) {

      if (typeof policy.expiresAt !== "string") {
        throw new Error(
          "[ENFORCEMENT:BLOCK] Contract expiration must be a string.",
        );
      }

      expiresAtMs = Date.parse(policy.expiresAt);

      if (!Number.isFinite(expiresAtMs)) {
        throw new Error(
          "[ENFORCEMENT:BLOCK] Invalid contract expiration.",
        );
      }
    }

    if (
      policy.maxExecutions !== undefined &&
      (
        !Number.isSafeInteger(policy.maxExecutions) ||
        policy.maxExecutions < 1 ||
        policy.maxExecutions > 1_000_000
      )
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Invalid contract execution limit.",
      );
    }

    if (!Array.isArray(tools) || tools.length === 0) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Protected tool set cannot be empty.",
      );
    }

    const names = new Set<string>();

    /*
     * Every declared capability is reserved by this protected
     * contract, including capabilities not registered in this
     * particular tool batch.
     *
     * This prevents a later normal register() call from adding
     * an unprotected handler under a contract-authorized name.
     */

    for (const name of allowedTools) {

      if (
        this.#tools.has(name) ||
        this.#protectedPoliciesByTool.has(name)
      ) {
        throw new Error(
          `[ENFORCEMENT:BLOCK] Protected capability is already registered or reserved: ${name}`,
        );
      }
    }

    const prepared = tools.map((tool) => {
      const registered =
        this.createImmutableTool(tool);

      if (
        names.has(registered.name) ||
        !allowedTools.has(registered.name) ||
        this.#tools.has(registered.name) ||
        this.#protectedPoliciesByTool.has(registered.name)
      ) {
        throw new Error(
          `[ENFORCEMENT:BLOCK] Protected tool identity conflict: ${registered.name}`,
        );
      }

      names.add(registered.name);

      return registered;
    });

    const state: ProtectedToolPolicyState = {
      contractId: policy.contractId,
      agentId: policy.agentId,
      allowedTools,
      approvalRequiredTools,
      expiresAtMs,
      maxExecutions: policy.maxExecutions,
      attemptedExecutions: 0,
    };

    // All validation is completed before any registry mutation.
    // One shared state enforces the contract execution budget
    // across every tool registered under this contract.

    for (const name of allowedTools) {
      this.#protectedPoliciesByTool.set(name, state);
    }

    for (const tool of prepared) {
      this.#tools.set(tool.name, tool);
    }

    // Never expose executable handler references through the
    // protected registration API.
    return prepared.map((tool) =>
      Object.freeze({
        name: tool.name,
        description: tool.description,
      }),
    );
  }

  remove(
    name: string,
  ) {
    if (this.#protectedPoliciesByTool.has(name)) {
      throw new Error(
        `[ENFORCEMENT:BLOCK] Protected tool registration cannot be removed: ${name}`,
      );
    }

    return this.#tools.delete(name);
  }

  private resolve(
    name: string,
  ) {
    const tool =
      this.#tools.get(name);

    if (!tool) {
      throw new Error(
        `Tool not found: ${name}`,
      );
    }

    return tool;
  }

  get(
    name: string,
  ) {
    const tool =
      this.resolve(name);

    return {
      name: tool.name,
      description: tool.description,
    };
  }

  has(
    name: string,
  ) {
    return this.#tools.has(name);
  }

  private prepareAuthorization(
    agentId: string,
    name: string,
    input: unknown,
    metadata?: Record<string, unknown>,
  ): PreparedToolAuthorization {

    const gate = this.#enforcement;
    if (!gate) {
      throw new Error(
        "ToolRegistry execution boundary is not configured.",
      );
    }

    const registeredTool = this.#tools.get(name);
    if (!registeredTool) {
      throw new Error(
        `[ENFORCEMENT:BLOCK] Unknown or unregistered tool: ${name}`,
      );
    }

    const protectedPolicy = this.#protectedPoliciesByTool.get(name);
    if (protectedPolicy) {
      if (protectedPolicy.agentId !== agentId) {
        throw new Error(
          "[ENFORCEMENT:BLOCK] Protected tool contract agent mismatch.",
        );
      }
      if (
        protectedPolicy.expiresAtMs !== undefined &&
        Date.now() >= protectedPolicy.expiresAtMs
      ) {
        throw new Error(
          `[ENFORCEMENT:BLOCK] Task contract expired: ${protectedPolicy.contractId}`,
        );
      }
      if (
        protectedPolicy.maxExecutions !== undefined &&
        protectedPolicy.attemptedExecutions >= protectedPolicy.maxExecutions
      ) {
        throw new Error(
          `[ENFORCEMENT:BLOCK] Task contract execution limit reached: ${protectedPolicy.contractId}`,
        );
      }
      // Reserve synchronously before asynchronous governance work.
      protectedPolicy.attemptedExecutions += 1;
    }

    let inputSnapshot: unknown;
    let effectiveMetadata: Record<string, unknown>;
    try {
      inputSnapshot = structuredClone(input);
      effectiveMetadata = structuredClone(metadata ?? {});
    } catch {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Tool input and metadata must be structured-cloneable.",
      );
    }

    if (protectedPolicy) {
      effectiveMetadata = {
        ...effectiveMetadata,
        aegisoraTaskContractId: protectedPolicy.contractId,
        aegisoraTaskContractVersion: "1",
        aegisoraCapability: name,
        requiresReview:
          protectedPolicy.approvalRequiredTools.has(name) ||
          effectiveMetadata.requiresReview === true,
      };
    }

    if (effectiveMetadata.externalDecision) {
      const externalBinding =
        effectiveMetadata.externalDecision as ExternalDecisionBinding;
      const decisionVerification = verifyExternalDecision(externalBinding);
      if (!decisionVerification.valid) {
        throw new Error(
          `[ENFORCEMENT:BLOCK] External decision verification failed: ${decisionVerification.reason}`,
        );
      }
      const executionVerification = verifyExecutionBinding(externalBinding, {
        agentId,
        tool: name,
        args: inputSnapshot,
      });
      if (!executionVerification.valid) {
        throw new Error(
          `[ENFORCEMENT:BLOCK] External decision execution binding failed: ${executionVerification.reason}`,
        );
      }
    }

    return {
      gate,
      agentId,
      name,
      tool: registeredTool,
      inputSnapshot: deepFreezeSnapshot(inputSnapshot),
      metadataSnapshot: deepFreezeSnapshot(
        structuredClone(effectiveMetadata),
      ),
    };
  }

  private createAuthorizationReceipt(
    prepared: PreparedToolAuthorization,
    trustedBinding: {
      result: EnforcementResult;
      metadataSnapshot: Record<string, unknown>;
    },
  ): ToolAuthorizationReceipt {

    const privateEnforcement =
      deepFreezeSnapshot(
        structuredClone(trustedBinding.result),
      ) as EnforcementResult;
    const privateMetadata =
      deepFreezeSnapshot(
        structuredClone(trustedBinding.metadataSnapshot),
      );

    if (
      privateEnforcement.decision !== "ALLOW" ||
      privateMetadata.action !== "tool.execute" ||
      privateMetadata.canonicalTool !== prepared.name ||
      privateMetadata.traceId !== privateEnforcement.traceId ||
      privateMetadata.decisionId !== privateEnforcement.decisionId ||
      privateMetadata.executionId !== privateEnforcement.executionId ||
      privateMetadata.evidenceId !== privateEnforcement.evidenceId ||
      !isDeepStrictEqual(
        privateEnforcement.continuitySeal ?? null,
        privateMetadata.continuitySeal ?? null,
      )
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Trusted enforcement result and metadata binding are inconsistent.",
      );
    }

    // The public receipt gets a separate deeply frozen copy.
    const publicEnforcement =
      deepFreezeSnapshot(
        structuredClone(privateEnforcement),
      ) as EnforcementResult;

    const receipt: ToolAuthorizationReceipt = Object.freeze({
      authorizationId: crypto.randomUUID(),
      agentId: prepared.agentId,
      tool: prepared.name,
      action: "tool.execute" as const,
      enforcement: publicEnforcement,
      ...(publicEnforcement.continuitySeal
        ? { continuitySeal: publicEnforcement.continuitySeal }
        : {}),
      marker: TOOL_AUTHORIZATION_MARKER,
    });

    TOOL_AUTHORIZATION_BINDINGS.set(receipt, {
      agentId: prepared.agentId,
      name: prepared.name,
      inputSnapshot: deepFreezeSnapshot(
        structuredClone(prepared.inputSnapshot),
      ),
      tool: prepared.tool,
      handler: prepared.tool.execute,
      metadataSnapshot: privateMetadata,
      enforcement: privateEnforcement,
      gate: prepared.gate,
    });

    return receipt;
  }

  async authorize(
    agentId: string,
    name: string,
    input: unknown,
    metadata?: Record<string, unknown>,
  ): Promise<ToolAuthorizationReceipt> {

    const prepared =
      this.prepareAuthorization(agentId, name, input, metadata);

    const enforcement = await prepared.gate.enforce({
      agentId: prepared.agentId,
      resourceType: "tool",
      tool: prepared.name,
      action: "tool.execute",
      input: structuredClone(prepared.inputSnapshot),
      metadata: structuredClone(prepared.metadataSnapshot),
    });

    const trustedBinding =
      prepared.gate.getTrustedExecutionBinding(enforcement);
    if (!trustedBinding) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Enforcement result has no trusted metadata binding.",
      );
    }
    if (trustedBinding.result.decision !== "ALLOW") {
      throw new Error(
        `[ENFORCEMENT:${trustedBinding.result.decision}] ${trustedBinding.result.reason}`,
      );
    }

    return this.createAuthorizationReceipt(prepared, trustedBinding);
  }

  private validateAuthorization(
    receipt: ToolAuthorizationReceipt,
    name: string,
    context: ToolContext,
    input: unknown,
  ): ToolAuthorizationBinding {

    if (
      !receipt ||
      receipt.marker !== TOOL_AUTHORIZATION_MARKER
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Invalid tool authorization receipt.",
      );
    }

    if (
      receipt.agentId !== context.agentId ||
      receipt.tool !== name ||
      receipt.action !== "tool.execute"
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Tool authorization scope mismatch.",
      );
    }

const binding =
      TOOL_AUTHORIZATION_BINDINGS.get(receipt);

    if (!binding) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Authorization receipt has no trusted execution binding.",
      );
    }

    if (
      binding.agentId !== context.agentId ||
      binding.name !== name
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Private authorization binding scope mismatch.",
      );
    }

    if (binding.gate !== this.#enforcement) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Enforcement boundary changed after authorization.",
      );
    }

    if (binding.enforcement.decision !== "ALLOW") {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Trusted tool authorization is not ALLOW.",
      );
    }

    if (
      this.#consumedAuthorizations.has(
        receipt.authorizationId,
      )
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Tool authorization has already been consumed.",
      );
    }

    // Burn a genuine receipt on every execution attempt, including
    // attempts that supply a substituted input.
    this.#consumedAuthorizations.add(
      receipt.authorizationId,
    );

    if (
      !isDeepStrictEqual(
        binding.inputSnapshot,
        input,
      )
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Execution input does not match the authorized input snapshot.",
      );
    }

    const currentTool =
      this.#tools.get(name);

    if (
      currentTool !== binding.tool ||
      currentTool.execute !== binding.handler
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Registered tool handler changed after authorization.",
      );
    }

    return binding;
  }

  async execute(
    name: string,
    input: unknown,
    context: ToolContext,
    authorization?: symbol,
    receipt?: ToolAuthorizationReceipt,
  ): Promise<unknown> {

    if (authorization !== this.#executionToken) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Direct ToolRegistry execution is not authorized.",
      );
    }
    if (!receipt) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] ToolRegistry execution requires a prior authorization receipt.",
      );
    }

    const authorizationBinding = this.validateAuthorization(
      receipt,
      name,
      context,
      input,
    );

    const enforcement = authorizationBinding.enforcement;
    const executionInput =
      deepFreezeSnapshot(
        structuredClone(authorizationBinding.inputSnapshot),
      );
    const trustedMetadata =
      structuredClone(authorizationBinding.metadataSnapshot);

    const executionContext: ToolContext = {
      ...context,
      traceId: enforcement.traceId,
      decisionId: enforcement.decisionId,
      executionId: enforcement.executionId,
      evidenceId: enforcement.evidenceId,
      metadata: structuredClone(trustedMetadata),
    };

    const seal = enforcement.continuitySeal;
    let trustedWorkspaceId: string | undefined;

    if (seal) {
      const workspace = trustedMetadata.authorityWorkspaceId;
      if (typeof workspace !== "string" || workspace.trim().length === 0) {
        throw new Error(
          "[CONTINUITY_SEAL:BLOCK] Trusted workspace identity is unavailable for tool execution.",
        );
      }
      trustedWorkspaceId = workspace;

      const verification =
        authorizationBinding.gate.verifyContinuitySealForExecution(
          {
            agentId: context.agentId,
            resourceType: "tool",
            tool: name,
            action: "tool.execute",
            input: executionInput,
            metadata: structuredClone(trustedMetadata),
          },
          seal,
        );

      if (!verification.valid) {
        throw new Error(
          `[CONTINUITY_SEAL:BLOCK] ${verification.reason}`,
        );
      }
    }

    // The exact registered handler and the private authorized input are used.
    const result = await authorizationBinding.tool.execute(
      executionInput,
      executionContext,
    );

    if (seal) {
      const verification =
        authorizationBinding.gate.reconcileContinuityEffect(
          seal,
          {
            workspaceId: trustedWorkspaceId!,
            agentId: authorizationBinding.agentId,
            executionId: enforcement.executionId,
            action: "tool.execute",
            resource: name,
            tool: name,
            input: executionInput,
          },
        );

      if (!verification.valid) {
        throw new Error(
          `[CONTINUITY_SEAL:VIOLATION] ${verification.reason ?? "Tool effect did not reconcile with Continuity Seal."}`,
        );
      }
    }

    return result;
  }

  async executeDelegated(
    name: string,
    input: unknown,
    context: ToolContext,
    parentAgentId: string,
    childAgentId: string,
    delegationCapabilityId: string,
    delegationResource?: string,
  ): Promise<unknown> {
    if (!this.#delegationAuthority) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Delegation authority is not configured.",
      );
    }

    if (context.agentId !== childAgentId) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Delegated child identity does not match execution context.",
      );
    }

    const capability =
      this.#delegationAuthority.consume(
        delegationCapabilityId,
        parentAgentId,
        childAgentId,
        "tool.execute",
        delegationResource ?? name,
      );

    if (
      capability.childAgentId !==
      context.agentId
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Delegated child identity mismatch.",
      );
    }

    if (
      capability.scope.tools &&
      !capability.scope.tools.includes(name)
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Delegated capability does not authorize requested tool.",
      );
    }

    const receipt =
      await this.authorize(
        context.agentId,
        name,
        input,
        {
          delegated: true,
          parentAgentId,
          childAgentId,
          delegationCapabilityId,
        },
      );

    return this.execute(
      name,
      input,
      context,
      this.#executionToken,
      receipt,
    );
  }

  /**
   * 4.0-12 contract-governed delegated execution.
   *
   * Contract evaluation is completed before any tool side effect.
   *
   * BLOCK / ESCALATE:
   *   zero tool execution.
   *
   * ALLOW:
   *   normal EnforcementGate authorization remains the
   *   second runtime control boundary.
   */
  /**
   * 4.0-12 contract-governed delegated execution.
   *
   * All contract decisions cross EnforcementGate.
   * The ToolRegistry performs no independent contract rejection
   * that would bypass the canonical evidence/audit path.
   */
  /**
   * Contract-governed delegated execution.
   * Contract evaluation and normal runtime governance produce one
   * final EnforcementResult, which is used directly for the receipt.
   * Caller graph and clock parameters remain for API compatibility;
   * EnforcementGate uses canonical RuntimeContext and runtime time.
   */
  async executeContractDelegated(
    name: string,
    input: unknown,
    context: ToolContext,
    contract: DelegationAuthorityContract,
    graph: CompromiseSimulationGraph,
    taskId: string,
    now: string = new Date().toISOString(),
  ): Promise<unknown> {

    const prepared = this.prepareAuthorization(
      context.agentId,
      name,
      input,
      {
        ...(context.metadata ?? {}),
        delegated: true,
        delegationTaskId: taskId,
      },
    );

    const enforcement =
      await prepared.gate.enforceDelegationContract({
        contract,
        // Compatibility-only caller values; the gate ignores graph/time.
        graph,
        workspaceId: contract.workspaceId,
        taskId,
        now,
        request: {
          agentId: prepared.agentId,
          resourceType: "tool",
          tool: prepared.name,
          action: "tool.execute",
          input: structuredClone(prepared.inputSnapshot),
          metadata: structuredClone(prepared.metadataSnapshot),
        },
      });

    const trustedBinding =
      prepared.gate.getTrustedExecutionBinding(enforcement);
    if (!trustedBinding) {
      throw new Error(
        "[DELEGATION_CONTRACT:BLOCK] Enforcement result has no trusted execution binding.",
      );
    }
    if (trustedBinding.result.decision !== "ALLOW") {
      throw new Error(
        `[DELEGATION_CONTRACT:${trustedBinding.result.decision}] ${trustedBinding.result.reason}`,
      );
    }

    const receipt =
      this.createAuthorizationReceipt(prepared, trustedBinding);

    // Deliberately no second authorize() call.
    return this.execute(
      name,
      prepared.inputSnapshot,
      context,
      this.#executionToken,
      receipt,
    );
  }

  list() {
    return Array.from(
      this.#tools.values(),
    ).map(
      (tool) => ({
        name: tool.name,
        description: tool.description,
      }),
    );
  }
}
