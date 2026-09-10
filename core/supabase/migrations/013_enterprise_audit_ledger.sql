-- ============================================================
-- AEGISORA 3.0
-- 013 — Enterprise Audit Ledger
-- ============================================================
--
-- Persistent enterprise audit ledger.
--
-- Canonical correlation:
--   audit_id
--   trace_id
--   decision_id
--   execution_id
--   evidence_id
--
-- Security guarantees:
--   - workspace isolation through RLS
--   - append-only audit records
--   - no client UPDATE
--   - no client DELETE
--   - risk score bounded 0..100
--   - canonical decision/enforcement state
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_audit_ledger (
  audit_id uuid PRIMARY KEY,

  workspace_id uuid NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  trace_id uuid NOT NULL,
  decision_id uuid NOT NULL,
  execution_id uuid NOT NULL,
  evidence_id uuid NOT NULL,

  -- Runtime agent identity is a canonical application string.
  agent_id text NOT NULL,

  -- Optional authenticated/application actor identity.
  actor_id text,

  action text NOT NULL,
  resource_type text NOT NULL,
  resource text NOT NULL,

  decision text NOT NULL
    CHECK (
      decision IN ('ALLOW', 'BLOCK', 'ESCALATE')
    ),

  risk_score integer NOT NULL
    CHECK (
      risk_score BETWEEN 0 AND 100
    ),

  enforcement_status text NOT NULL
    CHECK (
      enforcement_status IN (
        'not_executed',
        'executed',
        'prevented',
        'escalated'
      )
    ),

  event_type text NOT NULL
    CHECK (
      event_type IN (
        'decision',
        'execution',
        'approval',
        'evidence',
        'incident'
      )
    ),

  reason text NOT NULL,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL
    DEFAULT timezone('utc', now()),

  CONSTRAINT enterprise_audit_ledger_audit_id_unique
    UNIQUE (audit_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_enterprise_audit_workspace_created
ON public.enterprise_audit_ledger (
  workspace_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_audit_trace
ON public.enterprise_audit_ledger (
  workspace_id,
  trace_id
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_audit_decision
ON public.enterprise_audit_ledger (
  workspace_id,
  decision_id
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_audit_execution
ON public.enterprise_audit_ledger (
  workspace_id,
  execution_id
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_audit_evidence
ON public.enterprise_audit_ledger (
  workspace_id,
  evidence_id
);

CREATE INDEX IF NOT EXISTS
  idx_enterprise_audit_agent
ON public.enterprise_audit_ledger (
  workspace_id,
  agent_id,
  created_at DESC
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.enterprise_audit_ledger
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.enterprise_audit_ledger
  FORCE ROW LEVEL SECURITY;

-- ============================================================
-- SELECT POLICY
-- ============================================================

DROP POLICY IF EXISTS
  enterprise_audit_ledger_select
ON public.enterprise_audit_ledger;

CREATE POLICY
  enterprise_audit_ledger_select
ON public.enterprise_audit_ledger
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_audit_ledger.workspace_id
      AND wm.user_id = auth.uid()
  )
);

-- ============================================================
-- INSERT POLICY
-- ============================================================

DROP POLICY IF EXISTS
  enterprise_audit_ledger_insert
ON public.enterprise_audit_ledger;

CREATE POLICY
  enterprise_audit_ledger_insert
ON public.enterprise_audit_ledger
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_audit_ledger.workspace_id
      AND wm.user_id = auth.uid()
  )
);

-- ============================================================
-- UPDATE DENIAL
-- ============================================================

DROP POLICY IF EXISTS
  enterprise_audit_ledger_update
ON public.enterprise_audit_ledger;

CREATE POLICY
  enterprise_audit_ledger_update
ON public.enterprise_audit_ledger
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- ============================================================
-- DELETE DENIAL
-- ============================================================

DROP POLICY IF EXISTS
  enterprise_audit_ledger_delete
ON public.enterprise_audit_ledger;

CREATE POLICY
  enterprise_audit_ledger_delete
ON public.enterprise_audit_ledger
FOR DELETE
TO authenticated
USING (false);

-- ============================================================
-- APPEND-ONLY TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.prevent_enterprise_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION
    'enterprise_audit_ledger is append-only';
END;
$$;

DROP TRIGGER IF EXISTS
  trg_prevent_enterprise_audit_update
ON public.enterprise_audit_ledger;

CREATE TRIGGER
  trg_prevent_enterprise_audit_update
BEFORE UPDATE
ON public.enterprise_audit_ledger
FOR EACH ROW
EXECUTE FUNCTION
  public.prevent_enterprise_audit_mutation();

DROP TRIGGER IF EXISTS
  trg_prevent_enterprise_audit_delete
ON public.enterprise_audit_ledger;

CREATE TRIGGER
  trg_prevent_enterprise_audit_delete
BEFORE DELETE
ON public.enterprise_audit_ledger
FOR EACH ROW
EXECUTE FUNCTION
  public.prevent_enterprise_audit_mutation();

-- ============================================================
-- CLIENT GRANTS
-- ============================================================

REVOKE UPDATE, DELETE
ON public.enterprise_audit_ledger
FROM authenticated;

REVOKE UPDATE, DELETE
ON public.enterprise_audit_ledger
FROM anon;

GRANT SELECT, INSERT
ON public.enterprise_audit_ledger
TO authenticated;

COMMENT ON TABLE public.enterprise_audit_ledger IS
'Append-only Aegisora enterprise audit ledger. Workspace-scoped and correlation-preserving.';
