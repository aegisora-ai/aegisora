import type {
  PolicyDocument,
  PolicyRule,
} from "./types";

export interface PolicyValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

function validateRule(
  rule: PolicyRule,
  index: number,
): string[] {

  const errors: string[] = [];

  if (!rule.id.trim()) {
    errors.push(`rule[${index}].id must not be empty`);
  }

  if (!rule.action.trim()) {
    errors.push(`rule[${index}].action must not be empty`);
  }

  if (!Number.isInteger(rule.priority)) {
    errors.push(`rule[${index}].priority must be an integer`);
  }

  if (rule.priority < 0) {
    errors.push(`rule[${index}].priority must be >= 0`);
  }

  return errors;
}

export function validatePolicyDocument(
  document: PolicyDocument,
): PolicyValidationResult {

  const errors: string[] = [];

  if (document.version !== 1) {
    errors.push("Unsupported policy document version");
  }

  if (
    document.defaultEffect !== "allow" &&
    document.defaultEffect !== "block" &&
    document.defaultEffect !== "escalate"
  ) {
    errors.push(
      "defaultEffect must be allow, block, or escalate",
    );
  }

  const seen = new Set<string>();

  document.rules.forEach(
    (rule, index) => {

      errors.push(
        ...validateRule(rule, index),
      );

      if (seen.has(rule.id)) {
        errors.push(
          `duplicate rule id: ${rule.id}`,
        );
      }

      seen.add(rule.id);
    },
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}
