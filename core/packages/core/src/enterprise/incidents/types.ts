export type EnterpriseIncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type EnterpriseIncidentStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "RESOLVED"
  | "CLOSED";

export type EnterpriseIncidentSource =
  | "policy"
  | "risk"
  | "decision"
  | "execution"
  | "approval"
  | "evidence"
  | "audit"
  | "runtime"
  | "webhook"
  | "manual";

export type EnterpriseIncidentTransition =
  | "ACKNOWLEDGE"
  | "START_INVESTIGATION"
  | "RESOLVE"
  | "CLOSE"
  | "REOPEN";

export type EnterpriseIncident = Readonly<{
  incidentId: string;
  workspaceId: string;

  severity: EnterpriseIncidentSeverity;
  status: EnterpriseIncidentStatus;
  source: EnterpriseIncidentSource;

  title: string;
  reason: string;

  traceId?: string;
  decisionId?: string;
  executionId?: string;
  evidenceId?: string;
  auditId?: string;
  agentId?: string;
  actorId?: string;

  createdAt: Date;
  updatedAt: Date;

  acknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  metadata: Readonly<Record<string, unknown>>;
}>;

export type CreateEnterpriseIncidentInput = Readonly<{
  incidentId: string;
  workspaceId: string;

  severity: EnterpriseIncidentSeverity;
  source: EnterpriseIncidentSource;

  title: string;
  reason: string;

  traceId?: string;
  decisionId?: string;
  executionId?: string;
  evidenceId?: string;
  auditId?: string;
  agentId?: string;
  actorId?: string;

  createdAt?: Date;
  metadata?: Readonly<Record<string, unknown>>;
}>;

function assertNonEmpty(
  value: string,
  field: string,
): void {
  if (!value.trim()) {
    throw new Error(
      `Enterprise incident requires ${field}.`,
    );
  }
}

export function assertEnterpriseIncident(
  incident: EnterpriseIncident,
): void {
  assertNonEmpty(
    incident.incidentId,
    "incidentId",
  );

  assertNonEmpty(
    incident.workspaceId,
    "workspaceId",
  );

  assertNonEmpty(
    incident.title,
    "title",
  );

  assertNonEmpty(
    incident.reason,
    "reason",
  );

  assertNonEmpty(
    incident.source,
    "source",
  );

  if (!(incident.createdAt instanceof Date)) {
    throw new Error(
      "Enterprise incident createdAt must be a Date.",
    );
  }

  if (!(incident.updatedAt instanceof Date)) {
    throw new Error(
      "Enterprise incident updatedAt must be a Date.",
    );
  }
}

export function cloneIncidentMetadata(
  metadata?: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ...(metadata ?? {}),
  });
}
