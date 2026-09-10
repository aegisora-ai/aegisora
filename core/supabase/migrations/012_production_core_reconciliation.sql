-- ============================================================
-- AEGISORA 3.0
-- 012 — Production Core Reconciliation
--
-- Non-destructive:
--   - no DROP TABLE
--   - no TRUNCATE
--   - no DELETE
--   - no data rewrite
--
-- Purpose:
--   Bring production toward the canonical Aegisora 3.0
--   enterprise control-plane schema.
-- ============================================================

-- ============================================================
-- PROVIDER / MODEL REGISTRY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null,
  slug text not null,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(provider_id, slug)
);

CREATE TABLE IF NOT EXISTS public.workspace_provider_bindings (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  enabled boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, provider_id)
);

CREATE TABLE IF NOT EXISTS public.workspace_model_bindings (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  enabled boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, model_id)
);

-- ============================================================
-- POLICY BINDINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workspace_policy_bindings (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, policy_id)
);

-- ============================================================
-- RISK
-- ============================================================

CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  request_id text not null,
  agent_id text not null,
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null check (
    risk_level in ('low','medium','high','critical')
  ),
  suspicious boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.risk_signals (
  id uuid primary key default gen_random_uuid(),
  risk_assessment_id uuid not null references public.risk_assessments(id) on delete cascade,
  signal_type text not null,
  severity text not null check (
    severity in ('low','medium','high','critical')
  ),
  score integer not null check (score between 0 and 100),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================
-- CONTROL DECISIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.control_decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  request_id text not null,
  agent_id text not null,
  decision text not null check (
    decision in ('ALLOW','BLOCK','ESCALATE')
  ),
  reason text not null check (
    reason in ('risk','policy','combined','system')
  ),
  risk_assessment_id uuid references public.risk_assessments(id) on delete set null,
  policy_id uuid references public.policies(id) on delete set null,
  policy_version_id uuid references public.policy_versions(id) on delete set null,
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null check (
    risk_level in ('low','medium','high','critical')
  ),
  decided_at timestamptz not null default timezone('utc', now()),
  unique(workspace_id, request_id)
);

-- ============================================================
-- RUNTIME CONTROL BRIDGE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.runtime_control_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  request_id text not null,
  agent_id text not null,
  action text not null,
  decision text not null check (
    decision in ('ALLOW','BLOCK','ESCALATE')
  ),
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null check (
    risk_level in ('low','medium','high','critical')
  ),
  control_decision_id uuid references public.control_decisions(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- ============================================================
-- ENTERPRISE APPROVALS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.approval_requests (
  approval_id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id text not null,
  requester_id uuid not null,
  decision_id text not null,
  trace_id text not null,
  execution_id text not null,
  evidence_id text not null,
  action text not null,
  resource_type text not null,
  resource text not null,
  risk_score integer not null check (risk_score between 0 and 100),
  policy_version integer,
  decision text not null check (
    decision in ('ALLOW','BLOCK','ESCALATE')
  ),
  status text not null default 'pending' check (
    status in (
      'pending',
      'approved',
      'rejected',
      'expired',
      'consumed'
    )
  ),
  reason text not null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  approved_at timestamptz,
  approved_by uuid,
  rejected_at timestamptz,
  rejected_by uuid,
  rejection_reason text,
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_reason text,
  consumed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint approval_expiry_after_creation
    check (expires_at > created_at)
);

-- ============================================================
-- ENTERPRISE EVIDENCE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_evidence (
  evidence_id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  trace_id text not null,
  decision_id text not null,
  execution_id text not null,
  agent_id text not null,
  approval_id text,
  policy_version integer,
  risk_score integer not null check (risk_score between 0 and 100),
  final_decision text not null check (
    final_decision in ('ALLOW','BLOCK','ESCALATE')
  ),
  enforcement_status text not null check (
    enforcement_status in (
      'not_executed',
      'executed',
      'prevented',
      'escalated'
    )
  ),
  resource_type text not null,
  action text not null,
  tool text,
  reason text not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_provider_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_model_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_policy_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_control_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_evidence ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REVOKE PUBLIC CLIENT SURFACE
-- ============================================================

REVOKE ALL ON public.providers FROM anon;
REVOKE ALL ON public.models FROM anon;
REVOKE ALL ON public.workspace_provider_bindings FROM anon;
REVOKE ALL ON public.workspace_model_bindings FROM anon;
REVOKE ALL ON public.workspace_policy_bindings FROM anon;
REVOKE ALL ON public.risk_assessments FROM anon;
REVOKE ALL ON public.risk_signals FROM anon;
REVOKE ALL ON public.control_decisions FROM anon;
REVOKE ALL ON public.runtime_control_events FROM anon;
REVOKE ALL ON public.approval_requests FROM anon;
REVOKE ALL ON public.enterprise_evidence FROM anon;

-- Authenticated access is policy-controlled.
REVOKE ALL ON public.providers FROM authenticated;
REVOKE ALL ON public.models FROM authenticated;
REVOKE ALL ON public.workspace_provider_bindings FROM authenticated;
REVOKE ALL ON public.workspace_model_bindings FROM authenticated;
REVOKE ALL ON public.workspace_policy_bindings FROM authenticated;
REVOKE ALL ON public.risk_assessments FROM authenticated;
REVOKE ALL ON public.risk_signals FROM authenticated;
REVOKE ALL ON public.control_decisions FROM authenticated;
REVOKE ALL ON public.runtime_control_events FROM authenticated;
REVOKE ALL ON public.approval_requests FROM authenticated;
REVOKE ALL ON public.enterprise_evidence FROM authenticated;

-- ============================================================
-- APPEND-ONLY EVIDENCE
-- ============================================================

DROP POLICY IF EXISTS enterprise_evidence_update_workspace
  ON public.enterprise_evidence;

REVOKE UPDATE ON public.enterprise_evidence FROM authenticated;
REVOKE UPDATE ON public.enterprise_evidence FROM anon;

REVOKE DELETE ON public.enterprise_evidence FROM authenticated;
REVOKE DELETE ON public.enterprise_evidence FROM anon;
