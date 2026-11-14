import { createHash } from "node:crypto";

import type {
  SecuritySelfPlayProposal,
  SecuritySelfPlayTaskContext,
} from "./types";

export type SecurityTaskValidationFailure =
  | "NOT_A_PLAIN_OBJECT"
  | "UNEXPECTED_FIELDS"
  | "UNSUPPORTED_TASK_KIND"
  | "INVALID_CONTEXT"
  | "INVALID_AGENT_ID"
  | "INVALID_ACTION"
  | "INVALID_INPUT";

export type SecurityTaskValidationResult =
  | {
      readonly valid: true;
      readonly proposal: SecuritySelfPlayProposal;
      readonly fingerprint: string;
    }
  | {
      readonly valid: false;
      readonly reason: SecurityTaskValidationFailure;
    };

function toPlainRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return null;
  }

  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) {
      return null;
    }
    result[key] = descriptor.value;
  }

  return result;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function reject(reason: SecurityTaskValidationFailure): SecurityTaskValidationResult {
  return { valid: false, reason };
}

/**
 * Accepts declarative JSON-like proposals only. No source code, shell command,
 * URL, executable payload, or custom evaluator can enter the task contract.
 */
export function validateSecuritySelfPlayProposal(
  value: unknown,
): SecurityTaskValidationResult {
  const proposalRecord = toPlainRecord(value);
  if (!proposalRecord) return reject("NOT_A_PLAIN_OBJECT");
  if (!hasExactKeys(proposalRecord, ["kind", "context"])) {
    return reject("UNEXPECTED_FIELDS");
  }

  if (proposalRecord.kind !== "DEDUCTION") {
    return reject("UNSUPPORTED_TASK_KIND");
  }

  const contextRecord = toPlainRecord(proposalRecord.context);
  if (!contextRecord) return reject("INVALID_CONTEXT");

  const contextKeys = Object.keys(contextRecord).sort();
  const requiredKeys = ["action", "agentId"];
  const validKeys =
    contextKeys.length === 2
      ? hasExactKeys(contextRecord, requiredKeys)
      : contextKeys.length === 3 && hasExactKeys(contextRecord, [...requiredKeys, "input"]);

  if (!validKeys) return reject("INVALID_CONTEXT");

  const agentId = contextRecord.agentId;
  if (
    typeof agentId !== "string" ||
    agentId.trim().length === 0 ||
    agentId.trim().length > 128 ||
    /[\u0000-\u001f\u007f]/.test(agentId)
  ) {
    return reject("INVALID_AGENT_ID");
  }

  const action = contextRecord.action;
  if (
    typeof action !== "string" ||
    action.trim().length === 0 ||
    action.trim().length > 256 ||
    /[\u0000-\u001f\u007f]/.test(action)
  ) {
    return reject("INVALID_ACTION");
  }

  const rawInput = contextRecord.input === undefined ? "" : contextRecord.input;
  if (typeof rawInput !== "string" || rawInput.length > 8192) {
    return reject("INVALID_INPUT");
  }

  const context: SecuritySelfPlayTaskContext = Object.freeze({
    agentId: agentId.trim(),
    action: action.trim(),
    input: rawInput,
  });

  const normalized: SecuritySelfPlayProposal = Object.freeze({
    kind: "DEDUCTION",
    context,
  });

  const canonical = JSON.stringify({
    kind: normalized.kind,
    context: {
      agentId: context.agentId,
      action: context.action,
      input: context.input,
    },
  });

  const fingerprint = createHash("sha256").update(canonical, "utf8").digest("hex");
  return { valid: true, proposal: normalized, fingerprint };
}