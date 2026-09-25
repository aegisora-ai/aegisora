import { randomUUID } from "node:crypto";
import { EnterpriseEvidenceRuntimeBridge } from "./enterprise-evidence-bridge";
import { EnterpriseAuditRuntimeBridge } from "./enterprise-audit-bridge";
import { EnterpriseEntitlementRuntimeBridge } from "./enterprise-entitlement-bridge";
import type { EnterpriseEntitlementRuntimeConfig } from "./enterprise-entitlement-bridge";
import type { EnterpriseEvidenceRuntimeConfig } from "./enterprise-evidence-bridge";
import type { EnterpriseAuditRuntimeConfig } from "./enterprise-audit-bridge";
import { RuntimeContext } from "../context/runtime-context";
import type { RuntimeEvent } from "../events";
import { ContinuitySealEngine } from "@aegisora/core";
import type {
  ContinuitySeal,
  ContinuitySealVerification,
} from "@aegisora/core";

import {
  EnterpriseRuntimeApprovalBridge,
} from "@aegisora/core";
import {
  DelegationAuthorityContractEngine,
} from "@aegisora/core";

import type {
  DelegationAuthorityContract,
  CompromiseSimulationGraph,
} from "@aegisora/core";

import {
  AuthorityAwareRuntimeDecisionAdapter,
  EnterpriseRuntimeExecutionGate,
  workspaceId,
} from "@aegisora/core";

import type {
  AuthorityAwareRuntimeContextProvider,
  RuntimeExecutionRequest,
  WorkspaceId,
} from "@aegisora/core";
import { PermissionEngine } from "../permissions";
import {
  ApprovalEngine,
} from "../approval";

import type {
  EnforcementRequest,
  EnforcementResult,
  EnforcementThreat,
  EnforcementAuditRecord,
  EnterpriseApprovalRuntimeConfig,
} from "./types";


import type {
  ToolRegistry,
} from "../tools";

export class EnforcementGate {

    private readonly enterpriseEntitlementLocks = new Map<string, Promise<void>>();

private readonly context: RuntimeContext;
private readonly permissions: PermissionEngine;
private readonly approvals: ApprovalEngine;

  private readonly continuitySealEngine = new ContinuitySealEngine();

  private enterpriseApprovalConfig?:
    EnterpriseApprovalRuntimeConfig;

  private enterpriseBridge?:
    EnterpriseRuntimeApprovalBridge;

  private enterpriseEvidenceBridge?:
    EnterpriseEvidenceRuntimeBridge;

  private enterpriseAuditBridge?: EnterpriseAuditRuntimeBridge;

  private enterpriseEntitlementConfig?: EnterpriseEntitlementRuntimeConfig;

  private enterpriseEntitlementBridge?: EnterpriseEntitlementRuntimeBridge;

  /**
   * Canonical 4.0-12C authority execution boundary.
   *
   * Authority is evaluated inside EnforcementGate so the resulting
   * ALLOW / ESCALATE / BLOCK becomes the canonical governance
   * decision persisted by the existing decision, evidence and
   * enterprise audit completion paths.
   */
  private authorityExecutionGate?: EnterpriseRuntimeExecutionGate;


  private authorityExecutionContextProvider?:
    AuthorityAwareRuntimeContextProvider;

private authorityExecutionWorkspaceResolver?: (
    request: EnforcementRequest,
  ) => WorkspaceId;


    constructor(
    context?: RuntimeContext,
    permissions?: PermissionEngine,
    approvals?: ApprovalEngine,
    enterpriseApprovalConfig?: EnterpriseApprovalRuntimeConfig,
    enterpriseEntitlementConfig?: EnterpriseEntitlementRuntimeConfig,
  ) {
    this.context =
      context ?? new RuntimeContext();

    this.permissions =
      permissions ?? new PermissionEngine();

    this.approvals =
      approvals ?? new ApprovalEngine();

    if (enterpriseApprovalConfig) {

      this.configureEnterpriseApproval(
        enterpriseApprovalConfig,
      );
    }

    if (enterpriseEntitlementConfig) {
      this.configureEnterpriseEntitlement(
        enterpriseEntitlementConfig,
      );
    }
  }


  configureEnterpriseApproval(
    config: EnterpriseApprovalRuntimeConfig,
  ): void {
    if (
      typeof config.workspaceId !== "string" ||
      config.workspaceId.trim().length === 0
    ) {
      throw new Error(
        "Enterprise approval workspaceId is required.",
      );
    }

    if (
      typeof config.requesterId !== "string" ||
      config.requesterId.trim().length === 0
    ) {
      throw new Error(
        "Enterprise approval requesterId is required.",
      );
    }

    if (this.enterpriseApprovalConfig) {
      if (
        this.enterpriseApprovalConfig.workspaceId !==
          config.workspaceId ||
        this.enterpriseApprovalConfig.requesterId !==
          config.requesterId
      ) {
        throw new Error(
          "Enterprise approval configuration is immutable after initialization.",
        );
      }

      if (
        config.bridge &&
        this.enterpriseBridge &&
        config.bridge !== this.enterpriseBridge
      ) {
        throw new Error(
          "Enterprise approval bridge is immutable after initialization.",
        );
      }

      return;
    }

    this.enterpriseApprovalConfig = {
      workspaceId: config.workspaceId,
      requesterId: config.requesterId,
      bridge: config.bridge,
    };

    this.enterpriseBridge =
      config.bridge ??
      new EnterpriseRuntimeApprovalBridge();
  }

  configureEnterpriseEntitlement(
    config: EnterpriseEntitlementRuntimeConfig,
  ): void {
    if (
      typeof config.workspaceId !== "string" ||
      config.workspaceId.trim().length === 0
    ) {
      throw new Error(
        "Enterprise entitlement workspaceId is required.",
      );
    }

    if (
      config.entitlements.workspaceId !==
      config.workspaceId
    ) {
      throw new Error(
        "Enterprise entitlement workspace mismatch.",
      );
    }

    if (this.enterpriseEntitlementConfig) {
      if (
        this.enterpriseEntitlementConfig.workspaceId !==
        config.workspaceId
      ) {
        throw new Error(
          "Enterprise entitlement configuration is immutable after initialization.",
        );
      }

      if (
        this.enterpriseEntitlementConfig.entitlements !==
        config.entitlements
      ) {
        throw new Error(
          "Enterprise entitlement configuration is immutable after initialization.",
        );
      }

      return;
    }

    this.enterpriseEntitlementConfig = {
      workspaceId: config.workspaceId,
      entitlements: config.entitlements,
      usageReader: config.usageReader,
    };

    this.enterpriseEntitlementBridge =
      new EnterpriseEntitlementRuntimeBridge(
        this.enterpriseEntitlementConfig,
      );
  }

  getEnterpriseEntitlementBridge():
    EnterpriseEntitlementRuntimeBridge | undefined {
    return this.enterpriseEntitlementBridge;
  }

  getEnterpriseEntitlementWorkspaceId():
    string | undefined {
    return this.enterpriseEntitlementConfig?.workspaceId;
  }

  getEnterpriseApprovalBridge():
    EnterpriseRuntimeApprovalBridge | undefined {
    return this.enterpriseBridge;
  }
  /**
   * Configure the canonical 4.0-12C authority execution boundary.
   *
   * The supplied context provider is the trusted source for
   * transitive authority and authority drift.
   *
   * Workspace identity is resolved independently and canonicalized
   * before every authority decision.
   */

  public configureToolRegistry(
    toolRegistry: ToolRegistry,
  ): void {
    this.permissions.setToolRegistry(
      toolRegistry,
    );
  }

  configureAuthorityAwareExecution(config: {
    readonly contextProvider:
      AuthorityAwareRuntimeContextProvider;

    readonly resolveWorkspaceId:
      () => WorkspaceId;
  }): void {

    if (
      !config ||
      typeof config.resolveWorkspaceId !==
        "function"
    ) {
      throw new Error(
        "Authority-aware execution requires a workspace resolver.",
      );
    }

    if (
      !config.contextProvider ||
      typeof config.contextProvider.resolve !==
        "function"
    ) {
      throw new Error(
        "Authority-aware execution requires a trusted authority context provider.",
      );
    }

    this.authorityExecutionWorkspaceResolver =
      () =>
        config.resolveWorkspaceId();

    this.authorityExecutionContextProvider =
      config.contextProvider;

    this.authorityExecutionGate =
      new EnterpriseRuntimeExecutionGate(
        new AuthorityAwareRuntimeDecisionAdapter(
          config.contextProvider,
        ),
      );
  }

  /**
   * Canonical RuntimeContext integration.
   *
   * RuntimeContext remains the source of truth for:
   *
   *   workspace identity
   *   transitive authority
   *   delegation graph
   *
   * No caller-supplied workspace metadata is trusted here.
   */
  configureAuthorityAwareExecutionFromRuntimeContext(): void {

    this.configureAuthorityAwareExecution({

      resolveWorkspaceId:
        () =>
          this.context.getAuthorityWorkspaceId(),

      contextProvider: {

        resolve:
          (runtimeRequest) => {

            const authority =
              this.context.getTransitiveAuthority(
                runtimeRequest.agentId,
              );

            return {

              resource:
                "provider:runtime",

              transitiveAuthority:
                authority,

              authorityDriftSeverity:
                "NONE",
            };
          },
      },
    });
  }

  public verifyContinuitySealAtExecution(
    request: EnforcementRequest,
    seal: ContinuitySeal,
  ): ContinuitySealVerification {
    const contextProvider =
      this.authorityExecutionContextProvider;

    const workspaceResolver =
      this.authorityExecutionWorkspaceResolver;

    if (
      !contextProvider ||
      !workspaceResolver
    ) {
      return {
        valid: false,
        code: "INVALID_SEAL",
        reason:
          "Continuity Seal verification requires the canonical authority runtime context.",
        sealId:
          seal.sealId,
      };
    }

    let canonicalWorkspaceId:
      WorkspaceId;

    try {
      canonicalWorkspaceId =
        workspaceId(
          workspaceResolver(
            request,
          ),
        );
    } catch (error) {
      return {
        valid: false,
        code: "WORKSPACE_MISMATCH",
        reason:
          error instanceof Error
            ? error.message
            : "Canonical workspace resolution failed during Continuity Seal verification.",
        sealId:
          seal.sealId,
      };
    }

    try {
      const runtimeRequest:
        RuntimeExecutionRequest = {
        workspaceId:
          canonicalWorkspaceId,

        requestId:
          seal.executionId,

        agentId:
          request.agentId,

        action:
          request.action,

        payload:
          request.input,
      };

      const current =
        contextProvider.resolve(
          runtimeRequest,
        );

      return this.continuitySealEngine.verify(
        seal,
        {
          workspaceId:
            canonicalWorkspaceId,

          agentId:
            request.agentId,

          executionId:
            seal.executionId,

          action:
            request.action,

          resource:
            request.tool,

          tool:
            request.tool,

          input:
            request.input,

          transitiveAuthority:
            current.transitiveAuthority,

          authorityDriftSeverity:
            current.authorityDriftSeverity,

          containmentAction:
            current.containmentAction,
        },
      );
    } catch (error) {
      return {
        valid: false,
        code: "INVALID_SEAL",
        reason:
          error instanceof Error
            ? error.message
            : "Current authority could not be resolved for Continuity Seal verification.",
        sealId:
          seal.sealId,
      };
    }
  }
  getEnterpriseWorkspaceId():
    string | undefined {
    return this.enterpriseApprovalConfig?.workspaceId;
  }

  getApprovalEngine():
    ApprovalEngine {
    return this.approvals;
  }
  async enforce(
    request: EnforcementRequest,
  ): Promise<EnforcementResult> {

    const traceId =
      crypto.randomUUID();

    const decisionId =
      crypto.randomUUID();

    const executionId =
      crypto.randomUUID();

    const evidenceId =
      crypto.randomUUID();

    const correlationId =
      traceId;

    const metadata: Record<string, unknown> = {
      ...(request.metadata ?? {}),
      action: request.action,
      canonicalTool: request.tool,
      correlationId,
      traceId,
      decisionId,
      executionId,
      evidenceId,
    };

    let approvalResume:
      import("../approval").ApprovalRecord
      | undefined;

    const suppliedApprovalId =
      typeof request.metadata?.approvalId === "string"
        ? request.metadata.approvalId
        : undefined;

    if (suppliedApprovalId) {

      const candidate =
        this.approvals.get(
          suppliedApprovalId,
        );

      if (
        this.enterpriseApprovalConfig
      ) {

        let enterprise:
          ReturnType<
            EnterpriseRuntimeApprovalBridge["getByRuntimeApprovalId"]
          >;

        try {
          enterprise =
            this.enterpriseBridge
              ?.getByRuntimeApprovalId(
                this.enterpriseApprovalConfig.workspaceId,
                suppliedApprovalId,
              );
        } catch (error) {
          return this.complete(
            request,
            {
              ...metadata,
              runtimeApprovalId:
                suppliedApprovalId,
            },
            {
              decision: "BLOCK",
              reason:
                error instanceof Error
                  ? error.message
                  : "Enterprise approval access denied.",
              riskScore: 100,
              threats: [],
              permission: "deny",
              policy: "allow",
              security: "allow",
            },
            "prevented",
            "not_attempted",
          );
        }

        if (!enterprise) {

          return this.complete(
            request,
            {
              ...metadata,
              runtimeApprovalId:
                suppliedApprovalId,
            },
            {
              decision: "BLOCK",
              reason:
                "Enterprise approval binding not found for runtime approval.",
              riskScore: 100,
              threats: [],
              permission: "deny",
              policy: "allow",
              security: "allow",
            },
            "prevented",
            "not_attempted",
          );
        }

        metadata.enterpriseApprovalId =
          enterprise.approvalId;

        metadata.runtimeApprovalId =
          enterprise.runtimeApprovalId;
      }

      if (!candidate) {
        return this.complete(
          request,
          metadata,
          {
            decision: "BLOCK",
            reason:
              "Approval not found.",
            riskScore: 100,
            threats: [],
            permission: "deny",
            policy: "allow",
            security: "allow",
          },
          "prevented",
          "not_attempted",
        );
      }


      try {

        if (
          this.enterpriseApprovalConfig &&
          this.enterpriseBridge
        ) {

          const enterprise =
            this.enterpriseBridge
              .getByRuntimeApprovalId(
                this.enterpriseApprovalConfig.workspaceId,
                candidate.approvalId,
              );

          if (!enterprise) {
            throw new Error(
              "Enterprise approval binding not found.",
            );
          }

          /*
           * The resumed enforcement receives a NEW trace,
           * decision and evidence identity.
           *
           * Enterprise approval validation therefore uses
           * the ORIGINAL approved correlation identifiers.
           * The resumed enforcement gets independent audit
           * correlation later in this method.
           */
          this.enterpriseBridge
            .validateForResume({
              workspaceId:
                this.enterpriseApprovalConfig.workspaceId,

              runtimeApprovalId:
                candidate.approvalId,

              agentId:
                request.agentId,

              action:
                request.action,

              decisionId:
                candidate.decisionId,

              traceId:
                candidate.traceId,

              executionId:
                candidate.executionId,

              evidenceId:
                enterprise.evidenceId,

              resourceType:
                request.resourceType,

              tool:
                request.tool,
            });
        }

        approvalResume =
          this.approvals.validate({
            approvalId:
              candidate.approvalId,

            agentId:
              request.agentId,

            action:
              request.action,

            traceId:
              candidate.traceId,

            decisionId:
              candidate.decisionId,

            executionId:
              candidate.executionId,

            request: {
              resourceType:
                request.resourceType,

              tool:
                request.tool,

              input:
                request.input,
            },
          });

      } catch (error) {

        const approvalMetadata = {
          ...(request.metadata ?? {}),
          action: request.action,
          canonicalTool: request.tool,
          correlationId: traceId,
          traceId,
          decisionId,
          executionId,
          evidenceId,
        };

        return this.complete(
          request,
          approvalMetadata,
          {
            decision: "BLOCK",
            reason:
              error instanceof Error
                ? error.message
                : "Approval validation failed.",
            riskScore: 100,
            threats: [],
            permission: "deny",
            policy: "allow",
            security: "allow",
          },
          "prevented",
          "not_attempted",
        );
      }
    }
    const registeredAgent =
      this.context.agentRegistry.getById(
        request.agentId,
      );

    if (!registeredAgent) {
      return this.complete(
        request,
        metadata,
        {
          decision: "BLOCK",
          reason:
            `Unknown or unregistered agent identity: ${request.agentId}`,
          riskScore: 100,
          threats: [],
          permission: "deny",
          policy: "allow",
          security: "allow",
        },
        "prevented",
        "not_attempted",
      );
    }

    const permission =
      this.permissions.check({
        agentId: request.agentId,
        resourceType: request.resourceType,
        tool: request.tool,
        action: request.action,
        metadata,
      });

    if (
      permission.action === "deny"
    ) {
      return this.complete(
        request,
        metadata,
        {
          decision: "BLOCK",
          reason: permission.reason,
          riskScore: 100,
          threats: [],
          permission: "deny",
          policy: "allow",
          security: "allow",
        },
        "prevented",
        "not_attempted",
      );
    }

    const event: RuntimeEvent = {
      id: crypto.randomUUID(),
      type:
        request.resourceType === "provider"
          ? "provider.called"
          : request.resourceType === "agent"
            ? "agent.called"
            : "tool.called",
      agentId: request.agentId,
      timestamp: new Date(),
      metadata,
      payload: {
        tool: request.tool,
        action: request.action,
        input: request.input,
        metadata,
      },
    };

    this.context.eventBus.emit(event);

    const policyResult =
      this.context.policy.evaluate(
        event,
      );

    if (!policyResult.allowed) {
      return this.complete(
        request,
        metadata,
        {
          decision: "BLOCK",
          reason: policyResult.reason,
          riskScore: 100,
          threats: [],
          permission: permission.action,
          policy: "block",
          security: "allow",
        },
        "prevented",
        "not_attempted",
      );
    }

    const securityResult =
      this.context.security.check(
        event,
      );

    const securityDecision =
      securityResult.decision === "block"
        ? "block"
        : "allow";

    const threats:
      EnforcementThreat[] = [];

    if (
      securityDecision === "block"
    ) {
      threats.push({
        type: "security_violation",
        severity: "high",
        description:
          securityResult.reason,
        score: 90,
      });
    }

    const riskSignal =
      this.context.risk.analyze(event);

    let riskScore = 0;

    if (riskSignal?.level === "low") {
      riskScore = 10;
    } else if (
      riskSignal?.level === "medium"
    ) {
      riskScore = 50;
    } else if (
      riskSignal?.level === "high"
    ) {
      riskScore = 90;
    }

    if (riskSignal) {
      threats.push({
        type: "risk_signal",
        severity: riskSignal.level,
        description: riskSignal.reason,
        score: riskScore,
      });
    }

    if (
      securityDecision === "block"
    ) {
      return this.complete(
        request,
        metadata,
        {
          decision: "BLOCK",
          reason: securityResult.reason,
          riskScore: Math.max(
            riskScore,
            90,
          ),
          threats,
          permission: permission.action,
          policy: "allow",
          security: "block",
        },
        "prevented",
        "not_attempted",
      );
    }

    /*
     * ----------------------------------------------------------
     * ENTERPRISE ENTITLEMENT ENFORCEMENT
     * ----------------------------------------------------------
     *
     * Entitlement execution quota is evaluated AFTER governance
     * signals are known but BEFORE approval/ALLOW completion.
     *
     * Workspace scope comes only from trusted enterprise runtime
     * configuration. Caller metadata is never authoritative.
     *
     * A quota BLOCK must complete through the same evidence/audit
     * path as every other governance BLOCK.
     */

    if (
      this.enterpriseEntitlementConfig &&
      this.enterpriseEntitlementBridge
    ) {
      let entitlementResult:
        Awaited<
          ReturnType<
            EnterpriseEntitlementRuntimeBridge["evaluate"]
          >
        >;

      try {
        entitlementResult =
          await this.enterpriseEntitlementBridge.evaluate({
            workspaceId:
              this.enterpriseEntitlementConfig.workspaceId,

            metric:
              "executions",

            amount:
              1,
          });
      } catch (error) {
        metadata.enterpriseEntitlementError =
          error instanceof Error
            ? error.message
            : String(error);

        return this.complete(
          request,
          metadata,
          {
            decision: "BLOCK",
            reason:
              "Enterprise entitlement evaluation failed closed.",
            riskScore,
            threats,
            permission: permission.action,
            policy: "allow",
            security: "allow",
          },
          "prevented",
          "not_attempted",
        );
      }

      metadata.enterpriseEntitlement = {
        workspaceId:
          this.enterpriseEntitlementConfig.workspaceId,

        metric:
          entitlementResult.metric,

        requested:
          entitlementResult.requested,

        used:
          entitlementResult.used,

        limit:
          entitlementResult.limit,

        remaining:
          entitlementResult.remaining,
      };

      if (
        entitlementResult.decision === "BLOCK"
      ) {
        return this.complete(
          request,
          metadata,
          {
            decision: "BLOCK",
            reason:
              entitlementResult.reason ||
              "Enterprise execution entitlement exceeded.",
            riskScore,
            threats,
            permission: permission.action,
            policy: "allow",
            security: "allow",
          },
          "prevented",
          "not_attempted",
        );
      }
    }
    /*
     * ------------------------------------------------------------
     * 4.0-12C CANONICAL AUTHORITY DECISION
     * ------------------------------------------------------------
     *
     * Authority is evaluated after governance/security/entitlement
     * checks and before permission-review / final ALLOW completion.
     *
     * BLOCK / ESCALATE enter complete() and therefore become the
     * canonical persisted decision for local decision/evidence and
     * enterprise audit/evidence.
     */
    if (this.authorityExecutionGate) {

      const workspaceResolver =
        this.authorityExecutionWorkspaceResolver;

      if (!workspaceResolver) {

        return this.complete(
          request,
          {
            ...metadata,

            authorityDecision:
              "BLOCK",

            authorityReason:
              "Authority workspace resolver is not configured.",
          },
          {
            decision:
              "BLOCK",

            reason:
              "Authority workspace resolver is not configured.",

            riskScore:
              100,

            threats,

            permission:
              permission.action,

            policy:
              "allow",

            security:
              "allow",
          },
          "prevented",
          "not_attempted",
        );
      }

      let canonicalWorkspaceId:
        WorkspaceId;

      try {

        canonicalWorkspaceId =
          workspaceId(
            workspaceResolver(
              request,
            ),
          );

      } catch (error) {

        const authorityReason =
          error instanceof Error
            ? error.message
            : "Canonical authority workspace resolution failed.";

        return this.complete(
          request,
          {
            ...metadata,

            authorityDecision:
              "BLOCK",

            authorityReason,
          },
          {
            decision:
              "BLOCK",

            reason:
              authorityReason,

            riskScore:
              100,

            threats,

            permission:
              permission.action,

            policy:
              "allow",

            security:
              "allow",
          },
          "prevented",
          "not_attempted",
        );
      }

      const authorityRequest:
        RuntimeExecutionRequest = {

        workspaceId:
          canonicalWorkspaceId,

        requestId:
          String(
            metadata.executionId,
          ),

        agentId:
          request.agentId,

        action:
          request.action,

        payload:
          request.input,
      };

      const authority =
        this.authorityExecutionGate.check(
          authorityRequest,
        );

      if (authority.allowed) {

        metadata.authorityDecision =
          "ALLOW";

        metadata.authorityWorkspaceId =
          canonicalWorkspaceId;

        metadata.authorityExecutionId =
          String(
            metadata.executionId,
          );

        const continuityProvider =
          this.authorityExecutionContextProvider;

        if (!continuityProvider) {
          return this.complete(
            request,
            {
              ...metadata,
              continuitySealStatus:
                "BLOCKED_NO_CONTEXT_PROVIDER",
            },
            {
              decision:
                "BLOCK",
              reason:
                "Continuity Seal requires a trusted authority context provider.",
              riskScore:
                100,
              threats,
              permission:
                permission.action,
              policy:
                "allow",
              security:
                "allow",
            },
            "prevented",
            "not_attempted",
          );
        }

        try {
          const continuityContext =
            continuityProvider.resolve(
              authorityRequest,
            );

          const suppliedContinuitySeal =
            request.metadata
              ?.continuitySeal as
              | ContinuitySeal
              | undefined;

          if (suppliedContinuitySeal) {
            const verification =
              this.continuitySealEngine.verify(
                suppliedContinuitySeal,
                {
                  workspaceId:
                    canonicalWorkspaceId,
                  agentId:
                    request.agentId,
                  executionId:
                    String(
                      metadata.executionId,
                    ),
                  action:
                    request.action,
                  resource:
                    request.tool,
                  tool:
                    request.tool,
                  input:
                    request.input,
                  transitiveAuthority:
                    continuityContext.transitiveAuthority,
                  authorityDriftSeverity:
                    continuityContext.authorityDriftSeverity,
                  containmentAction:
                    continuityContext.containmentAction,
                },
              );

            if (!verification.valid) {
              metadata.continuitySealStatus =
                "INVALID";

              metadata.continuitySealViolation =
                verification.code;

              metadata.continuitySealReason =
                verification.reason;

              return this.complete(
                request,
                metadata,
                {
                  decision:
                    "BLOCK",
                  reason:
                    `[CONTINUITY_SEAL:${verification.code}] ${verification.reason}`,
                  riskScore:
                    100,
                  threats,
                  permission:
                    permission.action,
                  policy:
                    "allow",
                  security:
                    "allow",
                },
                "prevented",
                "not_attempted",
              );
            }

            metadata.continuitySealStatus =
              "VERIFIED";

            metadata.continuitySeal =
              suppliedContinuitySeal;

          } else {
            const seal =
              this.continuitySealEngine.create(
                {
                  workspaceId:
                    canonicalWorkspaceId,
                  agentId:
                    request.agentId,
                  executionId:
                    String(
                      metadata.executionId,
                    ),
                  action:
                    request.action,
                  resource:
                    request.tool,
                  tool:
                    request.tool,
                  input:
                    request.input,
                  transitiveAuthority:
                    continuityContext.transitiveAuthority,
                  authorityDriftSeverity:
                    continuityContext.authorityDriftSeverity,
                  containmentAction:
                    continuityContext.containmentAction,
                },
              );

            metadata.continuitySeal =
              seal;

            metadata.continuitySealStatus =
              "SEALED";

            metadata.continuitySealId =
              seal.sealId;

            metadata.continuitySealHash =
              seal.sealHash;
          }

        } catch (error) {
          metadata.continuitySealStatus =
            "BLOCKED";

          metadata.continuitySealReason =
            error instanceof Error
              ? error.message
              : "Continuity Seal creation failed.";

          return this.complete(
            request,
            metadata,
            {
              decision:
                "BLOCK",
              reason:
                `[CONTINUITY_SEAL:BLOCK] ${metadata.continuitySealReason}`,
              riskScore:
                100,
              threats,
              permission:
                permission.action,
              policy:
                "allow",
              security:
                "allow",
            },
            "prevented",
            "not_attempted",
          );
        }

      } else {

        metadata.authorityDecision =
          authority.decision;

        metadata.authorityWorkspaceId =
          canonicalWorkspaceId;

        metadata.authorityExecutionId =
          String(
            metadata.executionId,
          );

        metadata.authorityReason =
          authority.reason;

        const authorityRiskScore =
          authority.decision === "BLOCK"
            ? Math.max(
                riskScore,
                100,
              )
            : Math.max(
                riskScore,
                50,
              );

        return this.complete(
          request,
          metadata,
          {
            decision:
              authority.decision,

            reason:
              authority.reason,

            riskScore:
              authorityRiskScore,

            threats,

            permission:
              permission.action,

            policy:
              "allow",

            security:
              "allow",
          },
          authority.decision === "ESCALATE"
            ? "escalated"
            : "prevented",
          "not_attempted",
        );
      }
    }

    if (
      permission.action === "review" &&
      !approvalResume
    ) {

      const approval =
        this.approvals.create({
          agentId:
            request.agentId,

          action:
            request.action,

          traceId,
          decisionId,
          executionId,

          request: {
            resourceType:
              request.resourceType,

            tool:
              request.tool,

            input:
              request.input,
          },

          expiresAt:
            new Date(
              Date.now() + 5 * 60_000,
            ).toISOString(),
        });

      metadata.approvalId =
        approval.approvalId;

      metadata.runtimeApprovalId =
        approval.approvalId;

      if (
        this.enterpriseApprovalConfig &&
        this.enterpriseBridge
      ) {

        const enterprise =
          this.enterpriseBridge.create({

            workspaceId:
              this.enterpriseApprovalConfig.workspaceId,

            requesterId:
              this.enterpriseApprovalConfig.requesterId,

            runtimeApproval: {
              approvalId:
                approval.approvalId,

              agentId:
                approval.agentId,

              action:
                approval.action,

              traceId:
                approval.traceId,

              decisionId:
                approval.decisionId,

              executionId:
                approval.executionId,

              request: {
                resourceType:
                  request.resourceType,

                tool:
                  request.tool,

                input:
                  request.input,
              },

              expiresAt:
                approval.expiresAt,

              status:
                approval.status,
            },

            evidenceId:
              evidenceId,

            riskScore:
              Math.max(
                riskScore,
                50,
              ),

            reason:
              "Execution requires permission review.",

          });

        metadata.enterpriseApprovalId =
          enterprise.approvalId;
      }

      return this.complete(
        request,
        metadata,
        {
          decision: "ESCALATE",
          reason:
            "Execution requires permission review.",
          riskScore: Math.max(
            riskScore,
            50,
          ),
          threats,
          permission: "review",
          policy: "allow",
          security: "allow",
        },
        "escalated",
        "not_attempted",
      );
    }

    if (approvalResume) {

      if (
        this.enterpriseApprovalConfig &&
        this.enterpriseBridge
      ) {

        const enterprise =
          this.enterpriseBridge
            .getByRuntimeApprovalId(
              this.enterpriseApprovalConfig.workspaceId,
              approvalResume.approvalId,
            );

        if (!enterprise) {
          throw new Error(
            "Enterprise approval binding not found.",
          );
        }

        this.enterpriseBridge.consume({

          workspaceId:
            this.enterpriseApprovalConfig.workspaceId,

          runtimeApprovalId:
            approvalResume.approvalId,

          executionId:
            approvalResume.executionId,
        });

        metadata.enterpriseApprovalId =
          enterprise.approvalId;

        metadata.runtimeApprovalId =
          enterprise.runtimeApprovalId;
      }

      this.approvals.consume({
        approvalId:
          approvalResume.approvalId,

        agentId:
          request.agentId,

        action:
          request.action,

        traceId:
          approvalResume.traceId,

        decisionId:
          approvalResume.decisionId,

        executionId:
          approvalResume.executionId,

        request: {
          resourceType:
            request.resourceType,

          tool:
            request.tool,

          input:
            request.input,
        },
      });

      metadata.approvalId =
        approvalResume.approvalId;
    }

    return this.complete(
      request,
      metadata,
      {
        decision: "ALLOW",
        reason:
          "Permission, policy, security and risk checks passed.",
        riskScore,
        threats,
        permission: permission.action,
        policy: "allow",
        security: "allow",
      },
      "not_executed",
      "not_attempted",
    );
  }

  /**
   * 4.0-12 Delegation Authority Contract enforcement.
   *
   * The delegation contract is evaluated before normal execution.
   *
   * BLOCK / ESCALATE:
   *   - no execution is attempted
   *   - decision/evidence/audit are persisted
   *
   * ALLOW:
   *   - continues through the canonical EnforcementGate pipeline
   */
  /**
   * 4.0-12 Delegation Authority Contract enforcement.
   *
   * Every contract decision is persisted through the canonical
   * decision/evidence/audit path before execution.
   *
   * BLOCK / ESCALATE:
   *   - zero execution
   *   - decision recorded
   *   - evidence recorded
   *
   * ALLOW:
   *   - continues through normal EnforcementGate governance
   */
  async enforceDelegationContract(input: {
    contract: DelegationAuthorityContract;
    graph: CompromiseSimulationGraph;
    workspaceId: string;
    taskId: string;
    now: string;
    request: EnforcementRequest;
  }): Promise<EnforcementResult> {

    const traceId =
      crypto.randomUUID();

    const decisionId =
      crypto.randomUUID();

    const executionId =
      crypto.randomUUID();

    const evidenceId =
      crypto.randomUUID();

    const metadata: Record<string, unknown> = {
      ...(input.request.metadata ?? {}),

      delegated: true,

      correlationId:
        traceId,

      traceId,

      decisionId,

      executionId,

      evidenceId,

      delegationContractId:
        input.contract.contractId,

      delegationContractHash:
        input.contract.contractHash,

      delegationTaskId:
        input.contract.taskId,

      delegationIssuerAgentId:
        input.contract.issuerAgentId,

      delegationDelegateAgentId:
        input.contract.delegateAgentId,
    };

    const completeContractDecision = async (
      decision:
        | "BLOCK"
        | "ESCALATE",
      reason: string,
      failureCode: string,
      reasonCodes: readonly string[] = [],
    ): Promise<EnforcementResult> => {

      const failureMetadata = {
        ...metadata,

        delegationFailureCode:
          failureCode,

        delegationReasonCodes:
          [...reasonCodes],

        delegationDecision:
          decision,
      };

      return this.complete(
        input.request,

        failureMetadata,

        {
          decision,

          reason,

          riskScore:
            decision === "ESCALATE"
              ? 50
              : 100,

          threats: [],

          permission:
            decision === "ESCALATE"
              ? "review"
              : "deny",

          policy: "allow",

          security: "allow",
        },

        decision === "ESCALATE"
          ? "escalated"
          : "prevented",

        "not_attempted",
      );
    };

    /*
     * Runtime identity must match the contract delegate.
     * This check belongs inside the governed decision path so
     * forged execution context attempts are auditable.
     */
    if (
      input.request.agentId !==
      input.contract.delegateAgentId
    ) {
      return completeContractDecision(
        "BLOCK",

        "Delegation contract delegate identity does not match execution context.",

        "DELEGATE_IDENTITY_MISMATCH",
      );
    }

    /*
     * Requested tool must be explicitly contained by the
     * contract scope before any execution can occur.
     */
    if (
      input.request.tool !== undefined &&
      !input.contract.scope.toolIds.includes(
        `tool:${input.request.tool}`,
      )
    ) {
      return completeContractDecision(
        "BLOCK",

        `Tool ${input.request.tool} is outside the delegation contract scope.`,

        "TOOL_OUTSIDE_CONTRACT_SCOPE",
      );
    }

    let evaluation:
      ReturnType<
        DelegationAuthorityContractEngine["evaluate"]
      >;

    try {
      const engine =
        new DelegationAuthorityContractEngine();

      evaluation =
        engine.evaluate({
          contract:
            input.contract,

          graph:
            input.graph,

          workspaceId:
            input.workspaceId,

          taskId:
            input.taskId,

          now:
            input.now,
        });
    } catch (error) {

      return completeContractDecision(
        "BLOCK",

        error instanceof Error
          ? error.message
          : "Delegation authority contract evaluation failed closed.",

        "CONTRACT_EVALUATION_ERROR",

        ["INVALID_GRAPH"],
      );
    }

    const allowedMetadata = {
      ...metadata,

      delegationDecision:
        evaluation.decision,

      delegationReasonCodes:
        [...evaluation.reasonCodes],

      delegationObservedDepth:
        evaluation.observedDelegationDepth,
    };

    if (
      evaluation.decision ===
      "ALLOW"
    ) {
      return this.enforce({
        ...input.request,

        metadata:
          allowedMetadata,
      });
    }

    const escalation =
      evaluation.decision ===
      "ESCALATE";

    return this.complete(
      input.request,

      allowedMetadata,

      {
        decision:
          evaluation.decision,

        reason:
          evaluation.reasons.join("; ") ||
          "Delegation authority contract denied execution.",

        riskScore:
          escalation
            ? 50
            : 100,

        threats: [],

        permission:
          escalation
            ? "review"
            : "deny",

        policy: "allow",

        security: "allow",
      },

      escalation
        ? "escalated"
        : "prevented",

      "not_attempted",
    );
  }
  public verifyContinuitySealForExecution(
    request: EnforcementRequest,
    seal: ContinuitySeal,
  ): ContinuitySealVerification {

    const provider =
      this.authorityExecutionContextProvider;

    const workspaceResolver =
      this.authorityExecutionWorkspaceResolver;

    if (
      !provider ||
      !workspaceResolver
    ) {
      return {
        valid:
          false,
        code:
          "INVALID_SEAL",
        reason:
          "Continuity Seal verification requires a trusted authority context provider.",
        sealId:
          seal.sealId,
      };
    }

    let canonicalWorkspaceId:
      WorkspaceId;

    try {
      canonicalWorkspaceId =
        workspaceId(
          workspaceResolver(
            request,
          ),
        );
    } catch (error) {
      return {
        valid:
          false,
        code:
          "WORKSPACE_MISMATCH",
        reason:
          error instanceof Error
            ? error.message
            : "Canonical workspace resolution failed.",
        sealId:
          seal.sealId,
      };
    }

    const runtimeRequest:
      RuntimeExecutionRequest = {
      workspaceId:
        canonicalWorkspaceId,

      requestId:
        String(
          request.metadata?.executionId ??
          seal.executionId,
        ),

      agentId:
        request.agentId,

      action:
        request.action,

      payload:
        request.input,
    };

    try {

      const currentContext =
        provider.resolve(
          runtimeRequest,
        );

      return this.continuitySealEngine.verify(
        seal,
        {
          workspaceId:
            canonicalWorkspaceId,

          agentId:
            request.agentId,

          executionId:
            String(
              request.metadata?.executionId ??
              seal.executionId,
            ),

          action:
            request.action,

          resource:
            request.tool,

          tool:
            request.tool,

          input:
            request.input,

          transitiveAuthority:
            currentContext.transitiveAuthority,

          authorityDriftSeverity:
            currentContext.authorityDriftSeverity,

          containmentAction:
            currentContext.containmentAction,
        },
      );

    } catch (error) {

      return {
        valid:
          false,

        code:
          "INVALID_SEAL",

        reason:
          error instanceof Error
            ? error.message
            : "Continuity Seal verification failed closed.",
        sealId:
          seal.sealId,
      };
    }
  }

    public reconcileContinuityEffect(
    seal: ContinuitySeal,
    effect: Parameters<
      ContinuitySealEngine["reconcileEffect"]
    >[1],
  ): ContinuitySealVerification {

    const reconciliation =
      this.continuitySealEngine
        .reconcileEffect(
          seal,
          effect,
        );

    return {
      ...reconciliation,
      sealId:
        seal.sealId,
    };
  }

  async evaluate(
    request: EnforcementRequest,
  ): Promise<EnforcementResult> {
    return this.enforce(request);
  }

  private async complete(
    request: EnforcementRequest,
    metadata: Record<string, unknown>,
    base: Omit<
      EnforcementResult,
      | "traceId"
      | "decisionId"
      | "executionId"
      | "evidenceId"
      | "enforcementStatus"
      | "executionOutcome"
    >,
    enforcementStatus:
      | "not_executed"
      | "executed"
      | "prevented"
      | "escalated",
    executionOutcome:
      | "not_attempted"
      | "succeeded"
      | "failed",
  ): Promise<EnforcementResult> {

    const traceId =
      String(metadata.traceId);

    const decisionId =
      String(metadata.decisionId);

    const executionId =
      String(metadata.executionId);

    const evidenceId =
      String(metadata.evidenceId);

    const result: EnforcementResult = {
      ...base,
      continuitySeal: metadata.continuitySeal as EnforcementResult["continuitySeal"],
      traceId,
      decisionId,
      executionId,
      evidenceId,
      enforcementStatus,
      executionOutcome,
    };

    await this.audit(
      request,
      result,
      metadata,
    );

    return result;
  }

  private async audit(
    request: EnforcementRequest,
    result: EnforcementResult,
    metadata: Record<string, unknown>,
  ): Promise<void> {

    const auditRecord:
      EnforcementAuditRecord = {
        agentId: request.agentId,
        resourceType:
          request.resourceType,
        tool: request.tool,
        action: request.action,
        decision: result.decision,
        reason: result.reason,
        riskScore: result.riskScore,
        threats: result.threats,
        metadata,
      };

    this.context.decisionStore.record({
      id: result.decisionId,

      agentId:
        auditRecord.agentId,

      action:
        auditRecord.action,

      decision:
        auditRecord.decision.toLowerCase() as
          | "allow"
          | "block"
          | "escalate",

      reason:
        auditRecord.reason,

      timestamp:
        new Date(),

      riskScore:
        auditRecord.riskScore,

      traceId:
        result.traceId,

      decisionId:
        result.decisionId,

      executionId:
        result.executionId,

      evidenceId:
        result.evidenceId,

      enforcementStatus:
        result.enforcementStatus,

      executionOutcome:
        result.executionOutcome,

      metadata: {
        resourceType:
          auditRecord.resourceType,

        tool:
          auditRecord.tool,

        threats:
          auditRecord.threats,

        ...(auditRecord.metadata ?? {}),
      },
    });

    this.context.evidenceStore.record({
      evidenceId:
        result.evidenceId,

      traceId:
        result.traceId,

      decisionId:
        result.decisionId,

      executionId:
        result.executionId,

      agentId:
        request.agentId,

      resourceType:
        request.resourceType,

      tool:
        request.tool,

      action:
        request.action,

      finalDecision:
        result.decision,

      enforcementStatus:
        result.enforcementStatus,

      executionOutcome:
        result.executionOutcome,

      reason:
        result.reason,

      riskScore:
        result.riskScore,

      threats:
        result.threats,

      type:
        "enforcement",

      status:
        "recorded",

      timestamp:
        new Date(),

      metadata,
    });
    /*
     * Enterprise audit identity is independent.
     * auditId MUST NOT reuse decisionId/evidenceId/executionId.
     */
    if (this.enterpriseAuditBridge) {
      const auditId = randomUUID();

      this.enterpriseAuditBridge.record({
        auditId,

        traceId: result.traceId,
        decisionId: result.decisionId,
        executionId: result.executionId,
        evidenceId: result.evidenceId,

        agentId: request.agentId,

        ...(typeof metadata.actorId === "string"
          ? { actorId: metadata.actorId }
          : {}),

        action: request.action,
        resourceType: request.resourceType,

        resource:
          typeof metadata.resource === "string"
            ? metadata.resource
            : request.tool,

        decision: result.decision,
        riskScore: result.riskScore,

        enforcementStatus:
          result.enforcementStatus,

        eventType:
          result.enforcementStatus === "executed"
            ? "execution"
            : result.enforcementStatus === "escalated"
              ? "incident"
              : "decision",

        reason: result.reason,

        metadata: {
          ...metadata,
          auditId,
        },
      });
    }
    if (this.enterpriseEvidenceBridge) {

      this.enterpriseEvidenceBridge.record({
        evidenceId:
          result.evidenceId,

        traceId:
          result.traceId,

        decisionId:
          result.decisionId,

        executionId:
          result.executionId,

        agentId:
          request.agentId,

        ...(typeof metadata.approvalId === "string"
          ? {
              approvalId:
                metadata.approvalId,
            }
          : {}),

        ...(typeof metadata.policyVersion === "number"
          ? {
              policyVersion:
                metadata.policyVersion,
            }
          : {}),

        riskScore:
          result.riskScore,

        finalDecision:
          result.decision,

        enforcementStatus:
          result.enforcementStatus,

        resourceType:
          request.resourceType,

        action:
          request.action,

        ...(request.tool !== undefined
          ? {
              tool:
                request.tool,
            }
          : {}),

        reason:
          result.reason,

        metadata,
      });
    }
  }

  configureEnterpriseAudit(
    config: EnterpriseAuditRuntimeConfig,
  ): void {
    if (this.enterpriseAuditBridge) {
      throw new Error(
        "Enterprise audit bridge is already configured.",
      );
    }

    this.enterpriseAuditBridge =
      new EnterpriseAuditRuntimeBridge(config);
  }
  configureEnterpriseEvidence(
    config: EnterpriseEvidenceRuntimeConfig,
  ): void {

    if (!config.workspaceId.trim()) {
      throw new Error(
        "Enterprise evidence workspaceId is required.",
      );
    }


    if (this.enterpriseEvidenceBridge) {
      throw new Error(
        "Enterprise evidence configuration is immutable after initialization.",
      );
    }

    this.enterpriseEvidenceBridge =
      new EnterpriseEvidenceRuntimeBridge(
        config,
      );
  }

  getEnterpriseAuditBridge():
    EnterpriseAuditRuntimeBridge | undefined {
    return this.enterpriseAuditBridge;
  }
  getEnterpriseEvidenceBridge():
    EnterpriseEvidenceRuntimeBridge | undefined {
    return this.enterpriseEvidenceBridge;
  }
}
