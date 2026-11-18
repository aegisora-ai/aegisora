import type { ApprovalRecord } from "./approval";
import type { RuntimeApprovalPreview } from "./approval-preview";
import type { PreviewingApprovalEngine } from "./previewing-approval-engine";

export type { RuntimeApprovalPreview } from "./approval-preview";

export type RuntimeApprovalView = ApprovalRecord & {
  /** Present while the approval is pending or approved. */
  readonly preview?: RuntimeApprovalPreview;
};

/**
 * Narrow surface for a human-facing approval UI. It cannot create, consume or
 * expire approvals. Those stay inside the runtime.
 */
export interface RuntimeApprovalController {
  listPending(): RuntimeApprovalView[];
  get(approvalId: string): RuntimeApprovalView | undefined;
  approve(input: { readonly approvalId: string; readonly actorId: string }): RuntimeApprovalView;
  reject(input: {
    readonly approvalId: string;
    readonly actorId: string;
    readonly reason?: string;
  }): RuntimeApprovalView;
}

function asObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Approval input must be an object.");
  }
  return input as Record<string, unknown>;
}

function requireId(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 128 || value.trim() !== value) {
    throw new Error(`${field} must be a non-empty string without surrounding whitespace (max 128 characters).`);
  }
  return value;
}

export function createApprovalController(
  engine: PreviewingApprovalEngine,
  guardResolution: () => void,
): RuntimeApprovalController {

  const view = (record: ApprovalRecord): RuntimeApprovalView => {
    const preview =
      record.status === "pending" || record.status === "approved"
        ? engine.getPreview(record.approvalId)
        : undefined;
    return { ...record, ...(preview ? { preview } : {}) };
  };

  const controller: RuntimeApprovalController = {
    listPending(): RuntimeApprovalView[] {
      return engine.list().filter((record) => record.status === "pending").map(view);
    },

    get(approvalId: string): RuntimeApprovalView | undefined {
      const record = engine.get(requireId(approvalId, "approvalId"));
      return record ? view(record) : undefined;
    },

    approve(input): RuntimeApprovalView {
      guardResolution();
      const o = asObject(input);
      const approvalId = requireId(o.approvalId, "approvalId");
      const actorId = requireId(o.actorId, "actorId");
      return view(engine.approve({ approvalId, actorId }));
    },

    reject(input): RuntimeApprovalView {
      guardResolution();
      const o = asObject(input);
      const approvalId = requireId(o.approvalId, "approvalId");
      const actorId = requireId(o.actorId, "actorId");
      const reason = o.reason;
      if (reason !== undefined && (typeof reason !== "string" || reason.length > 500)) {
        throw new Error("reason must be a string of at most 500 characters.");
      }
      return view(engine.reject({ approvalId, actorId, ...(reason !== undefined ? { reason } : {}) }));
    },
  };

  return Object.freeze(controller);
}