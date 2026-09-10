import type {
  EnterpriseUsageEvent,
} from "./types";

import type {
  EnterpriseUsageAggregate,
  EnterpriseUsageWindow,
} from "./metering";

export type EnterpriseUsageProjectionStatus =
  | "applied"
  | "duplicate"
  | "ignored";

export type EnterpriseUsageProjectionIgnoreReason =
  | "outside-window";

export interface EnterpriseUsageProjectionResult {
  readonly status: EnterpriseUsageProjectionStatus;
  readonly eventId: string;
  readonly reason?: EnterpriseUsageProjectionIgnoreReason;
  readonly aggregate?: EnterpriseUsageAggregate;
}

interface ProjectionState {
  readonly workspaceId: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly seenEvents: Map<string, string>;
  readonly groups: Map<
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
  >;
}

function requireNonEmpty(
  name: string,
  value: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `[PROJECTION:INVALID] ${name} is required`,
    );
  }

  return value;
}

function parseTimestamp(
  name: string,
  value: string,
): number {
  requireNonEmpty(name, value);

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    throw new Error(
      `[PROJECTION:INVALID] ${name} must be a valid ISO timestamp`,
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
  const startMs = parseTimestamp(
    "window.startAt",
    window.startAt,
  );

  const endMs = parseTimestamp(
    "window.endAt",
    window.endAt,
  );

  if (endMs <= startMs) {
    throw new Error(
      "[PROJECTION:INVALID] window.endAt must be greater than window.startAt",
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
  const createdMs = Date.parse(event.createdAt);

  if (Number.isNaN(createdMs)) {
    throw new Error(
      "[PROJECTION:INVALID] event.createdAt must be a valid ISO timestamp",
    );
  }

  return (
    createdMs >= startMs &&
    createdMs < endMs
  );
}

function projectionKey(
  workspaceId: string,
  windowStart: string,
  windowEnd: string,
): string {
  return [
    workspaceId,
    windowStart,
    windowEnd,
  ].join("::");
}

function groupKey(
  event: EnterpriseUsageEvent,
): string {
  return [
    event.providerId,
    event.modelId,
    event.agentId,
  ].join("::");
}

function eventFingerprint(
  event: EnterpriseUsageEvent,
): string {
  return JSON.stringify([
    event.workspaceId,
    event.traceId,
    event.decisionId,
    event.executionId,
    event.evidenceId,
    event.agentId,
    event.providerId,
    event.modelId,
    event.eventType,
    event.outcome,
    event.createdAt,
    event.usage.promptTokens,
    event.usage.completionTokens,
    event.usage.totalTokens,
  ]);
}

function cloneAggregate(
  aggregate: EnterpriseUsageAggregate,
): EnterpriseUsageAggregate {
  return Object.freeze({
    ...aggregate,
  });
}

export class EnterpriseUsageProjection {
  private readonly windows = new Map<
    string,
    ProjectionState
  >();

  apply(
    workspaceId: string,
    window: EnterpriseUsageWindow,
    event: EnterpriseUsageEvent,
  ): EnterpriseUsageProjectionResult {
    requireNonEmpty(
      "workspaceId",
      workspaceId,
    );

    const validated = validateWindow(window);

    if (event.workspaceId !== workspaceId) {
      throw new Error(
        "[PROJECTION:TENANT] event.workspaceId must match projection workspaceId",
      );
    }

    if (
      !inWindow(
        event,
        validated.startMs,
        validated.endMs,
      )
    ) {
      return Object.freeze({
        status: "ignored",
        eventId: event.eventId,
        reason: "outside-window",
      });
    }

    const key = projectionKey(
      workspaceId,
      validated.startAt,
      validated.endAt,
    );

    let state = this.windows.get(key);

    if (!state) {
      state = {
        workspaceId,
        windowStart: validated.startAt,
        windowEnd: validated.endAt,
        seenEvents: new Map<string, string>(),
        groups: new Map(),
      };

      this.windows.set(key, state);
    }

    const fingerprint = eventFingerprint(event);
    const existingFingerprint =
      state.seenEvents.get(event.eventId);

    if (existingFingerprint) {
      if (existingFingerprint !== fingerprint) {
        throw new Error(
          "[PROJECTION:DUPLICATE] eventId already projected with different usage identity",
        );
      }

      const duplicateGroup =
        state.groups.get(groupKey(event));

      if (!duplicateGroup) {
        throw new Error(
          "[PROJECTION:INVARIANT] projected event has no aggregate group",
        );
      }

      return Object.freeze({
        status: "duplicate",
        eventId: event.eventId,
        aggregate: cloneAggregate(
          duplicateGroup,
        ),
      });
    }

    state.seenEvents.set(
      event.eventId,
      fingerprint,
    );

    const keyForGroup = groupKey(event);

    const current =
      state.groups.get(keyForGroup) ?? {
        workspaceId,
        windowStart: validated.startAt,
        windowEnd: validated.endAt,
        providerId: event.providerId,
        modelId: event.modelId,
        agentId: event.agentId,
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

    state.groups.set(
      keyForGroup,
      current,
    );

    return Object.freeze({
      status: "applied",
      eventId: event.eventId,
      aggregate: cloneAggregate(current),
    });
  }

  snapshotForWorkspace(
    workspaceId: string,
    window: EnterpriseUsageWindow,
  ): readonly EnterpriseUsageAggregate[] {
    requireNonEmpty(
      "workspaceId",
      workspaceId,
    );

    const validated = validateWindow(window);

    const state = this.windows.get(
      projectionKey(
        workspaceId,
        validated.startAt,
        validated.endAt,
      ),
    );

    if (!state) {
      return Object.freeze([]);
    }

    const snapshot = Array.from(
      state.groups.values(),
    )
      .sort((left, right) =>
        [
          left.providerId,
          left.modelId,
          left.agentId,
        ].join("::").localeCompare(
          [
            right.providerId,
            right.modelId,
            right.agentId,
          ].join("::"),
        ),
      )
      .map((group) => cloneAggregate(group));

    return Object.freeze(snapshot);
  }

  getProjectedEventCount(
    workspaceId: string,
    window: EnterpriseUsageWindow,
  ): number {
    requireNonEmpty(
      "workspaceId",
      workspaceId,
    );

    const validated = validateWindow(window);

    const state = this.windows.get(
      projectionKey(
        workspaceId,
        validated.startAt,
        validated.endAt,
      ),
    );

    return state?.seenEvents.size ?? 0;
  }
}
