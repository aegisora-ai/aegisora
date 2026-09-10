import type {
  EnterpriseApprovalRuntimeConfig,
} from "../enforcement/types";

import type {
  EnterpriseEntitlementRuntimeConfig,
} from "../enforcement/enterprise-entitlement-bridge";
import type {
  EnterpriseEvidenceRuntimeConfig,
} from "../enforcement/enterprise-evidence-bridge";

import {
  EnterpriseUsageRuntimeBridge,
} from "../enforcement/enterprise-usage-bridge";

import type {
  EnterpriseUsageRuntimeConfig,
} from "../enforcement/enterprise-usage-bridge";
import { ProviderRouter } from "./provider-router";
import type { ProviderName } from "./provider-router";

import { ProviderManager } from "./provider-manager";

import type {
  ProviderRequest,
  ProviderResponse,
} from "./base-provider";

import { EnforcementGate } from "../enforcement";

import {
  ApprovalEngine,
} from "../approval";

import { RuntimeContext } from "../context/runtime-context";

import {
  PermissionEngine
} from "../permissions";

import type {
  ProviderRuntimeContext,
} from "../types/context";

export interface ProviderExecutionRequest {
  agentId: string;

  provider?: ProviderName;

  request: Partial<ProviderRequest> & {
    prompt: string;
  };

  metadata?: Record<string, unknown>;

  context?: ProviderRuntimeContext;
}

export class ProviderExecutionGateway {

  private readonly enforcement: EnforcementGate;
  private readonly approvalEngine: ApprovalEngine;

    private enterpriseUsageBridge?: EnterpriseUsageRuntimeBridge;

    private readonly router: ProviderRouter;

  private readonly manager: ProviderManager;

  private readonly providerExecutionToken?: symbol;

  private readonly routerCapabilityOwned: boolean;

  constructor(
    private readonly context: RuntimeContext,
    routerOrToken?: ProviderRouter | symbol,
    manager?: ProviderManager,
    permissions: PermissionEngine = new PermissionEngine(),
    providerExecutionToken?: symbol,
    approvalEngine: ApprovalEngine = new ApprovalEngine(),
    enterpriseApprovalConfig?: EnterpriseApprovalRuntimeConfig,
    enterpriseEntitlementConfig?: EnterpriseEntitlementRuntimeConfig,
  ) {

    let token: symbol | undefined;
    let resolvedRouter: ProviderRouter;
    let ownsRouterCapability = false;

    if (typeof routerOrToken === "symbol") {
      token = routerOrToken;
      resolvedRouter = new ProviderRouter(token);
      ownsRouterCapability = true;
    } else if (routerOrToken && typeof routerOrToken.resolve === "function") {
      resolvedRouter = routerOrToken;
      token = providerExecutionToken;
      ownsRouterCapability = token !== undefined;
    } else {
      token =
        providerExecutionToken ??
        Symbol("aegisora.provider.execution");

      resolvedRouter = new ProviderRouter(token);
      ownsRouterCapability = true;
    }

    this.router = resolvedRouter;

    this.manager =
      manager ??
      new ProviderManager(resolvedRouter);

    this.providerExecutionToken = token;
    this.routerCapabilityOwned = ownsRouterCapability;

    this.approvalEngine =
      approvalEngine;

    this.enforcement = new EnforcementGate(
      context,
      permissions,
      this.approvalEngine,
      enterpriseApprovalConfig,
      enterpriseEntitlementConfig,
    );
  }

  /**
   * Canonical provider execution boundary.
   *
   * Every provider generation request must pass through
   * enforcement before the provider is invoked.
   */
  async generate(
    input: ProviderExecutionRequest,
  ): Promise<ProviderResponse> {

    const providerName: ProviderName =
      input.provider ?? "openai";


    /*
     * ----------------------------------------------------------
     * SECURITY ORDER INVARIANT
     * ----------------------------------------------------------
     *
     * Provider/model resolution MUST NOT occur before
     * enforcement.
     *
     * Unknown providers must first reach the governance
     * boundary so PermissionEngine can BLOCK and audit them.
     *
     * Only the caller-provided model is visible to enforcement.
     * Default model resolution happens only after ALLOW.
     */

    const requestedModel =
      input.request.model;

    const enforcement =
      await this.enforcement.enforce({
        agentId: input.agentId,

        resourceType:
          "provider",

        tool:
          `provider:${providerName}`,

        action:
          "provider.generate",

        input: {
          model: requestedModel,
          prompt: input.request.prompt,
        },

        metadata: {
                  /*
         * ----------------------------------------------------------
         * CANONICAL METADATA BOUNDARY
         * ----------------------------------------------------------
         *
         * input.metadata is untrusted caller-controlled data.
         *
         * Provider and model identity are security-sensitive fields
         * and MUST NOT be inherited from caller metadata.
         *
         * Canonical provider identity comes from providerName.
         *
         * Canonical model identity comes ONLY from request.model.
         *
         * If request.model is absent, model remains absent during
         * enforcement because default model resolution has not yet
         * occurred.
         */
        ...Object.fromEntries(
          Object.entries(input.metadata ?? {}).filter(
            ([key]) =>
              key !== "provider" &&
              key !== "model"
          )
        ),

        provider:
          providerName,

        ...(requestedModel !== undefined
          ? { model: requestedModel }
          : {}),
      },
      });

    if (
      enforcement.decision !== "ALLOW"
    ) {
      throw new Error(
        `[ENFORCEMENT:${enforcement.decision}] ${enforcement.reason}`
      );
    }

    /*
     * ----------------------------------------------------------
     * POST-ENFORCEMENT MODEL RESOLUTION
     * ----------------------------------------------------------
     *
     * This is intentionally after the ALLOW gate.
     * BLOCK / ESCALATE requests never call ProviderManager.
     */

    const model =
      requestedModel ??
      this.manager.getDefaultModel(
        providerName
      );

    const providerContext:
      ProviderRuntimeContext = {

      ...(input.context ?? {}),

      requestId:
        input.context?.requestId ??
        crypto.randomUUID(),

      prompt:
        input.request.prompt,

      agentId:
        input.agentId,

      action:
        "provider.generate",

      metadata: {
        ...(input.context?.metadata ?? {}),
        ...(input.metadata ?? {}),
        provider: providerName,
        model,
      },

      riskScore:
        enforcement.riskScore,

      riskLevel:
        enforcement.riskScore >= 90
          ? "CRITICAL"
          : enforcement.riskScore >= 70
            ? "HIGH"
            : enforcement.riskScore >= 40
              ? "MEDIUM"
              : "LOW",

      suspicious:
        enforcement.threats.length > 0,

      signals:
        enforcement.threats.map(
          (threat) =>
            `${threat.type}:${threat.severity}`
        ),

      blocked:
        false,

      provider:
        providerName,

      startedAt:
        input.context?.startedAt ??
        new Date(),

      finishedAt:
        undefined,
    };

    const provider =
      this.routerCapabilityOwned
        ? this.router.resolve(
            providerName,
            this.providerExecutionToken,
          )
        : this.router.resolve(
            providerName,
          );

    const providerRequest:
      ProviderRequest = {
      ...input.request,
      model,
      prompt:
        input.request.prompt,
    };

    try {

      const response =
        await provider.generate(
          providerRequest,
          providerContext
        );
      if (
        this.enterpriseUsageBridge &&
        response.usage
      ) {
        await this.enterpriseUsageBridge.record({
          traceId:
            enforcement.traceId,

          decisionId:
            enforcement.decisionId,

          executionId:
            enforcement.executionId,

          evidenceId:
            enforcement.evidenceId,

          agentId:
            input.agentId,

          // Canonical identities come from the gateway.
          // ProviderResponse.provider/model are never trusted.
          providerId:
            providerName,

          modelId:
            model,

          outcome:
            "executed",

          usage: {
            promptTokens:
              response.usage.promptTokens,

            completionTokens:
              response.usage.completionTokens,

            totalTokens:
              response.usage.totalTokens,
          },

          metadata: {
            ...(input.context?.metadata ?? {}),
            ...(input.metadata ?? {}),
            source:
              "provider-execution-gateway",
          },
        });
      }

      providerContext.response =
        response.output;

      providerContext.finishedAt =
        new Date();

      return response;

    } catch (error) {

      providerContext.finishedAt =
        new Date();

      throw error;
    }
  }

  getApprovalEngine(): ApprovalEngine {
    return this.approvalEngine;
  }

  configureEnterpriseApproval(
    config: EnterpriseApprovalRuntimeConfig,
  ): void {

    this.enforcement.configureEnterpriseApproval(
      config,
    );
  }

  getEnterpriseApprovalBridge() {
    return this.enforcement
      .getEnterpriseApprovalBridge();
  }

  configureEnterpriseAudit(
    config: EnterpriseAuditRuntimeConfig,
  ): void {
    this.enforcement.configureEnterpriseAudit(config);
  }
  configureEnterpriseEvidence(
    config: EnterpriseEvidenceRuntimeConfig,
  ): void {
    this.enforcement.configureEnterpriseEvidence(
      config,
    );
  }

  getEnterpriseAuditBridge() {
    return this.enforcement
      .getEnterpriseAuditBridge();
  }
  getEnterpriseEvidenceBridge() {
    return this.enforcement
      .getEnterpriseEvidenceBridge();
  }
    configureEnterpriseEntitlement(
    config: EnterpriseEntitlementRuntimeConfig,
  ): void {
    this.enforcement.configureEnterpriseEntitlement(
      config,
    );
  }

  getEnterpriseEntitlementBridge() {
    return this.enforcement
      .getEnterpriseEntitlementBridge();
  }
  configureEnterpriseUsage(
      config: EnterpriseUsageRuntimeConfig,
    ): void {
      if (this.enterpriseUsageBridge) {
        throw new Error(
          "Enterprise usage bridge is already configured.",
        );
      }

      this.enterpriseUsageBridge =
        new EnterpriseUsageRuntimeBridge(
          config,
        );
    }

    getEnterpriseUsageBridge() {
      return this.enterpriseUsageBridge;
    }

    getDefaultModel(
      provider: ProviderName
  ): string {
    return this.manager.getDefaultModel(
      provider
    );
  }

  list(): ProviderName[] {
    return this.router.list();
  }

  has(
    provider: ProviderName
  ): boolean {
    return this.router.has(
      provider
    );
  }
}

import type { EnterpriseAuditRuntimeConfig } from "../enforcement/enterprise-audit-bridge";
