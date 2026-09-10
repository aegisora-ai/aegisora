export type EnterpriseRealtimeEventType =
  | "agent.created"
  | "agent.started"
  | "agent.completed"
  | "agent.failed"
  | "agent.stopped"
  | "execution.started"
  | "execution.completed"
  | "execution.blocked"
  | "execution.escalated"
  | "execution.failed"
  | "decision.created"
  | "approval.created"
  | "approval.updated"
  | "evidence.created"
  | "audit.created"
  | "incident.created";

export type EnterpriseRealtimeDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type EnterpriseRealtimeEvent = Readonly<{
  id: string;
  workspaceId: string;

  type: EnterpriseRealtimeEventType;

  traceId: string;
  decisionId: string;
  executionId: string;
  evidenceId: string;

  agentId: string;
  actorId?: string;

  action: string;

  decision?: EnterpriseRealtimeDecision;
  riskScore?: number;

  timestamp: Date;

  metadata: Readonly<Record<string, unknown>>;
}>;

export type EnterpriseRealtimeListener = (
  event: EnterpriseRealtimeEvent
) => void;

export type EnterpriseRealtimeWriter = {
  publish(event: EnterpriseRealtimeEvent): Promise<void>;
};
