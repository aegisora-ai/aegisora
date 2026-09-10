import type {
  AgentDiscoveryQuery,
  RegisteredAgent,
} from "./types";
import type { AgentRegistry } from "./registry";

export function discoverAgents(
  registry: AgentRegistry,
  query: AgentDiscoveryQuery,
): readonly RegisteredAgent[] {

  let agents = registry.list(query.workspaceId);

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
