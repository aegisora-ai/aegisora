-- ============================================================
-- 017 — Enterprise Webhook Governance
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_webhooks (

  webhook_id TEXT PRIMARY KEY,

  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,
  url TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (
      status IN (
        'ACTIVE',
        'DISABLED'
      )
    ),

  secret_fingerprint TEXT NOT NULL,

  event_types JSONB NOT NULL,

  max_attempts INTEGER NOT NULL DEFAULT 5
    CHECK (
      max_attempts >= 1
    ),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc', now()),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc', now()),

  metadata JSONB NOT NULL
    DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.enterprise_webhook_deliveries (

  delivery_id TEXT PRIMARY KEY,

  webhook_id TEXT NOT NULL
    REFERENCES public.enterprise_webhooks(webhook_id)
    ON DELETE CASCADE,

  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  event_type TEXT NOT NULL,

  idempotency_key TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (
      status IN (
        'PENDING',
        'DELIVERING',
        'SUCCEEDED',
        'RETRYING',
        'FAILED',
        'BLOCKED'
      )
    ),

  attempt_count INTEGER NOT NULL DEFAULT 0
    CHECK (
      attempt_count >= 0
    ),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc', now()),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc', now()),

  last_attempt_at TIMESTAMPTZ,
  succeeded_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  response_code INTEGER,
  error TEXT,

  metadata JSONB NOT NULL
    DEFAULT '{}'::jsonb,

  CONSTRAINT enterprise_webhook_delivery_workspace_idempotency
    UNIQUE (
      workspace_id,
      idempotency_key
    )
);

CREATE INDEX IF NOT EXISTS
  enterprise_webhooks_workspace_idx
ON public.enterprise_webhooks (
  workspace_id
);

CREATE INDEX IF NOT EXISTS
  enterprise_webhook_deliveries_workspace_created_idx
ON public.enterprise_webhook_deliveries (
  workspace_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  enterprise_webhook_deliveries_status_idx
ON public.enterprise_webhook_deliveries (
  workspace_id,
  status
);

ALTER TABLE public.enterprise_webhooks
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.enterprise_webhooks
  FORCE ROW LEVEL SECURITY;

ALTER TABLE public.enterprise_webhook_deliveries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.enterprise_webhook_deliveries
  FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  enterprise_webhooks_select_workspace
ON public.enterprise_webhooks;

CREATE POLICY
  enterprise_webhooks_select_workspace
ON public.enterprise_webhooks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_webhooks.workspace_id
      AND wm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS
  enterprise_webhook_deliveries_select_workspace
ON public.enterprise_webhook_deliveries;

CREATE POLICY
  enterprise_webhook_deliveries_select_workspace
ON public.enterprise_webhook_deliveries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_webhook_deliveries.workspace_id
      AND wm.user_id = auth.uid()
  )
);

REVOKE UPDATE, DELETE
ON public.enterprise_webhooks
FROM authenticated;

REVOKE UPDATE, DELETE
ON public.enterprise_webhook_deliveries
FROM authenticated;

REVOKE ALL
ON public.enterprise_webhooks
FROM anon;

REVOKE ALL
ON public.enterprise_webhook_deliveries
FROM anon;

COMMENT ON TABLE public.enterprise_webhooks IS
  'Tenant-scoped enterprise webhook endpoints. Secrets are represented only by fingerprints.';
