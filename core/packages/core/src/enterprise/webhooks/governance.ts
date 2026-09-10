import {
  EnterpriseWebhookDelivery,
  EnterpriseWebhookDeliveryInput,
  EnterpriseWebhookDeliveryStatus,
  EnterpriseWebhookEndpoint,
  CreateEnterpriseWebhookInput,
  EnterpriseWebhookEventType,
  assertEnterpriseWebhookEndpoint,
} from "./types";

function clone(
  metadata?: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ...(metadata ?? {}),
  });
}

export class EnterpriseWebhookGovernance {

  private readonly endpoints =
    new Map<string, EnterpriseWebhookEndpoint>();

  private readonly deliveries =
    new Map<string, EnterpriseWebhookDelivery>();

  private readonly idempotency =
    new Map<string, string>();

  register(
    input: CreateEnterpriseWebhookInput,
  ): EnterpriseWebhookEndpoint {

    if (
      this.endpoints.has(
        input.webhookId,
      )
    ) {
      throw new Error(
        `Enterprise webhook already exists: ${input.webhookId}`,
      );
    }

    const now =
      new Date();

    const endpoint:
      EnterpriseWebhookEndpoint =
      Object.freeze({
        webhookId:
          input.webhookId,

        workspaceId:
          input.workspaceId,

        name:
          input.name,

        url:
          input.url,

        status:
          "ACTIVE",

        secretFingerprint:
          input.secretFingerprint,

        eventTypes:
          Object.freeze([
            ...input.eventTypes,
          ]),

        maxAttempts:
          input.maxAttempts ??
          5,

        createdAt:
          now,

        updatedAt:
          now,

        metadata:
          clone(
            input.metadata,
          ),
      });

    assertEnterpriseWebhookEndpoint(
      endpoint,
    );

    this.endpoints.set(
      endpoint.webhookId,
      endpoint,
    );

    return endpoint;
  }

  get(
    webhookId: string,
  ): EnterpriseWebhookEndpoint | undefined {
    return this.endpoints.get(
      webhookId,
    );
  }

  getForWorkspace(
    workspaceId: string,
    webhookId: string,
  ): EnterpriseWebhookEndpoint | undefined {

    const endpoint =
      this.endpoints.get(
        webhookId,
      );

    if (!endpoint) {
      return undefined;
    }

    if (
      endpoint.workspaceId !==
      workspaceId
    ) {
      return undefined;
    }

    return endpoint;
  }

  listForWorkspace(
    workspaceId: string,
  ): readonly EnterpriseWebhookEndpoint[] {

    return Object.freeze(
      Array.from(
        this.endpoints.values(),
      ).filter(
        (endpoint) =>
          endpoint.workspaceId ===
          workspaceId,
      ),
    );
  }

  createDelivery(
    input: EnterpriseWebhookDeliveryInput,
  ): EnterpriseWebhookDelivery {

    const endpoint =
      this.getForWorkspace(
        input.workspaceId,
        input.webhookId,
      );

    if (!endpoint) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Webhook not found or workspace mismatch.",
      );
    }

    if (
      endpoint.status !==
      "ACTIVE"
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Webhook endpoint is disabled.",
      );
    }

    if (
      !endpoint.eventTypes.includes(
        input.eventType,
      )
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Webhook event type is not subscribed.",
      );
    }

    const existingId =
      this.idempotency.get(
        `${input.workspaceId}:${input.idempotencyKey}`,
      );

    if (existingId) {
      const existing =
        this.deliveries.get(
          existingId,
        );

      if (existing) {
        return existing;
      }
    }

    if (
      this.deliveries.has(
        input.deliveryId,
      )
    ) {
      throw new Error(
        `Enterprise webhook delivery already exists: ${input.deliveryId}`,
      );
    }

    const now =
      new Date();

    const delivery:
      EnterpriseWebhookDelivery =
      Object.freeze({
        deliveryId:
          input.deliveryId,

        webhookId:
          input.webhookId,

        workspaceId:
          input.workspaceId,

        eventType:
          input.eventType,

        idempotencyKey:
          input.idempotencyKey,

        status:
          "PENDING",

        attemptCount:
          0,

        createdAt:
          now,

        updatedAt:
          now,

        metadata:
          clone(
            input.metadata,
          ),
      });

    this.deliveries.set(
      delivery.deliveryId,
      delivery,
    );

    this.idempotency.set(
      `${input.workspaceId}:${input.idempotencyKey}`,
      delivery.deliveryId,
    );

    return delivery;
  }

  markDelivering(
    workspaceId: string,
    deliveryId: string,
  ): EnterpriseWebhookDelivery {

    const delivery =
      this.getDeliveryForWorkspace(
        workspaceId,
        deliveryId,
      );

    if (!delivery) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Webhook delivery not found or workspace mismatch.",
      );
    }

    if (
      delivery.status ===
        "SUCCEEDED" ||
      delivery.status ===
        "FAILED" ||
      delivery.status ===
        "BLOCKED"
    ) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Terminal webhook delivery cannot be delivered again.",
      );
    }

    const updated =
      this.replaceDelivery(
        delivery,
        {
          status:
            "DELIVERING",

          attemptCount:
            delivery.attemptCount + 1,

          lastAttemptAt:
            new Date(),
        },
      );

    return updated;
  }

  markSucceeded(
    workspaceId: string,
    deliveryId: string,
    responseCode = 200,
  ): EnterpriseWebhookDelivery {

    const delivery =
      this.getDeliveryForWorkspace(
        workspaceId,
        deliveryId,
      );

    if (!delivery) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Webhook delivery not found or workspace mismatch.",
      );
    }

    const updated =
      this.replaceDelivery(
        delivery,
        {
          status:
            "SUCCEEDED",

          responseCode,

          succeededAt:
            new Date(),
        },
      );

    return updated;
  }

  markRetrying(
    workspaceId: string,
    deliveryId: string,
    error: string,
    nextRetryAt: Date,
  ): EnterpriseWebhookDelivery {

    const delivery =
      this.getDeliveryForWorkspace(
        workspaceId,
        deliveryId,
      );

    if (!delivery) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Webhook delivery not found or workspace mismatch.",
      );
    }

    const endpoint =
      this.endpoints.get(
        delivery.webhookId,
      );

    if (!endpoint) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Webhook endpoint missing.",
      );
    }

    if (
      delivery.attemptCount >=
      endpoint.maxAttempts
    ) {
      return this.replaceDelivery(
        delivery,
        {
          status:
            "FAILED",

          error,
        },
      );
    }

    return this.replaceDelivery(
      delivery,
      {
        status:
          "RETRYING",

        error,

        nextRetryAt,
      },
    );
  }

  markFailed(
    workspaceId: string,
    deliveryId: string,
    error: string,
    responseCode?: number,
  ): EnterpriseWebhookDelivery {

    const delivery =
      this.getDeliveryForWorkspace(
        workspaceId,
        deliveryId,
      );

    if (!delivery) {
      throw new Error(
        "[ENFORCEMENT:BLOCK] Webhook delivery not found or workspace mismatch.",
      );
    }

    return this.replaceDelivery(
      delivery,
      {
        status:
          "FAILED",

        error,

        responseCode,
      },
    );
  }

  getDelivery(
    deliveryId: string,
  ): EnterpriseWebhookDelivery | undefined {
    return this.deliveries.get(
      deliveryId,
    );
  }

  getDeliveryForWorkspace(
    workspaceId: string,
    deliveryId: string,
  ): EnterpriseWebhookDelivery | undefined {

    const delivery =
      this.deliveries.get(
        deliveryId,
      );

    if (!delivery) {
      return undefined;
    }

    if (
      delivery.workspaceId !==
      workspaceId
    ) {
      return undefined;
    }

    return delivery;
  }

  private replaceDelivery(
    current: EnterpriseWebhookDelivery,
    changes: Partial<EnterpriseWebhookDelivery>,
  ): EnterpriseWebhookDelivery {

    const updated:
      EnterpriseWebhookDelivery =
      Object.freeze({
        ...current,

        ...changes,

        updatedAt:
          new Date(),

        metadata:
          clone(
            current.metadata,
          ),
      });

    this.deliveries.set(
      updated.deliveryId,
      updated,
    );

    return updated;
  }
}

export function isTerminalWebhookDelivery(
  status: EnterpriseWebhookDeliveryStatus,
): boolean {
  return (
    status === "SUCCEEDED" ||
    status === "FAILED" ||
    status === "BLOCKED"
  );
}

export function isRetryableWebhookDelivery(
  status: EnterpriseWebhookDeliveryStatus,
): boolean {
  return (
    status === "RETRYING"
  );
}

export function isWebhookEventType(
  value: string,
): value is EnterpriseWebhookEventType {
  return [
    "alert.created",
    "incident.created",
    "incident.updated",
    "incident.resolved",
    "audit.created",
  ].includes(value);
}
