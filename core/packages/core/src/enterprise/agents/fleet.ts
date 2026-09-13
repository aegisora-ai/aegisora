import type {
  AgentDiscoveryQuery,
  AgentEnvironment,
  AgentId,
  AgentStatus,
  RegisteredAgent,
} from "./types";
import type { WorkspaceId } from "../access";
import type { AgentRegistry } from "./registry";

export interface AgentFleetQuery extends AgentDiscoveryQuery {
  readonly ownerId?: string;
  readonly staleAfterMs?: number;
  readonly now?: string;
}

export interface AgentFleetSummary {
  readonly total: number;

  readonly active: number;
  readonly suspended: number;
  readonly deprecated: number;
  readonly unregistered: number;

  readonly production: number;
  readonly staging: number;
  readonly development: number;
  readonly restricted: number;

  readonly stale: number;
  readonly healthy: number;
}

export interface AgentFleetSnapshot {
  readonly agents: readonly RegisteredAgent[];
  readonly summary: AgentFleetSummary;
}

const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000;

function parseTimestamp(
  value: string,
  field: string,
): number {
  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a valid ISO timestamp.`);
  }

  return parsed;
}

function isStale(
  agent: RegisteredAgent,
  nowMs: number,
  staleAfterMs: number,
): boolean {
  if (agent.status !== "active") {
    return false;
  }

  if (!agent.lastSeenAt) {
    return true;
  }

  return (
    nowMs - parseTimestamp(agent.lastSeenAt, "lastSeenAt")
      >= staleAfterMs
  );
}

export class AgentFleetEngine {

  constructor(
    private readonly registry: AgentRegistry,
  ) {}

  list(
    query: AgentFleetQuery,
  ): readonly RegisteredAgent[] {
    let agents = this.registry.list(query.workspaceId);

    if (query.status) {
      agents = agents.filter(
        (agent) => agent.status === query.status,
      );
    }

    if (query.environment) {
      agents = agents.filter(
        (agent) =>
          agent.metadata.environment === query.environment,
      );
    }

    if (query.tag) {
      const normalized = query.tag.toLowerCase();

      agents = agents.filter(
        (agent) =>
          agent.metadata.tags.some(
            (tag) =>
              tag.toLowerCase() === normalized,
          ),
      );
    }

    if (query.tool) {
      agents = agents.filter(
        (agent) =>
          agent.declaredTools.includes(query.tool!),
      );
    }

    if (query.provider) {
      agents = agents.filter(
        (agent) =>
          agent.declaredProviders.includes(query.provider!),
      );
    }

    if (query.ownerId) {
      agents = agents.filter(
        (agent) =>
          agent.metadata.owner.userId === query.ownerId,
      );
    }

    if (query.search) {
      const search = query.search.toLowerCase();

      agents = agents.filter(
        (agent) => {
          const haystack = [
            agent.metadata.name,
            agent.metadata.description ?? "",
            agent.id,
            ...agent.metadata.tags,
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(search);
        },
      );
    }

    return agents;
  }

  summarize(
    workspaceId: WorkspaceId,
    options: {
      readonly now?: string;
      readonly staleAfterMs?: number;
    } = {},
  ): AgentFleetSummary {

    const agents = this.registry.list(workspaceId);

    const now = options.now ?? new Date().toISOString();
    const nowMs = parseTimestamp(now, "now");

    const staleAfterMs =
      options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;

    if (
      !Number.isFinite(staleAfterMs) ||
      staleAfterMs < 0
    ) {
      throw new Error(
        "staleAfterMs must be a non-negative finite number.",
      );
    }

    let active = 0;
    let suspended = 0;
    let deprecated = 0;
    let unregistered = 0;

    let production = 0;
    let staging = 0;
    let development = 0;
    let restricted = 0;

    let stale = 0;

    for (const agent of agents) {

      if (agent.status === "active") {
        active++;
      } else if (agent.status === "suspended") {
        suspended++;
      } else if (agent.status === "deprecated") {
        deprecated++;
      } else if (agent.status === "unregistered") {
        unregistered++;
      }

      if (agent.metadata.environment === "production") {
        production++;
      } else if (agent.metadata.environment === "staging") {
        staging++;
      } else if (agent.metadata.environment === "development") {
        development++;
      } else if (agent.metadata.environment === "restricted") {
        restricted++;
      }

      if (
        isStale(
          agent,
          nowMs,
          staleAfterMs,
        )
      ) {
        stale++;
      }
    }

    return {
      total: agents.length,

      active,
      suspended,
      deprecated,
      unregistered,

      production,
      staging,
      development,
      restricted,

      stale,
      healthy: active - stale,
    };
  }

  snapshot(
    query: AgentFleetQuery,
  ): AgentFleetSnapshot {

    const agents = this.list(query);

    const summary = this.summarize(
      query.workspaceId,
      {
        now: query.now,
        staleAfterMs: query.staleAfterMs,
      },
    );

    return {
      agents,
      summary,
    };
  }
}
