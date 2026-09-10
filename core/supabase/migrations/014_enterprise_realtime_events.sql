-- ============================================================
-- AEGISORA 3.0
-- 014 — Enterprise Realtime Events
-- ============================================================
--
-- Canonical realtime transport ledger.
--
-- Source of truth remains the runtime / enterprise domain.
-- This table is the durable transport surface consumed by
-- realtime subscribers.
--
-- Security:
--   - workspace scoped
--   - RLS + FORCE RLS
--   - authenticated clients can SELECT only
--   - no client INSERT
--   - no client UPDATE
--   - no client DELETE
--   - append-only trigger defense
--   - service-side publisher is authoritative
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_realtime_events (
  event_id text PRIMARY KEY,

  workspace_id uuid NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  event_type text NOT NULL,

  trace_id text NOT NULL,
  decision_id text NOT NULL,
  execution_id text NOT NULL,
  evidence_id text NOT NULL,

  agent_id text NOT NULL,
  actor_id text,

  action text NOT NULL,

  decision text
    CHECK (
      decision IS NULL
      OR decision IN ('ALLOW', 'BLOCK', 'ESCALATE')
    ),

  risk_score integer
    CHECK (
      risk_score IS NULL
      OR risk_score BETWEEN 0 AND 100
    ),

  occurred_at timestamptz NOT NULL
    DEFAULT timezone('utc', now()),

  metadata jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  payload jsonb NOT NULL
    DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL
    DEFAULT timezone('utc', now()),

  CONSTRAINT enterprise_realtime_events_event_id_unique
    UNIQUE (event_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_enterprise_realtime_workspace_created
ON public.enterprise_realtime_events (
  workspace_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_realtime_workspace_type_created
ON public.enterprise_realtime_events (
  workspace_id,
  event_type,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_realtime_trace
ON public.enterprise_realtime_events (
  workspace_id,
  trace_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_realtime_decision
ON public.enterprise_realtime_events (
  workspace_id,
  decision_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_realtime_execution
ON public.enterprise_realtime_events (
  workspace_id,
  execution_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_realtime_agent
ON public.enterprise_realtime_events (
  workspace_id,
  agent_id,
  created_at DESC
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.enterprise_realtime_events
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.enterprise_realtime_events
  FORCE ROW LEVEL SECURITY;

-- ============================================================
-- SELECT
-- ============================================================

DROP POLICY IF EXISTS
  enterprise_realtime_events_select
ON public.enterprise_realtime_events;

CREATE POLICY
  enterprise_realtime_events_select
ON public.enterprise_realtime_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_realtime_events.workspace_id
      AND wm.user_id = auth.uid()
  )
);

-- ============================================================
-- EXPLICIT CLIENT WRITE DENIAL
-- ============================================================

DROP POLICY IF EXISTS
  enterprise_realtime_events_insert
ON public.enterprise_realtime_events;

CREATE POLICY
  enterprise_realtime_events_insert
ON public.enterprise_realtime_events
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS
  enterprise_realtime_events_update
ON public.enterprise_realtime_events;

CREATE POLICY
  enterprise_realtime_events_update
ON public.enterprise_realtime_events
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS
  enterprise_realtime_events_delete
ON public.enterprise_realtime_events;

CREATE POLICY
  enterprise_realtime_events_delete
ON public.enterprise_realtime_events
FOR DELETE
TO authenticated
USING (false);

-- ============================================================
-- APPEND-ONLY TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.prevent_enterprise_realtime_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION
    'enterprise_realtime_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS
  trg_prevent_enterprise_realtime_event_update
ON public.enterprise_realtime_events;

CREATE TRIGGER
  trg_prevent_enterprise_realtime_event_update
BEFORE UPDATE
ON public.enterprise_realtime_events
FOR EACH ROW
EXECUTE FUNCTION
  public.prevent_enterprise_realtime_event_mutation();

DROP TRIGGER IF EXISTS
  trg_prevent_enterprise_realtime_event_delete
ON public.enterprise_realtime_events;

CREATE TRIGGER
  trg_prevent_enterprise_realtime_event_delete
BEFORE DELETE
ON public.enterprise_realtime_events
FOR EACH ROW
EXECUTE FUNCTION
  public.prevent_enterprise_realtime_event_mutation();

-- ============================================================
-- CLIENT GRANTS
-- ============================================================
--
-- Client can read its own workspace events.
-- Client must never manufacture enterprise runtime events.

REVOKE INSERT, UPDATE, DELETE
ON public.enterprise_realtime_events
FROM authenticated;

REVOKE SELECT, INSERT, UPDATE, DELETE
ON public.enterprise_realtime_events
FROM anon;

GRANT SELECT
ON public.enterprise_realtime_events
TO authenticated;

-- ============================================================
-- SUPABASE REALTIME PUBLICATION
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'enterprise_realtime_events'
  ) THEN
    EXECUTE
      'ALTER PUBLICATION supabase_realtime
       ADD TABLE public.enterprise_realtime_events';
  END IF;
END
$$;

COMMENT ON TABLE public.enterprise_realtime_events IS
'Workspace-scoped, append-only Aegisora enterprise realtime event transport ledger.';
