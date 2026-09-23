import { createHash } from "node:crypto";

import {
  CompromiseSimulationGraph,
} from "./compromise-simulation";

import {
  TransitiveAuthorityEngine,
} from "./transitive-authority";

export type DelegationAuthorityContractDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type DelegationAuthorityReasonCode =
  | "HASH_MISMATCH"
  | "WORKSPACE_MISMATCH"
  | "TASK_MISMATCH"
  | "NOT_ACTIVE"
  | "EXPIRED"
  | "GRANT_OUTSIDE_PARENT_AUTHORITY"
  | "CHILD_AUTHORITY_EXCEEDS_SCOPE"
  | "FURTHER_DELEGATION_FORBIDDEN"
  | "DELEGATION_DEPTH_EXCEEDED"
  | "HUMAN_APPROVAL_REQUIRED"
  | "INVALID_GRAPH";

export interface DelegationAuthorityScope {
  readonly capabilityIds: readonly string[];
  readonly toolIds: readonly string[];
  readonly providerIds: readonly string[];
  readonly resourceIds: readonly string[];
}

export interface DelegationAuthorityContract {
  readonly workspaceId: string;
  readonly contractId: string;

  readonly issuerAgentId: string;
  readonly delegateAgentId: string;

  readonly taskId: string;

  readonly scope: DelegationAuthorityScope;

  readonly issuedAt: string;
  readonly expiresAt: string;

  readonly maxDelegationDepth: number;
  readonly allowFurtherDelegation: boolean;

  readonly requiresHumanApproval: boolean;

  readonly contractHash: string;
}

export interface DelegationAuthorityEvaluation {
  readonly workspaceId: string;
  readonly contractId: string;

  readonly decision: DelegationAuthorityContractDecision;

  readonly reasonCodes: readonly DelegationAuthorityReasonCode[];
  readonly reasons: readonly string[];

  readonly parentEffectiveAuthority: DelegationAuthorityScope;
  readonly childEffectiveAuthority: DelegationAuthorityScope;

  readonly scopeOutsideParentAuthority: DelegationAuthorityScope;
  readonly unauthorizedChildAuthority: DelegationAuthorityScope;

  readonly observedDelegationDepth: number;
}

const RELEVANT_TYPES = new Set([
  "capability",
  "tool",
  "provider",
  "resource",
]);

function emptyScope(): DelegationAuthorityScope {
  return {
    capabilityIds: [],
    toolIds: [],
    providerIds: [],
    resourceIds: [],
  };
}

function normalizeIds(
  values: readonly string[] | undefined,
  expectedPrefix: string,
): string[] {
  const normalized = [
    ...new Set(
      (values ?? [])
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  for (const value of normalized) {
    if (!value.startsWith(`${expectedPrefix}:`)) {
      throw new Error(
        `${expectedPrefix} scope must contain ${expectedPrefix}: node ids`,
      );
    }
  }

  return normalized;
}

function normalizeScope(
  scope: Partial<DelegationAuthorityScope>,
): DelegationAuthorityScope {
  return {
    capabilityIds: normalizeIds(
      scope.capabilityIds,
      "capability",
    ),
    toolIds: normalizeIds(
      scope.toolIds,
      "tool",
    ),
    providerIds: normalizeIds(
      scope.providerIds,
      "provider",
    ),
    resourceIds: normalizeIds(
      scope.resourceIds,
      "resource",
    ),
  };
}

function canonicalContractPayload(
  contract: Omit<
    DelegationAuthorityContract,
    "contractHash"
  >,
): string {
  return JSON.stringify({
    workspaceId: contract.workspaceId,
    contractId: contract.contractId,
    issuerAgentId: contract.issuerAgentId,
    delegateAgentId: contract.delegateAgentId,
    taskId: contract.taskId,
    scope: normalizeScope(contract.scope),
    issuedAt: contract.issuedAt,
    expiresAt: contract.expiresAt,
    maxDelegationDepth: contract.maxDelegationDepth,
    allowFurtherDelegation:
      contract.allowFurtherDelegation,
    requiresHumanApproval:
      contract.requiresHumanApproval,
  });
}

function hashContract(
  contract: Omit<
    DelegationAuthorityContract,
    "contractHash"
  >,
): string {
  return createHash("sha256")
    .update(
      canonicalContractPayload(contract),
      "utf8",
    )
    .digest("hex");
}

function scopeContains(
  container: DelegationAuthorityScope,
  candidate: DelegationAuthorityScope,
): boolean {
  const containsAll = (
    available: readonly string[],
    requested: readonly string[],
  ): boolean => {
    const set = new Set(available);

    return requested.every((id) =>
      set.has(id),
    );
  };

  return (
    containsAll(
      container.capabilityIds,
      candidate.capabilityIds,
    ) &&
    containsAll(
      container.toolIds,
      candidate.toolIds,
    ) &&
    containsAll(
      container.providerIds,
      candidate.providerIds,
    ) &&
    containsAll(
      container.resourceIds,
      candidate.resourceIds,
    )
  );
}

function scopeDifference(
  left: DelegationAuthorityScope,
  right: DelegationAuthorityScope,
): DelegationAuthorityScope {
  const difference = (
    source: readonly string[],
    excluded: readonly string[],
  ): string[] => {
    const excludedSet = new Set(excluded);

    return source
      .filter((id) => !excludedSet.has(id))
      .sort((a, b) =>
        a.localeCompare(b),
      );
  };

  return {
    capabilityIds: difference(
      left.capabilityIds,
      right.capabilityIds,
    ),
    toolIds: difference(
      left.toolIds,
      right.toolIds,
    ),
    providerIds: difference(
      left.providerIds,
      right.providerIds,
    ),
    resourceIds: difference(
      left.resourceIds,
      right.resourceIds,
    ),
  };
}

function addRelevantNode(
  scope: {
    capabilityIds: string[];
    toolIds: string[];
    providerIds: string[];
    resourceIds: string[];
  },
  node: {
    id: string;
    type: string;
  },
): void {
  if (!RELEVANT_TYPES.has(node.type)) {
    return;
  }

  if (node.type === "capability") {
    scope.capabilityIds.push(node.id);
  }

  if (node.type === "tool") {
    scope.toolIds.push(node.id);
  }

  if (node.type === "provider") {
    scope.providerIds.push(node.id);
  }

  if (node.type === "resource") {
    scope.resourceIds.push(node.id);
  }
}

function effectiveAuthorityForAgent(
  graph: CompromiseSimulationGraph,
  workspaceId: string,
  agentId: string,
): DelegationAuthorityScope {
  const nodes = new Map(
    graph.nodes.map((node) => [
      node.id,
      node,
    ]),
  );

  const agentNodeId = `agent:${agentId}`;

  const agent = nodes.get(agentNodeId);

  if (
    !agent ||
    agent.type !== "agent" ||
    agent.workspaceId !== workspaceId
  ) {
    throw new Error(
      `agent ${agentId} not found in workspace`,
    );
  }

  const result = {
    capabilityIds: [] as string[],
    toolIds: [] as string[],
    providerIds: [] as string[],
    resourceIds: [] as string[],
  };

  const queue = [agentNodeId];
  const visited = new Set<string>([
    agentNodeId,
  ]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    const outgoing = graph.edges
      .filter(
        (edge) =>
          edge.workspaceId === workspaceId &&
          edge.from === current &&
          edge.type !== "DELEGATES_TO",
      )
      .sort((a, b) =>
        a.id.localeCompare(b.id),
      );

    for (const edge of outgoing) {
      const target = nodes.get(edge.to);

      if (!target) {
        throw new Error(
          `authority edge ${edge.id} references unknown node`,
        );
      }

      if (
        target.workspaceId !== workspaceId
      ) {
        throw new Error(
          "cross-workspace authority edge detected",
        );
      }

      addRelevantNode(result, target);

      if (!visited.has(target.id)) {
        visited.add(target.id);
        queue.push(target.id);
      }
    }
  }

  return normalizeScope(result);
}

function issueContract(
  input: {
    workspaceId: string;
    contractId: string;
    issuerAgentId: string;
    delegateAgentId: string;
    taskId: string;
    scope: DelegationAuthorityScope;
    issuedAt: string;
    expiresAt: string;
    maxDelegationDepth: number;
    allowFurtherDelegation?: boolean;
    requiresHumanApproval?: boolean;
  },
): DelegationAuthorityContract {
  const workspaceId =
    input.workspaceId.trim();
  const contractId =
    input.contractId.trim();
  const issuerAgentId =
    input.issuerAgentId.trim();
  const delegateAgentId =
    input.delegateAgentId.trim();
  const taskId =
    input.taskId.trim();

  if (!workspaceId) {
    throw new Error(
      "workspaceId is required",
    );
  }

  if (!contractId) {
    throw new Error(
      "contractId is required",
    );
  }

  if (!issuerAgentId) {
    throw new Error(
      "issuerAgentId is required",
    );
  }

  if (!delegateAgentId) {
    throw new Error(
      "delegateAgentId is required",
    );
  }

  if (!taskId) {
    throw new Error(
      "taskId is required",
    );
  }

  if (
    !Number.isInteger(
      input.maxDelegationDepth,
    ) ||
    input.maxDelegationDepth <= 0
  ) {
    throw new Error(
      "maxDelegationDepth must be a positive integer",
    );
  }

  const issuedAt =
    new Date(input.issuedAt);
  const expiresAt =
    new Date(input.expiresAt);

  if (
    Number.isNaN(issuedAt.getTime()) ||
    Number.isNaN(expiresAt.getTime())
  ) {
    throw new Error(
      "issuedAt and expiresAt must be valid timestamps",
    );
  }

  if (
    expiresAt.getTime() <=
    issuedAt.getTime()
  ) {
    throw new Error(
      "expiresAt must be later than issuedAt",
    );
  }

  const contractWithoutHash = {
    workspaceId,
    contractId,
    issuerAgentId,
    delegateAgentId,
    taskId,
    scope: normalizeScope(input.scope),
    issuedAt:
      issuedAt.toISOString(),
    expiresAt:
      expiresAt.toISOString(),
    maxDelegationDepth:
      input.maxDelegationDepth,
    allowFurtherDelegation:
      input.allowFurtherDelegation ??
      false,
    requiresHumanApproval:
      input.requiresHumanApproval ??
      false,
  };

  return {
    ...contractWithoutHash,
    contractHash:
      hashContract(
        contractWithoutHash,
      ),
  };
}

export class DelegationAuthorityContractEngine {
  public issue(
    input: {
      workspaceId: string;
      contractId: string;
      issuerAgentId: string;
      delegateAgentId: string;
      taskId: string;
      scope: DelegationAuthorityScope;
      issuedAt: string;
      expiresAt: string;
      maxDelegationDepth: number;
      allowFurtherDelegation?: boolean;
      requiresHumanApproval?: boolean;
    },
  ): DelegationAuthorityContract {
    return issueContract(input);
  }

  public evaluate(input: {
    contract: DelegationAuthorityContract;
    graph: CompromiseSimulationGraph;
    workspaceId: string;
    taskId: string;
    now: string;
  }): DelegationAuthorityEvaluation {
    const contract =
      input.contract;

    const baseEvaluation = {
      workspaceId:
        input.workspaceId,
      contractId:
        contract.contractId,
    };

    const normalizedScope =
      normalizeScope(
        contract.scope,
      );

    const contractWithoutHash = {
      workspaceId:
        contract.workspaceId,
      contractId:
        contract.contractId,
      issuerAgentId:
        contract.issuerAgentId,
      delegateAgentId:
        contract.delegateAgentId,
      taskId:
        contract.taskId,
      scope:
        normalizedScope,
      issuedAt:
        new Date(
          contract.issuedAt,
        ).toISOString(),
      expiresAt:
        new Date(
          contract.expiresAt,
        ).toISOString(),
      maxDelegationDepth:
        contract.maxDelegationDepth,
      allowFurtherDelegation:
        contract.allowFurtherDelegation,
      requiresHumanApproval:
        contract.requiresHumanApproval,
    };

    const reasonCodes: DelegationAuthorityReasonCode[] =
      [];
    const reasons: string[] = [];

    const empty = emptyScope();

    const block = (
      code: DelegationAuthorityReasonCode,
      reason: string,
      overrides?: Partial<
        DelegationAuthorityEvaluation
      >,
    ): DelegationAuthorityEvaluation => {
      reasonCodes.push(code);
      reasons.push(reason);

      return {
        ...baseEvaluation,
        decision: "BLOCK",
        reasonCodes: [
          ...reasonCodes,
        ],
        reasons: [
          ...reasons,
        ],
        parentEffectiveAuthority:
          overrides
            ?.parentEffectiveAuthority ??
          empty,
        childEffectiveAuthority:
          overrides
            ?.childEffectiveAuthority ??
          empty,
        scopeOutsideParentAuthority:
          overrides
            ?.scopeOutsideParentAuthority ??
          empty,
        unauthorizedChildAuthority:
          overrides
            ?.unauthorizedChildAuthority ??
          empty,
        observedDelegationDepth:
          overrides
            ?.observedDelegationDepth ??
          0,
      };
    };

    if (
      contract.workspaceId !==
      input.workspaceId
    ) {
      return block(
        "WORKSPACE_MISMATCH",
        "contract workspace does not match evaluation workspace",
      );
    }

    const computedHash =
      hashContract(
        contractWithoutHash,
      );

    if (
      computedHash !==
      contract.contractHash
    ) {
      return block(
        "HASH_MISMATCH",
        "contract hash does not match the canonical contract payload",
      );
    }

    if (
      contract.taskId !==
      input.taskId
    ) {
      return block(
        "TASK_MISMATCH",
        "contract task binding does not match the evaluation task",
      );
    }

    const now =
      new Date(input.now);
    const issuedAt =
      new Date(contract.issuedAt);
    const expiresAt =
      new Date(contract.expiresAt);

    if (
      Number.isNaN(now.getTime()) ||
      Number.isNaN(
        issuedAt.getTime(),
      ) ||
      Number.isNaN(
        expiresAt.getTime(),
      )
    ) {
      return block(
        "NOT_ACTIVE",
        "contract timestamps are invalid",
      );
    }

    if (
      now.getTime() <
      issuedAt.getTime()
    ) {
      return block(
        "NOT_ACTIVE",
        "contract is not active yet",
      );
    }

    if (
      now.getTime() >=
      expiresAt.getTime()
    ) {
      return block(
        "EXPIRED",
        "contract has expired",
      );
    }

    if (
      !Number.isInteger(
        contract.maxDelegationDepth,
      ) ||
      contract.maxDelegationDepth <= 0
    ) {
      return block(
        "DELEGATION_DEPTH_EXCEEDED",
        "contract contains an invalid delegation depth",
      );
    }

    if (
      !Array.isArray(
        input.graph.nodes,
      ) ||
      !Array.isArray(
        input.graph.edges,
      )
    ) {
      return block(
        "INVALID_GRAPH",
        "authority graph is invalid",
      );
    }

    try {
      const parentEffectiveAuthority =
        effectiveAuthorityForAgent(
          input.graph,
          input.workspaceId,
          contract.issuerAgentId,
        );

      const childEffectiveAuthority =
        effectiveAuthorityForAgent(
          input.graph,
          input.workspaceId,
          contract.delegateAgentId,
        );

      const scopeOutsideParentAuthority =
        scopeDifference(
          normalizedScope,
          parentEffectiveAuthority,
        );

      if (
        !scopeContains(
          parentEffectiveAuthority,
          normalizedScope,
        )
      ) {
        return block(
          "GRANT_OUTSIDE_PARENT_AUTHORITY",
          "delegation scope exceeds the issuer agent's effective authority",
          {
            parentEffectiveAuthority,
            childEffectiveAuthority,
            scopeOutsideParentAuthority,
          },
        );
      }

      const unauthorizedChildAuthority =
        scopeDifference(
          childEffectiveAuthority,
          normalizedScope,
        );

      if (
        !scopeContains(
          normalizedScope,
          childEffectiveAuthority,
        )
      ) {
        return block(
          "CHILD_AUTHORITY_EXCEEDS_SCOPE",
          "delegate agent currently holds authority outside the delegation contract scope",
          {
            parentEffectiveAuthority,
            childEffectiveAuthority,
            scopeOutsideParentAuthority,
            unauthorizedChildAuthority,
          },
        );
      }

      const transitive =
        new TransitiveAuthorityEngine()
          .analyze({
            workspaceId:
              input.workspaceId,
            sourceAgentId:
              contract.delegateAgentId,
            graph:
              input.graph,
            maxDelegationDepth:
              Math.max(
                1,
                contract.maxDelegationDepth,
              ),
          });

      if (
        !contract.allowFurtherDelegation &&
        transitive
          .transitivelyReachableAgentIds
          .length > 0
      ) {
        return block(
          "FURTHER_DELEGATION_FORBIDDEN",
          "delegate agent has delegated authority to another agent while further delegation is disabled",
          {
            parentEffectiveAuthority,
            childEffectiveAuthority,
            scopeOutsideParentAuthority,
            unauthorizedChildAuthority,
            observedDelegationDepth:
              transitive.delegationDepth,
          },
        );
      }

      if (
        contract.allowFurtherDelegation &&
        1 + transitive.delegationDepth >
          contract.maxDelegationDepth
      ) {
        return block(
          "DELEGATION_DEPTH_EXCEEDED",
          "delegation chain exceeds the contract maximum depth",
          {
            parentEffectiveAuthority,
            childEffectiveAuthority,
            scopeOutsideParentAuthority,
            unauthorizedChildAuthority,
            observedDelegationDepth:
              transitive.delegationDepth,
          },
        );
      }

      if (
        contract.requiresHumanApproval
      ) {
        reasonCodes.push(
          "HUMAN_APPROVAL_REQUIRED",
        );
        reasons.push(
          "contract requires human approval before delegated execution",
        );

        return {
          ...baseEvaluation,
          decision: "ESCALATE",
          reasonCodes: [
            ...reasonCodes,
          ],
          reasons: [
            ...reasons,
          ],
          parentEffectiveAuthority,
          childEffectiveAuthority,
          scopeOutsideParentAuthority,
          unauthorizedChildAuthority,
          observedDelegationDepth:
            transitive.delegationDepth,
        };
      }

      return {
        ...baseEvaluation,
        decision: "ALLOW",
        reasonCodes: [],
        reasons: [
          "delegation is task-bound, time-valid, non-amplifying and within the configured depth",
        ],
        parentEffectiveAuthority,
        childEffectiveAuthority,
        scopeOutsideParentAuthority,
        unauthorizedChildAuthority,
        observedDelegationDepth:
          transitive.delegationDepth,
      };
    } catch (error) {
      return block(
        "INVALID_GRAPH",
        error instanceof Error
          ? error.message
          : "authority graph evaluation failed",
      );
    }
  }
}