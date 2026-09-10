-- ============================================================
-- 015 — Enterprise Incidents
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_incidents (

  incident_id TEXT PRIMARY KEY,

  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  severity TEXT NOT NULL
    CHECK (
      severity IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
      )
    ),

  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (
      status IN (
        'OPEN',
        'ACKNOWLEDGED',
        'INVESTIGATING',
        'RESOLVED',
        'CLOSED'
      )
    ),

  source TEXT NOT NULL
    CHECK (
      source IN (
        'policy',
        'risk',
        'decision',
        'execution',
        'approval',
        'evidence',
        'audit',
        'runtime',
        'webhook',
        'manual'
      )
    ),

  title TEXT NOT NULL,
  reason TEXT NOT NULL,

  trace_id TEXT,
  decision_id TEXT,
  execution_id TEXT,
  evidence_id TEXT,
  audit_id UUID,
  agent_id TEXT,
  actor_id UUID,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc', now()),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc', now()),

  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  metadata JSONB NOT NULL
    DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS
  enterprise_incidents_workspace_created_idx
ON public.enterprise_incidents (
  workspace_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  enterprise_incidents_workspace_status_idx
ON public.enterprise_incidents (
  workspace_id,
  status
);

CREATE INDEX IF NOT EXISTS
  enterprise_incidents_workspace_severity_idx
ON public.enterprise_incidents (
  workspace_id,
  severity
);

CREATE INDEX IF NOT EXISTS
  enterprise_incidents_trace_idx
ON public.enterprise_incidents (
  workspace_id,
  trace_id
);

CREATE INDEX IF NOT EXISTS
  enterprise_incidents_decision_idx
ON public.enterprise_incidents (
  workspace_id,
  decision_id
);

CREATE INDEX IF NOT EXISTS
  enterprise_incidents_execution_idx
ON public.enterprise_incidents (
  workspace_id,
  execution_id
);

CREATE INDEX IF NOT EXISTS
  enterprise_incidents_agent_idx
ON public.enterprise_incidents (
  workspace_id,
  agent_id
);

ALTER TABLE public.enterprise_incidents
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.enterprise_incidents
  FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  enterprise_incidents_select_workspace
ON public.enterprise_incidents;

CREATE POLICY
  enterprise_incidents_select_workspace
ON public.enterprise_incidents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_incidents.workspace_id
      AND wm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS
  enterprise_incidents_insert_workspace
ON public.enterprise_incidents;

CREATE POLICY
  enterprise_incidents_insert_workspace
ON public.enterprise_incidents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_incidents.workspace_id
      AND wm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS
  enterprise_incidents_update_workspace
ON public.enterprise_incidents;

CREATE POLICY
  enterprise_incidents_update_workspace
ON public.enterprise_incidents
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS
  enterprise_incidents_delete_workspace
ON public.enterprise_incidents;

CREATE POLICY
  enterprise_incidents_delete_workspace
ON public.enterprise_incidents
FOR DELETE
TO authenticated
USING (false);

REVOKE UPDATE
ON public.enterprise_incidents
FROM authenticated;

REVOKE DELETE
ON public.enterprise_incidents
FROM authenticated;

REVOKE ALL
ON public.enterprise_incidents
FROM anon;

GRANT SELECT, INSERT
ON public.enterprise_incidents
TO authenticated;

CREATE OR REPLACE FUNCTION
public.prevent_enterprise_incident_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN

  IF TG_OP = 'UPDATE' THEN

    IF (
      NEW.incident_id IS DISTINCT FROM OLD.incident_id OR
      NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR
      NEW.severity IS DISTINCT FROM OLD.severity OR
      NEW.status IS DISTINCT FROM OLD.status OR
      NEW.source IS DISTINCT FROM OLD.source OR
      NEW.title IS DISTINCT FROM OLD.title OR
      NEW.reason IS DISTINCT FROM OLD.reason OR
      NEW.trace_id IS DISTINCT FROM OLD.trace_id OR
      NEW.decision_id IS DISTINCT FROM OLD.decision_id OR
      NEW.execution_id IS DISTINCT FROM OLD.execution_id OR
      NEW.evidence_id IS DISTINCT FROM OLD.evidence_id OR
      NEW.audit_id IS DISTINCT FROM OLD.audit_id OR
      NEW.agent_id IS DISTINCT FROM OLD.agent_id OR
      NEW.actor_id IS DISTINCT FROM OLD.actor_id OR
      NEW.created_at IS DISTINCT FROM OLD.created_at OR
      NEW.acknowledged_at IS DISTINCT FROM OLD.acknowledged_at OR
      NEW.resolved_at IS DISTINCT FROM OLD.resolved_at OR
      NEW.closed_at IS DISTINCT FROM OLD.closed_at OR
      NEW.metadata IS DISTINCT FROM OLD.metadata
    ) THEN
      RAISE EXCEPTION
        'Enterprise incident mutation must use controlled lifecycle transition';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'Enterprise incidents are append-only and cannot be deleted';
  END IF;

  RETURN NEW;

END;
$$;

DROP TRIGGER IF EXISTS
  enterprise_incident_mutation_guard
ON public.enterprise_incidents;

CREATE TRIGGER
  enterprise_incident_mutation_guard
BEFORE UPDATE OR DELETE
ON public.enterprise_incidents
FOR EACH ROW
EXECUTE FUNCTION
  public.prevent_enterprise_incident_mutation();

COMMENT ON TABLE public.enterprise_incidents IS
  'Enterprise operational incident ledger bound to canonical Aegisora governance correlation identity.';
