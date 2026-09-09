export type IncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type IncidentStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "RESOLVED"
  | "CLOSED";

export type IncidentSource =
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

export type WorkspaceIncident = {
  incidentId: string;
  workspaceId: string;

  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;

  title: string;
  reason: string;

  traceId: string | null;
  decisionId: string | null;
  executionId: string | null;
  evidenceId: string | null;
  auditId: string | null;
  agentId: string | null;
  actorId: string | null;

  createdAt: string;
  updatedAt: string;

  acknowledgedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;

  metadata: Record<string, unknown>;
};

export type IncidentListResponse = {
  incidents: WorkspaceIncident[];
  count: number;
  workspaceId: string;
};
