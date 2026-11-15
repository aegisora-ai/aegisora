import type { ToolContext } from "@aegisora/runtime";

/**
 * A small, serializable authority envelope for one agent task.
 * Tool names are exact capabilities; no wildcard matching is supported.
 */
export interface AegisoraTaskContract {
  readonly contractId: string;
  readonly agentId: string;
  readonly allowedTools: readonly string[];
  readonly approvalRequiredTools?: readonly string[];
  readonly expiresAt?: string;
  /** Maximum number of tool-call attempts across this protected tool set. */
  readonly maxExecutions?: number;
}

/** Framework-neutral tool shape accepted by the Aegisora SDK. */
export interface AegisoraToolDefinition {
  readonly name: string;
  readonly description: string;
  execute(input: unknown, context?: ToolContext): Promise<unknown> | unknown;
}

/** A tool with the same name and description, but a governed execute method. */
export interface ProtectedAegisoraTool {
  readonly name: string;
  readonly description: string;
  execute(input: unknown): Promise<unknown>;
}

export interface ProtectToolsOptions {
  readonly agentId: string;
  readonly contract: AegisoraTaskContract;
  readonly tools: readonly AegisoraToolDefinition[];
}