export type ExternalToolTransport =
  | "mcp"
  | "http"
  | "webhook"
  | "plugin"
  | "custom";

export type ExternalToolDescriptor =
  Readonly<{
    id: string;
    name: string;
    transport: ExternalToolTransport;
    workspaceId: string;
    endpoint?: string;
    metadata?: Readonly<Record<string, unknown>>;
  }>;

export type ExternalToolRequest =
  Readonly<{
    workspaceId: string;
    agentId: string;
    toolId: string;
    action: "tool.execute";
    transport: ExternalToolTransport;

    traceId: string;
    decisionId: string;
    executionId: string;
    evidenceId: string;

    riskScore: number;

    input: unknown;

    metadata?: Readonly<Record<string, unknown>>;
  }>;

export type ExternalToolExecutionResult =
  Readonly<{
    toolId: string;
    workspaceId: string;
    agentId: string;
    transport: ExternalToolTransport;

    traceId: string;
    decisionId: string;
    executionId: string;
    evidenceId: string;

    output: unknown;
  }>;

export type ExternalToolAdapter =
  Readonly<{
    readonly transport: ExternalToolTransport;

    execute(
      tool: ExternalToolDescriptor,
      request: ExternalToolRequest,
    ): Promise<ExternalToolExecutionResult>;
  }>;

export function assertExternalToolDescriptor(
  tool: ExternalToolDescriptor,
): void {
  if (!tool.id.trim()) {
    throw new Error(
      "External tool descriptor requires id.",
    );
  }

  if (!tool.name.trim()) {
    throw new Error(
      "External tool descriptor requires name.",
    );
  }

  if (!tool.workspaceId.trim()) {
    throw new Error(
      "External tool descriptor requires workspaceId.",
    );
  }
}

export function assertExternalToolRequest(
  request: ExternalToolRequest,
): void {
  const required = [
    ["workspaceId", request.workspaceId],
    ["agentId", request.agentId],
    ["toolId", request.toolId],
    ["action", request.action],
    ["transport", request.transport],
    ["traceId", request.traceId],
    ["decisionId", request.decisionId],
    ["executionId", request.executionId],
    ["evidenceId", request.evidenceId],
  ] as const;

  for (const [name, value] of required) {
    if (!value.trim()) {
      throw new Error(
        `External tool request requires ${name}.`,
      );
    }
  }

  if (
    !Number.isInteger(request.riskScore) ||
    request.riskScore < 0 ||
    request.riskScore > 100
  ) {
    throw new Error(
      "External tool riskScore must be between 0 and 100.",
    );
  }
}
