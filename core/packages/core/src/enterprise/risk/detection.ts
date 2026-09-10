import {
  riskSignalId,
} from "./types";

import type {
  DetectionEngine,
  DetectionSignal,
  RiskRequest,
} from "./types";

function payloadText(
  payload: unknown,
): string {

  if (payload === undefined || payload === null) {
    return "";
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function signal(
  type: DetectionSignal["type"],
  severity: DetectionSignal["severity"],
  score: number,
  confidence: number,
  reason: string,
  metadata: Readonly<Record<string, unknown>>,
): DetectionSignal {

  return {
    id: riskSignalId(
      `${type}:${score}:${reason}`,
    ),
    type,
    severity,
    score,
    confidence,
    reason,
    metadata,
  };
}

export class DeterministicDetectionEngine
  implements DetectionEngine {

  detect(
    request: RiskRequest,
  ): readonly DetectionSignal[] {

    const results: DetectionSignal[] = [];

    const action =
      request.action.toLowerCase();

    const body =
      payloadText(
        request.payload,
      ).toLowerCase();

    const combined =
      `${action} ${body}`;

    if (
      /ignore\s+(all|any|previous|prior)\s+instructions/.test(
        combined,
      ) ||
      /system\s+prompt/.test(combined) &&
      /override|bypass|ignore/.test(combined)
    ) {

      results.push(
        signal(
          "prompt_injection",
          "critical",
          40,
          0.98,
          "Potential prompt-injection or instruction-override pattern detected.",
          {
            pattern: "instruction_override",
          },
        ),
      );
    }

    if (
      /\b(drop|truncate|delete)\b/.test(action) ||
      /\b(destroy|wipe|purge)\b/.test(action)
    ) {

      results.push(
        signal(
          "destructive_action",
          "high",
          30,
          0.96,
          "Destructive operation pattern detected.",
          {
            action,
          },
        ),
      );
    }

    if (
      /\b(sudo|root|admin|administrator|privileged)\b/.test(
        combined,
      ) ||
      /\bgrant\s+all\b/.test(combined)
    ) {

      results.push(
        signal(
          "privilege_escalation",
          "high",
          25,
          0.93,
          "Potential privilege escalation or privileged operation detected.",
          {
            action,
          },
        ),
      );
    }

    if (
      /\b(ssn|social.?security|credit.?card|iban|passport|national.?id)\b/.test(
        combined,
      ) ||
      /\bapi[_ -]?key|secret|password|token\b/.test(
        combined,
      )
    ) {

      results.push(
        signal(
          "sensitive_data",
          "high",
          25,
          0.91,
          "Sensitive credential or regulated-data pattern detected.",
          {
            category: "sensitive_data",
          },
        ),
      );
    }

    if (
      /\b(upload|exfiltrat|external.?endpoint|webhook|send.?outside|post.?external)\b/.test(
        combined,
      )
    ) {

      results.push(
        signal(
          "data_exfiltration",
          "high",
          30,
          0.90,
          "Potential data exfiltration or external data transfer detected.",
          {
            action,
          },
        ),
      );
    }

    if (
      /\bhttp:\/\//.test(combined) ||
      /\bcurl\b|\bwget\b/.test(combined)
    ) {

      results.push(
        signal(
          "suspicious_network",
          "medium",
          15,
          0.87,
          "Potentially unsafe network access pattern detected.",
          {
            action,
          },
        ),
      );
    }

    if (
      request.declaredTool === false
    ) {

      results.push(
        signal(
          "unknown_tool",
          "high",
          25,
          0.95,
          "Action references a tool that is not declared for the agent.",
          {
            declaredTool: false,
          },
        ),
      );
    }

    if (
      typeof request.historyRiskScore === "number" &&
      request.historyRiskScore >= 70
    ) {

      results.push(
        signal(
          "anomalous_behavior",
          "high",
          20,
          0.88,
          "Historical behavior risk is elevated.",
          {
            historyRiskScore:
              request.historyRiskScore,
          },
        ),
      );
    }

    return results;
  }
}
