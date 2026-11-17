import { ApprovalEngine } from "./approval-engine";
import type {
  ApprovalConsumeInput,
  ApprovalCreateInput,
  ApprovalDecisionInput,
  ApprovalRecord,
  ApprovalStore,
} from "./approval";
import { buildApprovalPreview } from "./approval-preview";
import type { RuntimeApprovalPreview } from "./approval-preview";

const MAX_PREVIEWS = 500;

/**
 * ApprovalEngine that also keeps a bounded in-memory preview of each request.
 * Previews are never written to the ApprovalStore, so a persistent store does
 * not receive request content. They are dropped on consume, reject and expire.
 */
export class PreviewingApprovalEngine extends ApprovalEngine {

  private readonly previews = new Map<string, RuntimeApprovalPreview>();

  constructor(store?: ApprovalStore) {
    super(store);
  }

  override create(input: ApprovalCreateInput): ApprovalRecord {
    const record = super.create(input);
    this.previews.set(record.approvalId, buildApprovalPreview(input.request));
    this.pruneSettled();
    while (this.previews.size > MAX_PREVIEWS) {
      const oldest = this.previews.keys().next().value;
      if (oldest === undefined) break;
      this.previews.delete(oldest);
    }
    return record;
  }

  override reject(input: ApprovalDecisionInput & { reason?: string }): ApprovalRecord {
    const record = super.reject(input);
    this.previews.delete(record.approvalId);
    return record;
  }

  override expire(approvalId: string): ApprovalRecord {
    const record = super.expire(approvalId);
    this.previews.delete(record.approvalId);
    return record;
  }

  override consume(input: ApprovalConsumeInput): ApprovalRecord {
    const record = super.consume(input);
    this.previews.delete(record.approvalId);
    return record;
  }

  /** Drops previews of approvals that are no longer pending or approved (for example expired by time). */
  private pruneSettled(): void {
    for (const id of [...this.previews.keys()]) {
      const record = this.get(id);
      if (!record || (record.status !== "pending" && record.status !== "approved")) {
        this.previews.delete(id);
      }
    }
  }
  getPreview(approvalId: string): RuntimeApprovalPreview | undefined {
    const preview = this.previews.get(approvalId);
    return preview ? structuredClone(preview) : undefined;
  }
}