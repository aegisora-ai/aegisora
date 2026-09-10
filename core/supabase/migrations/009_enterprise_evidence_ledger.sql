-- ============================================================
-- AEGISORA 3.0
-- 009 — Enterprise Evidence Ledger
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_evidence (
  evidence_id TEXT PRIMARY KEY,

  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE RESTRICT,

  trace_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,

  agent_id TEXT NOT NULL,
  approval_id TEXT,

  policy_version INTEGER,

  risk_score INTEGER NOT NULL
    CHECK (risk_score >= 0 AND risk_score <= 100),

  final_decision TEXT NOT NULL
    CHECK (
      final_decision IN (
        'ALLOW',
        'BLOCK',
        'ESCALATE'
      )
    ),

  enforcement_status TEXT NOT NULL
    CHECK (
      enforcement_status IN (
        'not_executed',
        'executed',
        'prevented',
        'escalated'
      )
    ),

  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  tool TEXT,
  reason TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS enterprise_evidence_workspace_idx
  ON public.enterprise_evidence(workspace_id);

CREATE INDEX IF NOT EXISTS enterprise_evidence_trace_idx
  ON public.enterprise_evidence(workspace_id, trace_id);

CREATE INDEX IF NOT EXISTS enterprise_evidence_decision_idx
  ON public.enterprise_evidence(workspace_id, decision_id);

CREATE INDEX IF NOT EXISTS enterprise_evidence_execution_idx
  ON public.enterprise_evidence(workspace_id, execution_id);

CREATE INDEX IF NOT EXISTS enterprise_evidence_agent_idx
  ON public.enterprise_evidence(workspace_id, agent_id);

CREATE INDEX IF NOT EXISTS enterprise_evidence_approval_idx
  ON public.enterprise_evidence(workspace_id, approval_id);

ALTER TABLE public.enterprise_evidence
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enterprise_evidence_select_workspace
  ON public.enterprise_evidence;

CREATE POLICY enterprise_evidence_select_workspace
ON public.enterprise_evidence
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id, auth.uid())
);

DROP POLICY IF EXISTS enterprise_evidence_insert_workspace
  ON public.enterprise_evidence;

CREATE POLICY enterprise_evidence_insert_workspace
ON public.enterprise_evidence
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id, auth.uid())
);

DROP POLICY IF EXISTS enterprise_evidence_update_workspace
  ON public.enterprise_evidence;

CREATE POLICY enterprise_evidence_update_workspace
ON public.enterprise_evidence
FOR UPDATE
TO authenticated
USING (
  public.has_workspace_role(
    workspace_id,
    auth.uid(),
    ARRAY['owner','admin']::public.workspace_role[]
  )
)
WITH CHECK (
  public.has_workspace_role(
    workspace_id,
    auth.uid(),
    ARRAY['owner','admin']::public.workspace_role[]
  )
);

REVOKE DELETE
ON public.enterprise_evidence
FROM authenticated;

REVOKE DELETE
ON public.enterprise_evidence
FROM anon;

-- Evidence is a security ledger. Mutable operational metadata is
-- intentionally excluded from client authorization.
COMMENT ON TABLE public.enterprise_evidence IS
'Immutable-oriented enterprise evidence ledger bound to workspace, trace, decision and execution identity.';
