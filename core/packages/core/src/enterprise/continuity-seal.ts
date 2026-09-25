import { createHash } from "node:crypto";

import type {
  TransitiveAuthorityResult,
} from "./transitive-authority";

export type ContinuitySealCode =
  | "VALID"
  | "INVALID_SEAL"
  | "SEAL_TAMPERED"
  | "WORKSPACE_MISMATCH"
  | "AGENT_MISMATCH"
  | "EXECUTION_ID_MISMATCH"
  | "ACTION_MISMATCH"
  | "RESOURCE_MISMATCH"
  | "TOOL_MISMATCH"
  | "INPUT_MISMATCH"
  | "AUTHORITY_CHANGED"
  | "AUTHORITY_DRIFT"
  | "CONTAINMENT_ACTIVE";

export interface ContinuitySealInput {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly executionId: string;
  readonly action: string;
  readonly resource: string;
  readonly tool: string;
  readonly input: unknown;

  readonly transitiveAuthority:
    TransitiveAuthorityResult;

  readonly authorityDriftSeverity:
    string;

  readonly containmentAction?:
    string;
}

export type ContinuitySealCurrentState =
  ContinuitySealInput;

export interface ContinuitySealEffectState {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly executionId: string;
  readonly action: string;
  readonly resource: string;
  readonly tool: string;
  readonly input: unknown;
}

export interface ContinuitySeal {
  readonly version: "1";

  readonly sealId: string;

  readonly sealHash: string;

  readonly workspaceId: string;
  readonly agentId: string;
  readonly executionId: string;
  readonly action: string;
  readonly resource: string;
  readonly tool: string;

  readonly input: unknown;

  readonly transitiveAuthority:
    TransitiveAuthorityResult;

  readonly authorityDriftSeverity:
    string;

  readonly containmentAction?:
    string;
}

export interface ContinuitySealVerification {
  readonly valid: boolean;
  readonly code: ContinuitySealCode;
  readonly reason: string;
  readonly sealId: string;
}

function assertNonEmpty(
  value: string,
  field: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${field} must be non-empty`,
    );
  }

  return value.trim();
}

function canonicalize(
  value: unknown,
): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "undefined") {
    return null;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(
      (item) =>
        canonicalize(item),
    );
  }

  if (
    typeof value === "object"
  ) {
    const record =
      value as Record<string, unknown>;

    const normalized:
      Record<string, unknown> = {};

    for (
      const key of Object.keys(record).sort(
        (a, b) =>
          a.localeCompare(b),
      )
    ) {
      normalized[key] =
        canonicalize(
          record[key],
        );
    }

    return normalized;
  }

  return String(value);
}

function canonicalJson(
  value: unknown,
): string {
  return JSON.stringify(
    canonicalize(value),
  );
}

function sha256(
  value: string,
): string {
  return createHash("sha256")
    .update(
      value,
      "utf8",
    )
    .digest("hex");
}

function authorityFingerprint(
  authority:
    TransitiveAuthorityResult,
): string {
  return sha256(
    canonicalJson(
      authority,
    ),
  );
}

function sealPayload(
  seal:
    Omit<
      ContinuitySeal,
      "sealId" | "sealHash"
    >,
): unknown {
  return {
    version:
      seal.version,

    workspaceId:
      seal.workspaceId,

    agentId:
      seal.agentId,

    executionId:
      seal.executionId,

    action:
      seal.action,

    resource:
      seal.resource,

    tool:
      seal.tool,

    input:
      canonicalize(
        seal.input,
      ),

    transitiveAuthority:
      canonicalize(
        seal.transitiveAuthority,
      ),

    authorityDriftSeverity:
      seal.authorityDriftSeverity,

    containmentAction:
      seal.containmentAction ??
      null,
  };
}

function sealHashFor(
  seal:
    Omit<
      ContinuitySeal,
      "sealId" | "sealHash"
    >,
): string {
  return sha256(
    canonicalJson(
      sealPayload(
        seal,
      ),
    ),
  );
}

function sealIdFor(
  sealHash: string,
): string {
  return `aseal_${sealHash}`;
}

function deepFreeze<T>(
  value: T,
): T {
  if (
    value !== null &&
    typeof value === "object"
  ) {
    Object.freeze(value);

    for (
      const child of Object.values(
        value as Record<string, unknown>,
      )
    ) {
      if (
        child !== null &&
        typeof child === "object" &&
        !Object.isFrozen(child)
      ) {
        deepFreeze(child);
      }
    }
  }

  return value;
}

function normalizeInput(
  input:
    ContinuitySealInput,
): Omit<
  ContinuitySeal,
  "sealId" | "sealHash"
> {
  const workspaceId =
    assertNonEmpty(
      input.workspaceId,
      "workspaceId",
    );

  const agentId =
    assertNonEmpty(
      input.agentId,
      "agentId",
    );

  const executionId =
    assertNonEmpty(
      input.executionId,
      "executionId",
    );

  const action =
    assertNonEmpty(
      input.action,
      "action",
    );

  const resource =
    assertNonEmpty(
      input.resource,
      "resource",
    );

  const tool =
    assertNonEmpty(
      input.tool,
      "tool",
    );

  if (
    input.transitiveAuthority
      .workspaceId !==
    workspaceId
  ) {
    throw new Error(
      "Continuity Seal workspace mismatch.",
    );
  }

  if (
    input.transitiveAuthority
      .sourceAgentId !==
    agentId
  ) {
    throw new Error(
      "Continuity Seal agent mismatch.",
    );
  }

  if (
    input.authorityDriftSeverity !==
      "NONE"
  ) {
    throw new Error(
      "Continuity Seal cannot be created while authority drift is active.",
    );
  }

  if (
    input.containmentAction
  ) {
    throw new Error(
      "Continuity Seal cannot be created while containment is active.",
    );
  }

  return {
    version: "1",

    workspaceId,
    agentId,
    executionId,
    action,
    resource,
    tool,

    input:
      canonicalize(
        input.input,
      ),

    transitiveAuthority:
      canonicalize(
        input.transitiveAuthority,
      ) as TransitiveAuthorityResult,

    authorityDriftSeverity:
      input.authorityDriftSeverity,
  };
}

function verifyIdentity(
  seal:
    ContinuitySeal,
  current:
    ContinuitySealCurrentState,
): ContinuitySealVerification {
  if (
    seal.workspaceId !==
    current.workspaceId
  ) {
    return {
      valid: false,
      code:
        "WORKSPACE_MISMATCH",
      reason:
        "Workspace identity does not match the sealed execution.",
      sealId:
        seal.sealId,
    };
  }

  if (
    seal.agentId !==
    current.agentId
  ) {
    return {
      valid: false,
      code:
        "AGENT_MISMATCH",
      reason:
        "Agent identity does not match the sealed execution.",
      sealId:
        seal.sealId,
    };
  }

  if (
    seal.executionId !==
    current.executionId
  ) {
    return {
      valid: false,
      code:
        "EXECUTION_ID_MISMATCH",
      reason:
        "Execution identity does not match the sealed execution.",
      sealId:
        seal.sealId,
    };
  }

  if (
    seal.action !==
    current.action
  ) {
    return {
      valid: false,
      code:
        "ACTION_MISMATCH",
      reason:
        "Action does not match the sealed execution.",
      sealId:
        seal.sealId,
    };
  }

  if (
    seal.resource !==
    current.resource
  ) {
    return {
      valid: false,
      code:
        "RESOURCE_MISMATCH",
      reason:
        "Resource does not match the sealed execution.",
      sealId:
        seal.sealId,
    };
  }

  if (
    seal.tool !==
    current.tool
  ) {
    return {
      valid: false,
      code:
        "TOOL_MISMATCH",
      reason:
        "Tool does not match the sealed execution.",
      sealId:
        seal.sealId,
    };
  }

  if (
    canonicalJson(
      seal.input,
    ) !==
    canonicalJson(
      current.input,
    )
  ) {
    return {
      valid: false,
      code:
        "INPUT_MISMATCH",
      reason:
        "Exact execution input does not match the sealed execution.",
      sealId:
        seal.sealId,
    };
  }

  return {
    valid: true,
    code:
      "VALID",
    reason:
      "Execution identity matches the Continuity Seal.",
    sealId:
      seal.sealId,
  };
}

export class ContinuitySealEngine {

  public create(
    input:
      ContinuitySealInput,
  ): ContinuitySeal {
    const normalized =
      normalizeInput(
        input,
      );

    const hash =
      sealHashFor(
        normalized,
      );

    const seal:
      ContinuitySeal = {
      ...normalized,

      sealHash:
        hash,

      sealId:
        sealIdFor(
          hash,
        ),
    };

    return deepFreeze(
      structuredClone(
        seal,
      ),
    );
  }

  public verify(
    seal:
      ContinuitySeal,
    current:
      ContinuitySealCurrentState,
  ): ContinuitySealVerification {

    const expectedHash =
      sealHashFor(
        {
          version:
            seal.version,

          workspaceId:
            seal.workspaceId,

          agentId:
            seal.agentId,

          executionId:
            seal.executionId,

          action:
            seal.action,

          resource:
            seal.resource,

          tool:
            seal.tool,

          input:
            seal.input,

          transitiveAuthority:
            seal.transitiveAuthority,

          authorityDriftSeverity:
            seal.authorityDriftSeverity,

          ...(seal.containmentAction
            ? {
                containmentAction:
                  seal.containmentAction,
              }
            : {}),
        },
      );

    if (
      expectedHash !==
        seal.sealHash ||
      sealIdFor(
        expectedHash,
      ) !==
        seal.sealId
    ) {
      return {
        valid: false,
        code:
          "SEAL_TAMPERED",
        reason:
          "Continuity Seal integrity hash does not match the sealed payload.",
        sealId:
          seal.sealId,
      };
    }

    const identity =
      verifyIdentity(
        seal,
        current,
      );

    if (
      !identity.valid
    ) {
      return identity;
    }

    if (
      current.authorityDriftSeverity !==
      "NONE"
    ) {
      return {
        valid: false,
        code:
          "AUTHORITY_DRIFT",
        reason:
          "Authority drift became active after the execution was sealed.",
        sealId:
          seal.sealId,
      };
    }

    if (
      current.containmentAction
    ) {
      return {
        valid: false,
        code:
          "CONTAINMENT_ACTIVE",
        reason:
          "Execution containment became active after the execution was sealed.",
        sealId:
          seal.sealId,
      };
    }

    const currentAuthority =
      authorityFingerprint(
        current.transitiveAuthority,
      );

    const sealedAuthority =
      authorityFingerprint(
        seal.transitiveAuthority,
      );

    if (
      currentAuthority !==
      sealedAuthority
    ) {
      return {
        valid: false,
        code:
          "AUTHORITY_CHANGED",
        reason:
          "Effective authority changed after the execution was sealed.",
        sealId:
          seal.sealId,
      };
    }

    return {
      valid: true,
      code:
        "VALID",
      reason:
        "Continuity Seal is valid for the exact execution and current authority state.",
      sealId:
        seal.sealId,
    };
  }

  public reconcileEffect(
    seal:
      ContinuitySeal,
    effect:
      ContinuitySealEffectState,
  ): {
    readonly valid: boolean;
    readonly code: ContinuitySealCode;
    readonly reason: string;
  } {

    const result =
      this.verify(
        seal,
        {
          workspaceId:
            effect.workspaceId,

          agentId:
            effect.agentId,

          executionId:
            effect.executionId,

          action:
            effect.action,

          resource:
            effect.resource,

          tool:
            effect.tool,

          input:
            effect.input,

          transitiveAuthority:
            seal.transitiveAuthority,

          authorityDriftSeverity:
            seal.authorityDriftSeverity,

          ...(seal.containmentAction
            ? {
                containmentAction:
                  seal.containmentAction,
              }
            : {}),
        },
      );

    return {
      valid:
        result.valid,

      code:
        result.code,

      reason:
        result.reason,
    };
  }
}