import {
  RuntimeEvent,
} from "../events";

export type SecurityDecision =
  | "allow"
  | "block";

export interface SecurityResult {
  decision: SecurityDecision;
  reason: string;
}

export class SecurityGuard {
  check(
    event: RuntimeEvent,
  ): SecurityResult {
    const payload =
      (event.payload as Record<string, unknown> | undefined) ?? {};

const rawInput = payload.input;

// Zero-trust execution validation:
// tool.called events must carry an explicit input.
// null/undefined input must never become an implicit valid request.
if (
  event.type === "tool.called" &&
  (rawInput === null || rawInput === undefined)
) {
  return {
    decision: "block",
    reason: "Malformed execution input: input is required",
  };
}

const input =
  typeof rawInput === "string"
    ? rawInput
    : (() => {
        try {
          return JSON.stringify(rawInput);
        } catch {
          return String(rawInput);
        }
      })();

    const normalized = input
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    // --------------------------------------------------------
    // 1. Prompt injection detection
    // --------------------------------------------------------

    const promptInjectionPatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/,
      /ignore\s+(the\s+)?system\s+prompt/,
      /reveal\s+(your\s+)?system\s+prompt/,
      /show\s+(me\s+)?your\s+system\s+prompt/,
      /disregard\s+(all\s+)?previous\s+instructions/,
      /override\s+(the\s+)?system\s+instructions/,
      /forget\s+(all\s+)?previous\s+instructions/,
      /\byou\s+are\s+now\s+(?:in\s+)?(?:an?\s+|the\s+)?(?:\w+\s+){0,3}(?:mode|persona|role)\b/,
      /\b(?:enter|switch\s+to|enable|activate)\s+(?:an?\s+|the\s+)?(?:developer|maintenance|debug|admin|god|sudo|unrestricted|jailbreak)\s+mode\b/,
      /\b(?:system|admin|developer)\s+override\s*:/,
      /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+)?(?:your|the|these)\s+(?:rules|guidelines|restrictions|constraints|safety\s+instructions)\b/,
      /\bact\s+as\s+(?:if\s+you\s+(?:have|had)\s+)?no\s+(?:rules|restrictions|limits|guardrails)\b/,
    ];

    if (
      promptInjectionPatterns.some(
        (pattern) => pattern.test(normalized),
      )
    ) {
      return {
        decision: "block",
        reason: "Prompt injection attempt detected",
      };
    }

    // --------------------------------------------------------
// --------------------------------------------------------
// 2. Privilege escalation detection
// --------------------------------------------------------

const privilegeEscalationPatterns = [
  /\bgrant\s+(administrator|admin|root)\s+(privileges?|access)\b/i,
  /\b(disable|bypass|circumvent)\s+(access\s+controls?|authorization|authentication)\b/i,
  /\belevate\s+(user\s+)?permissions?\b/i,
  /\b(escalate|elevate)\s+privileges?\b/i,
  /\bpromote\s+.*\bto\s+(administrator|admin|root)\b/i,
];

if (
  privilegeEscalationPatterns.some(
    (pattern) => pattern.test(normalized),
  )
) {
  return {
    decision: "block",
    reason: "Privilege escalation attempt detected",
  };
}

// --------------------------------------------------------
    // --------------------------------------------------------
    // 2A. Governance / security-control bypass detection
    // --------------------------------------------------------

    const governanceBypassPatterns = [
      /\b(bypass|circumvent|disable)\s+(the\s+)?governance\b/i,
      /\b(bypass|circumvent|disable)\s+(the\s+)?security\s+controls?\b/i,
      /\b(bypass|circumvent|disable)\s+(the\s+)?security\s+policy\b/i,
      /\bignore\s+(all\s+)?security\s+polic(?:y|ies)\s+and\s+bypass\b/i,
      /\b(?:disable|turn\s+off|switch\s+off|deactivate|skip|bypass|circumvent)\s+(?:all\s+|the\s+|your\s+|any\s+)?(?:safety|security)\s+(?:checks?|filters?|guards?|guardrails?|measures?|protocols?|restrictions?|mechanisms?)\b/i,
    ];

    if (
      governanceBypassPatterns.some(
        (pattern) => pattern.test(normalized),
      )
    ) {
      return {
        decision: "block",
        reason: "Governance bypass attempt detected",
      };
    }

    // --------------------------------------------------------
    // // 3. Command injection detection
// --------------------------------------------------------

const commandInjectionPatterns = [
  /\brm\s+-rf\s+\//i,
  /\bcurl\s+[^\\s]+.*\|\s*(sh|bash|zsh)\b/i,
  /\bwget\s+[^\\s]+.*\|\s*(sh|bash|zsh)\b/i,
  /(?:^|[\s;&|])(?:sudo|su)\s+-/i,
  /;\s*(?:rm|curl|wget|chmod|chown|bash|sh|zsh)\b/i,
  /&&\s*(?:rm|curl|wget|chmod|chown|bash|sh|zsh)\b/i,
  /\|\|\s*(?:rm|curl|wget|chmod|chown|bash|sh|zsh)\b/i,
];

if (
  commandInjectionPatterns.some(
    (pattern) => pattern.test(normalized),
  )
) {
  return {
    decision: "block",
    reason: "Command injection attempt detected",
  };
}

// --------------------------------------------------------
// 4. Sensitive-data exfiltration detection
// --------------------------------------------------------
    // --------------------------------------------------------

    const emailPattern =
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

    const transferPattern =
  /\b(send|forward|share|upload|exfiltrate|export|leak|transmit|disclose|post|put|patch)\b/i;

    const credentialPattern =
      /\b(api[\s_-]?key|access[\s_-]?token|refresh[\s_-]?token|auth[\s_-]?token|bearer[\s_-]?token|password|passwd|secret|secret[\s_-]?credential|credentials?|private[\s_-]?key|client[\s_-]?secret|signing[\s_-]?key|session[\s_-]?token)\b/i;

    const sensitiveDataPattern =
      /\b(ssn|social[\s_-]?security|credit[\s_-]?card|card[\s_-]?number|bank[\s_-]?account|iban|passport|private[\s_-]?data|confidential)\b/i;

    const emailExfiltration =
      emailPattern.test(input) &&
      transferPattern.test(input);

    const credentialExfiltration =
      credentialPattern.test(input) &&
      transferPattern.test(input);

    const sensitiveDataExfiltration =
      sensitiveDataPattern.test(input) &&
      transferPattern.test(input);

/*
 * URL / HTTP credential exfiltration detection.
 * Credentials may be embedded directly in network
 * requests or URLs without an explicit transfer verb.
 */
    const networkTransferPattern =
      /\b(post|put|patch|get|http|https)\b/i;

    const credentialUrlExfiltration =
      credentialPattern.test(input) &&
      (
        networkTransferPattern.test(input) ||
        /https?:\/\/[^\s]+/i.test(input)
      );


    if (
      emailExfiltration ||
      credentialExfiltration ||
      sensitiveDataExfiltration ||
      credentialUrlExfiltration
    ) {
      return {
        decision: "block",
        reason:
          "Potential sensitive-data exfiltration detected",
      };
    }
    // --------------------------------------------------------
    // 3. Agent failure
    // --------------------------------------------------------

    if (event.type === "agent.failed") {
      return {
        decision: "block",
        reason: "Agent failure detected",
      };
    }

    // --------------------------------------------------------
    // 4. Default allow
    // --------------------------------------------------------

    return {
      decision: "allow",
      reason: "No security violation",
    };
  }
}
