import type {
  EnterpriseUsageEvent,
} from "./types";

export interface EnterpriseUsageWindow {
  readonly startAt: string;
  readonly endAt: string;
}

export interface EnterpriseUsageAggregate {
  readonly workspaceId: string;

  readonly windowStart: string;
  readonly windowEnd: string;

  readonly providerId: string;
  readonly modelId: string;
  readonly agentId: string;

  readonly eventCount: number;

  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface EnterpriseWorkspaceUsageSummary {
  readonly workspaceId: string;

  readonly windowStart: string;
  readonly windowEnd: string;

  readonly eventCount: number;

  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

function requireNonEmpty(
  name: string,
  value: string,
): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `[METERING:INVALID] ${name} is required`,
    );
  }
}

function parseTimestamp(
  name: string,
  value: string,
): number {
  requireNonEmpty(name, value);

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    throw new Error(
      `[METERING:INVALID] ${name} must be a valid ISO timestamp`,
    );
  }

  return parsed;
}

function validateWindow(
  window: EnterpriseUsageWindow,
): {
  startAt: string;
  endAt: string;
  startMs: number;
  endMs: number;
} {
  const startMs =
    parseTimestamp(
      "window.startAt",
      window.startAt,
    );

  const endMs =
    parseTimestamp(
      "window.endAt",
      window.endAt,
    );

  if (endMs <= startMs) {
    throw new Error(
      "[METERING:INVALID] window.endAt must be greater than window.startAt",
    );
  }

  return {
    startAt: window.startAt,
    endAt: window.endAt,
    startMs,
    endMs,
  };
}

function inWindow(
  event: EnterpriseUsageEvent,
  startMs: number,
  endMs: number,
): boolean {
  const createdMs =
    Date.parse(event.createdAt);

  return (
    createdMs >= startMs &&
    createdMs < endMs
  );
}

export class EnterpriseUsageMetering {
  aggregateForWorkspace(
    workspaceId: string,
    window: EnterpriseUsageWindow,
    events: readonly EnterpriseUsageEvent[],
  ): readonly EnterpriseUsageAggregate[] {
    requireNonEmpty(
      "workspaceId",
      workspaceId,
    );

    const validated =
      validateWindow(window);

    const seenEventIds =
      new Set<string>();

    const groups =
      new Map<
        string,
        {
          workspaceId: string;
          windowStart: string;
          windowEnd: string;
          providerId: string;
          modelId: string;
          agentId: string;
          eventCount: number;
          promptTokens: number;
          completionTokens: number;
          totalTokens: number;
        }
      >();

    for (const event of events) {
      if (
        event.workspaceId !==
        workspaceId
      ) {
        continue;
      }

      if (
        seenEventIds.has(
          event.eventId,
        )
      ) {
        continue;
      }

      if (
        !inWindow(
          event,
          validated.startMs,
          validated.endMs,
        )
      ) {
        continue;
      }

      seenEventIds.add(
        event.eventId,
      );

      const key = [
        event.providerId,
        event.modelId,
        event.agentId,
      ].join("::");

      const current =
        groups.get(key) ?? {
          workspaceId,
          windowStart:
            validated.startAt,
          windowEnd:
            validated.endAt,
          providerId:
            event.providerId,
          modelId:
            event.modelId,
          agentId:
            event.agentId,
          eventCount: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        };

      current.eventCount += 1;

      current.promptTokens +=
        event.usage.promptTokens;

      current.completionTokens +=
        event.usage.completionTokens;

      current.totalTokens +=
        event.usage.totalTokens;

      groups.set(
        key,
        current,
      );
    }

    return Object.freeze(
      Array.from(
        groups.values(),
      ).map(
        (group) =>
          Object.freeze({
            ...group,
          }),
      ),
    );
  }

  summarizeWorkspace(
    workspaceId: string,
    window: EnterpriseUsageWindow,
    events: readonly EnterpriseUsageEvent[],
  ): EnterpriseWorkspaceUsageSummary {
    const aggregates =
      this.aggregateForWorkspace(
        workspaceId,
        window,
        events,
      );

    return Object.freeze({
      workspaceId,
      windowStart:
        window.startAt,
      windowEnd:
        window.endAt,
      eventCount:
        aggregates.reduce(
          (sum, item) =>
            sum + item.eventCount,
          0,
        ),
      promptTokens:
        aggregates.reduce(
          (sum, item) =>
            sum + item.promptTokens,
          0,
        ),
      completionTokens:
        aggregates.reduce(
          (sum, item) =>
            sum + item.completionTokens,
          0,
        ),
      totalTokens:
        aggregates.reduce(
          (sum, item) =>
            sum + item.totalTokens,
          0,
        ),
    });
  }
}
