import {
  assertEnterpriseIncident,
  cloneIncidentMetadata,
  CreateEnterpriseIncidentInput,
  EnterpriseIncident,
  EnterpriseIncidentSeverity,
  EnterpriseIncidentStatus,
  EnterpriseIncidentTransition,
} from "./types";

const ALLOWED_TRANSITIONS: Readonly<
  Record<
    EnterpriseIncidentStatus,
    readonly EnterpriseIncidentTransition[]
  >
> = Object.freeze({
  OPEN: [
    "ACKNOWLEDGE",
    "START_INVESTIGATION",
    "RESOLVE",
  ],

  ACKNOWLEDGED: [
    "START_INVESTIGATION",
    "RESOLVE",
  ],

  INVESTIGATING: [
    "RESOLVE",
  ],

  RESOLVED: [
    "CLOSE",
    "REOPEN",
  ],

  CLOSED: [
    "REOPEN",
  ],
});

export class EnterpriseIncidentLedger {

  private readonly incidents =
    new Map<string, EnterpriseIncident>();

  create(
    input: CreateEnterpriseIncidentInput,
  ): EnterpriseIncident {

    if (
      this.incidents.has(
        input.incidentId,
      )
    ) {
      throw new Error(
        `Enterprise incident already exists: ${input.incidentId}`,
      );
    }

    const now =
      new Date();

    const createdAt =
      input.createdAt
        ? new Date(
            input.createdAt.getTime(),
          )
        : now;

    const incident:
      EnterpriseIncident =
      Object.freeze({
        incidentId:
          input.incidentId,

        workspaceId:
          input.workspaceId,

        severity:
          input.severity,

        status:
          "OPEN",

        source:
          input.source,

        title:
          input.title,

        reason:
          input.reason,

        traceId:
          input.traceId,

        decisionId:
          input.decisionId,

        executionId:
          input.executionId,

        evidenceId:
          input.evidenceId,

        auditId:
          input.auditId,

        agentId:
          input.agentId,

        actorId:
          input.actorId,

        createdAt,

        updatedAt:
          new Date(
            createdAt.getTime(),
          ),

        metadata:
          cloneIncidentMetadata(
            input.metadata,
          ),
      });

    assertEnterpriseIncident(
      incident,
    );

    this.incidents.set(
      incident.incidentId,
      incident,
    );

    return incident;
  }

  get(
    incidentId: string,
  ): EnterpriseIncident | undefined {
    return this.incidents.get(
      incidentId,
    );
  }

  getForWorkspace(
    workspaceId: string,
    incidentId: string,
  ): EnterpriseIncident | undefined {

    const incident =
      this.incidents.get(
        incidentId,
      );

    if (!incident) {
      return undefined;
    }

    if (
      incident.workspaceId !==
      workspaceId
    ) {
      return undefined;
    }

    return incident;
  }

  listForWorkspace(
    workspaceId: string,
  ): readonly EnterpriseIncident[] {
    return Object.freeze(
      Array.from(
        this.incidents.values(),
      ).filter(
        (incident) =>
          incident.workspaceId ===
          workspaceId,
      ),
    );
  }

  list():
    readonly EnterpriseIncident[] {
    return Object.freeze(
      Array.from(
        this.incidents.values(),
      ),
    );
  }

  transition(
    workspaceId: string,
    incidentId: string,
    transition: EnterpriseIncidentTransition,
  ): EnterpriseIncident {

    const current =
      this.getForWorkspace(
        workspaceId,
        incidentId,
      );

    if (!current) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Enterprise incident not found or workspace mismatch.",
      );
    }

    const allowed =
      ALLOWED_TRANSITIONS[
        current.status
      ];

    if (
      !allowed.includes(
        transition,
      )
    ) {
      throw new Error(
        `[ENFORCEMENT:BLOCK] Invalid incident transition: ${current.status} -> ${transition}`,
      );
    }

    const now =
      new Date();

    let nextStatus:
      EnterpriseIncidentStatus;

    switch (transition) {

      case "ACKNOWLEDGE":
        nextStatus =
          "ACKNOWLEDGED";
        break;

      case "START_INVESTIGATION":
        nextStatus =
          "INVESTIGATING";
        break;

      case "RESOLVE":
        nextStatus =
          "RESOLVED";
        break;

      case "CLOSE":
        nextStatus =
          "CLOSED";
        break;

      case "REOPEN":
        nextStatus =
          "OPEN";
        break;
    }

    const updated:
      EnterpriseIncident =
      Object.freeze({
        ...current,

        status:
          nextStatus,

        updatedAt:
          now,

        acknowledgedAt:
          nextStatus ===
            "ACKNOWLEDGED"
            ? current.acknowledgedAt ??
              now
            : current.acknowledgedAt,

        resolvedAt:
          nextStatus ===
            "RESOLVED"
            ? now
            : current.resolvedAt,

        closedAt:
          nextStatus ===
            "CLOSED"
            ? now
            : undefined,

        metadata:
          cloneIncidentMetadata(
            current.metadata,
          ),
      });

    assertEnterpriseIncident(
      updated,
    );

    this.incidents.set(
      incidentId,
      updated,
    );

    return updated;
  }
}

export function incidentSeverityRank(
  severity: EnterpriseIncidentSeverity,
): number {

  switch (severity) {

    case "LOW":
      return 1;

    case "MEDIUM":
      return 2;

    case "HIGH":
      return 3;

    case "CRITICAL":
      return 4;
  }
}

export function isActiveIncidentStatus(
  status: EnterpriseIncidentStatus,
): boolean {
  return (
    status === "OPEN" ||
    status === "ACKNOWLEDGED" ||
    status === "INVESTIGATING"
  );
}

export function isTerminalIncidentStatus(
  status: EnterpriseIncidentStatus,
): boolean {
  return status === "CLOSED";
}
