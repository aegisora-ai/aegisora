import { requireWorkspaceContext } from "@/lib/workspace-context";
import type {
  IncidentListResponse,
  WorkspaceIncident,
} from "./types";

type IncidentRow = {
  incident_id: string;
  workspace_id: string;

  severity: WorkspaceIncident["severity"];
  status: WorkspaceIncident["status"];
  source: WorkspaceIncident["source"];

  title: string;
  reason: string;

  trace_id: string | null;
  decision_id: string | null;
  execution_id: string | null;
  evidence_id: string | null;
  audit_id: string | null;
  agent_id: string | null;
  actor_id: string | null;

  created_at: string;
  updated_at: string;

  acknowledged_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;

  metadata: Record<string, unknown>;
};

function mapIncident(row: IncidentRow): WorkspaceIncident {
  return {
    incidentId: row.incident_id,
    workspaceId: row.workspace_id,

    severity: row.severity,
    status: row.status,
    source: row.source,

    title: row.title,
    reason: row.reason,

    traceId: row.trace_id,
    decisionId: row.decision_id,
    executionId: row.execution_id,
    evidenceId: row.evidence_id,
    auditId: row.audit_id,
    agentId: row.agent_id,
    actorId: row.actor_id,

    createdAt: row.created_at,
    updatedAt: row.updated_at,

    acknowledgedAt: row.acknowledged_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,

    metadata: row.metadata ?? {},
  };
}

export async function listWorkspaceIncidents(options?: {
  status?: WorkspaceIncident["status"];
  severity?: WorkspaceIncident["severity"];
  limit?: number;
}): Promise<IncidentListResponse> {
  const { supabase, context } =
    await requireWorkspaceContext();

  const limit = Math.min(
    Math.max(options?.limit ?? 100, 1),
    200,
  );

  let query = supabase
    .from("enterprise_incidents")
    .select(
      [
        "incident_id",
        "workspace_id",
        "severity",
        "status",
        "source",
        "title",
        "reason",
        "trace_id",
        "decision_id",
        "execution_id",
        "evidence_id",
        "audit_id",
        "agent_id",
        "actor_id",
        "created_at",
        "updated_at",
        "acknowledged_at",
        "resolved_at",
        "closed_at",
        "metadata",
      ].join(","),
      { count: "exact" },
    )
    .eq("workspace_id", context.workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.severity) {
    query = query.eq("severity", options.severity);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(
      `INCIDENT_QUERY_FAILED: ${error.message}`,
    );
  }

  return {
    incidents: (data ?? []).map(
      (row) => mapIncident(row as unknown as IncidentRow),
    ),
    count: count ?? 0,
    workspaceId: context.workspaceId,
  };
}

export async function getWorkspaceIncident(
  incidentId: string,
): Promise<WorkspaceIncident | null> {
  const { supabase, context } =
    await requireWorkspaceContext();

  const { data, error } = await supabase
    .from("enterprise_incidents")
    .select(
      [
        "incident_id",
        "workspace_id",
        "severity",
        "status",
        "source",
        "title",
        "reason",
        "trace_id",
        "decision_id",
        "execution_id",
        "evidence_id",
        "audit_id",
        "agent_id",
        "actor_id",
        "created_at",
        "updated_at",
        "acknowledged_at",
        "resolved_at",
        "closed_at",
        "metadata",
      ].join(","),
    )
    .eq("workspace_id", context.workspaceId)
    .eq("incident_id", incidentId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `INCIDENT_QUERY_FAILED: ${error.message}`,
    );
  }

  return data
    ? mapIncident(data as unknown as IncidentRow)
    : null;
}
