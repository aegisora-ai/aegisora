import { AgentRuntime } from "@aegisora/runtime";

import { SDKAgent } from "../agent/sdk-agent";
import { protectTools as importProtectTools } from "../integration/protect-tools";

export interface AgentConfig {
  name: string;
}

export class AegisoraClient {
  private runtime: AgentRuntime;

  constructor() {
    this.runtime = new AgentRuntime();
  }

  agent(config: AgentConfig) {
    return new SDKAgent(this.runtime, config);
  }

  protectTools(options: import("../integration/types").ProtectToolsOptions) {
    return importProtectTools(this.runtime, options);
  }
  /** Approve or reject pending tool approvals. */
  get approvals() {
    return this.runtime.getApprovals();
  }

  /** Require verified approver credentials for approvals (see createHmacApproverVerifier). Host application only. */
  useApproverVerifier(verifier: { verify(credential: string): { readonly actorId: string; readonly expiresAt: number } } | undefined): void {
    this.runtime.setApproverVerifier(verifier);
  }

  runtimeInstance() {
    return this.runtime;
  }
}
