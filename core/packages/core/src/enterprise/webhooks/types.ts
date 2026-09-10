export type EnterpriseWebhookStatus =
  | "ACTIVE"
  | "DISABLED";

export type EnterpriseWebhookDeliveryStatus =
  | "PENDING"
  | "DELIVERING"
  | "SUCCEEDED"
  | "RETRYING"
  | "FAILED"
  | "BLOCKED";

export type EnterpriseWebhookEventType =
  | "alert.created"
  | "incident.created"
  | "incident.updated"
  | "incident.resolved"
  | "audit.created";

export type EnterpriseWebhookEndpoint = Readonly<{
  webhookId: string;
  workspaceId: string;

  name: string;
  url: string;

  status: EnterpriseWebhookStatus;

  secretFingerprint: string;

  eventTypes: readonly EnterpriseWebhookEventType[];

  maxAttempts: number;

  createdAt: Date;
  updatedAt: Date;

  metadata: Readonly<Record<string, unknown>>;
}>;

export type CreateEnterpriseWebhookInput = Readonly<{
  webhookId: string;
  workspaceId: string;

  name: string;
  url: string;

  secretFingerprint: string;

  eventTypes:
    readonly EnterpriseWebhookEventType[];

  maxAttempts?: number;

  metadata?: Readonly<Record<string, unknown>>;
}>;

export type EnterpriseWebhookDelivery = Readonly<{
  deliveryId: string;

  webhookId: string;
  workspaceId: string;

  eventType: EnterpriseWebhookEventType;

  idempotencyKey: string;

  status: EnterpriseWebhookDeliveryStatus;

  attemptCount: number;

  createdAt: Date;
  updatedAt: Date;

  lastAttemptAt?: Date;
  succeededAt?: Date;
  nextRetryAt?: Date;

  responseCode?: number;

  error?: string;

  metadata:
    Readonly<Record<string, unknown>>;
}>;

export type EnterpriseWebhookDeliveryInput = Readonly<{
  deliveryId: string;
  webhookId: string;
  workspaceId: string;
  eventType: EnterpriseWebhookEventType;
  idempotencyKey: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

function assertNonEmpty(
  value: string,
  field: string,
): void {
  if (!value.trim()) {
    throw new Error(
      `Enterprise webhook requires ${field}.`,
    );
  }
}

export function assertEnterpriseWebhookEndpoint(
  endpoint: EnterpriseWebhookEndpoint,
): void {

  assertNonEmpty(
    endpoint.webhookId,
    "webhookId",
  );

  assertNonEmpty(
    endpoint.workspaceId,
    "workspaceId",
  );

  assertNonEmpty(
    endpoint.name,
    "name",
  );

  assertNonEmpty(
    endpoint.url,
    "url",
  );

  assertNonEmpty(
    endpoint.secretFingerprint,
    "secretFingerprint",
  );

  if (
    endpoint.eventTypes.length === 0
  ) {
    throw new Error(
      "Enterprise webhook requires at least one event type.",
    );
  }

  if (
    !Number.isInteger(
      endpoint.maxAttempts,
    ) ||
    endpoint.maxAttempts < 1
  ) {
    throw new Error(
      "Enterprise webhook maxAttempts must be at least 1.",
    );
  }
}
