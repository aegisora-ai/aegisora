-- ============================================================
-- AEGISORA 3.0
-- 008 — Enterprise Approval Control Plane
-- ============================================================

CREATE TABLE IF NOT EXISTS public.approval_requests (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  agent_id TEXT NOT NULL,

  requester_id UUID NOT NULL,

  decision_id TEXT NOT NULL,

  trace_id TEXT NOT NULL,

  execution_id TEXT NOT NULL,

  evidence_id TEXT NOT NULL,

  action TEXT NOT NULL,

  resource_type TEXT NOT NULL,

  resource TEXT NOT NULL,

  risk_score INTEGER NOT NULL
    CHECK (risk_score >= 0 AND risk_score <= 100),

  policy_version INTEGER,

  decision TEXT NOT NULL
    CHECK (decision IN ('ALLOW','BLOCK','ESCALATE')),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'approved',
        'rejected',
        'expired',
        'consumed'
      )
    ),

  reason TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  expires_at TIMESTAMPTZ NOT NULL,

  approved_at TIMESTAMPTZ,

  approved_by UUID,

  rejected_at TIMESTAMPTZ,

  rejected_by UUID,

  rejection_reason TEXT,

  resolved_at TIMESTAMPTZ,

  resolved_by UUID,

  resolution_reason TEXT,

  consumed_at TIMESTAMPTZ,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT approval_expiry_after_creation
    CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS approval_requests_workspace_idx
  ON public.approval_requests(workspace_id);

CREATE INDEX IF NOT EXISTS approval_requests_status_idx
  ON public.approval_requests(workspace_id, status);

CREATE INDEX IF NOT EXISTS approval_requests_agent_idx
  ON public.approval_requests(workspace_id, agent_id);

CREATE INDEX IF NOT EXISTS approval_requests_trace_idx
  ON public.approval_requests(workspace_id, trace_id);

CREATE INDEX IF NOT EXISTS approval_requests_decision_idx
  ON public.approval_requests(workspace_id, decision_id);

ALTER TABLE public.approval_requests
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approval_requests_select
  ON public.approval_requests;

DROP POLICY IF EXISTS approval_requests_insert
  ON public.approval_requests;

DROP POLICY IF EXISTS approval_requests_update
  ON public.approval_requests;

CREATE POLICY approval_requests_select
ON public.approval_requests
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY approval_requests_insert
ON public.approval_requests
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_workspace_role(
    workspace_id,
    ARRAY['owner','admin','developer']::public.workspace_role[]
  )
);

CREATE POLICY approval_requests_update
ON public.approval_requests
FOR UPDATE
TO authenticated
USING (
  public.has_workspace_role(
    workspace_id,
    ARRAY['owner','admin']::public.workspace_role[]
  )
)
WITH CHECK (
  public.has_workspace_role(
    workspace_id,
    ARRAY['owner','admin']::public.workspace_role[]
  )
);

REVOKE DELETE
ON public.approval_requests
FROM authenticated;

COMMENT ON TABLE public.approval_requests IS
'Enterprise approval control-plane records bound to workspace, decision, evidence and execution identity.';
