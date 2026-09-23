import { createHash } from "node:crypto";
import { schnorr } from "@noble/curves/secp256k1.js";


export interface ExternalDecisionEvent {
  readonly id: string;
  readonly pubkey: string;
  readonly created_at: number;
  readonly kind: number;
  readonly tags: unknown[];
  readonly content: string;
  readonly sig: string;
}

export interface ExternalDecisionBinding {
  readonly event: ExternalDecisionEvent;
  readonly decisionRef: string;
  readonly actionBindingToolHash: string;
  readonly actionBindingArgsHash: string;
  readonly actionBindingAgentId: string;
}

export interface ExternalDecisionVerificationResult {
  readonly valid: boolean;
  readonly eventIdValid: boolean;
  readonly signatureValid: boolean;
  readonly decisionRefValid: boolean;
  readonly reason: string;
}

export interface ExternalExecutionBindingResult {
  readonly valid: boolean;
  readonly toolHashValid: boolean;
  readonly argsHashValid: boolean;
  readonly agentBindingValid: boolean;
  readonly reason: string;
}

function sha256Hex(
  value: string,
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function sha256Prefixed(
  value: string,
): string {
  return `sha256:${sha256Hex(value)}`;
}

function hexToBytes(
  value: string,
): Uint8Array {
  if (
    typeof value !== "string" ||
    value.length % 2 !== 0 ||
    !/^[0-9a-fA-F]+$/.test(value)
  ) {
    throw new Error(
      "Invalid hexadecimal input.",
    );
  }

  return Uint8Array.from(
    Buffer.from(value, "hex"),
  );
}
function canonicalJson(
  value: unknown,
): string {
  function encode(
    input: unknown,
  ): string {
    if (input === null) {
      return "null";
    }

    if (typeof input === "string") {
      return JSON.stringify(input);
    }

    if (typeof input === "number") {
      if (!Number.isFinite(input)) {
        throw new Error(
          "Canonical JSON does not allow non-finite numbers.",
        );
      }

      return JSON.stringify(input);
    }

    if (typeof input === "boolean") {
      return input ? "true" : "false";
    }

    if (Array.isArray(input)) {
      return `[${input.map(encode).join(",")}]`;
    }

    if (typeof input === "object") {
      const object =
        input as Record<string, unknown>;

      const keys =
        Object.keys(object)
          .sort();

      return `{${keys
        .map(
          key =>
            `${JSON.stringify(key)}:${encode(object[key])}`,
        )
        .join(",")}}`;
    }

    throw new Error(
      `Unsupported canonical JSON value type: ${typeof input}`,
    );
  }

  return encode(value);
}

function recomputeNostrEventId(
  event: ExternalDecisionEvent,
): string {
  const serialized =
    JSON.stringify([
      0,
      event.pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content,
    ]);

  return sha256Hex(serialized);
}

function recomputeDecisionRef(
  content: Record<string, unknown>,
): string | null {
  const fields =
    content.decision_ref_preimage_fields;

  if (!Array.isArray(fields)) {
    return null;
  }

  const preimage: Record<string, unknown> = {};

  for (const field of fields) {
    if (typeof field !== "string") {
      return null;
    }

    if (!(field in content)) {
      return null;
    }

    preimage[field] =
      content[field];
  }

  return sha256Prefixed(
    canonicalJson(preimage),
  );
}

export function verifyExternalDecision(
  binding: ExternalDecisionBinding,
): ExternalDecisionVerificationResult {
  const event =
    binding.event;

  let eventIdValid = false;
  let signatureValid = false;
  let decisionRefValid = false;

  try {
    const recomputedId =
      recomputeNostrEventId(event);

    eventIdValid =
      recomputedId === event.id;

    if (!eventIdValid) {
      return {
        valid: false,
        eventIdValid: false,
        signatureValid: false,
        decisionRefValid: false,
        reason:
          "NIP-01 event id recomputation failed.",
      };
    }

    signatureValid =
      schnorr.verify(
        hexToBytes(event.sig),
        hexToBytes(event.id),
        hexToBytes(event.pubkey),
      );

    if (!signatureValid) {
      return {
        valid: false,
        eventIdValid: true,
        signatureValid: false,
        decisionRefValid: false,
        reason:
          "Schnorr signature verification failed.",
      };
    }

    const content =
      JSON.parse(event.content) as Record<string, unknown>;

    const recomputedDecisionRef =
      recomputeDecisionRef(content);

    decisionRefValid =
      recomputedDecisionRef ===
      binding.decisionRef;

    if (!decisionRefValid) {
      return {
        valid: false,
        eventIdValid: true,
        signatureValid: true,
        decisionRefValid: false,
        reason:
          "decision_ref recomputation failed.",
      };
    }

    if (
      content.action_binding_tool_hash !==
      binding.actionBindingToolHash
    ) {
      return {
        valid: false,
        eventIdValid: true,
        signatureValid: true,
        decisionRefValid: true,
        reason:
          "Action binding tool hash does not match signed content.",
      };
    }

    if (
      content.action_binding_args_hash !==
      binding.actionBindingArgsHash
    ) {
      return {
        valid: false,
        eventIdValid: true,
        signatureValid: true,
        decisionRefValid: true,
        reason:
          "Action binding args hash does not match signed content.",
      };
    }

    if (
      content.action_binding_agent_id !==
      binding.actionBindingAgentId
    ) {
      return {
        valid: false,
        eventIdValid: true,
        signatureValid: true,
        decisionRefValid: true,
        reason:
          "Action binding agent identity does not match signed content.",
      };
    }

    return {
      valid: true,
      eventIdValid: true,
      signatureValid: true,
      decisionRefValid: true,
      reason:
        "External decision verified.",
    };
  }
  catch (error) {
    return {
      valid: false,
      eventIdValid,
      signatureValid,
      decisionRefValid,
      reason:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

export function verifyExecutionBinding(
  binding: ExternalDecisionBinding,
  execution: {
    agentId: string;
    tool: string;
    args: unknown;
  },
): ExternalExecutionBindingResult {
  const expectedToolHash =
    sha256Prefixed(
      execution.tool,
    );

  const expectedArgsHash =
    sha256Prefixed(
      canonicalJson(execution.args),
    );

  const toolHashValid =
    expectedToolHash ===
    binding.actionBindingToolHash;

  const argsHashValid =
    expectedArgsHash ===
    binding.actionBindingArgsHash;

  const agentBindingValid =
    execution.agentId ===
    binding.actionBindingAgentId;

  if (!toolHashValid) {
    return {
      valid: false,
      toolHashValid: false,
      argsHashValid,
      agentBindingValid,
      reason:
        "Execution tool does not match the signed decision.",
    };
  }

  if (!argsHashValid) {
    return {
      valid: false,
      toolHashValid: true,
      argsHashValid: false,
      agentBindingValid,
      reason:
        "Execution arguments do not match the signed decision.",
    };
  }

  if (!agentBindingValid) {
    return {
      valid: false,
      toolHashValid: true,
      argsHashValid: true,
      agentBindingValid: false,
      reason:
        "Execution agent identity does not match the signed decision.",
    };
  }

  return {
    valid: true,
    toolHashValid: true,
    argsHashValid: true,
    agentBindingValid: true,
    reason:
      "Execution context matches the signed decision.",
  };
}
