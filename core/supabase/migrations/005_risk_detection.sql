-- ============================================================
-- Aegisora 3.0
-- Risk assessment + detection signal persistence
-- ============================================================

create table if not exists public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id)
    on delete cascade,
  agent_id text not null,
  action text not null,
  score integer not null
    check (score >= 0 and score <= 100),
  level text not null
    check (
      level in ('low','medium','high','critical')
    ),
  recommended_decision text not null
    check (
      recommended_decision in
      ('ALLOW','BLOCK','ESCALATE')
    ),
  evaluated_at timestamptz not null
    default timezone('utc', now())
);

create table if not exists public.risk_signals (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null
    references public.risk_assessments(id)
    on delete cascade,
  workspace_id uuid not null
    references public.workspaces(id)
    on delete cascade,
  detection_type text not null
    check (
      detection_type in (
        'prompt_injection',
        'destructive_action',
        'privilege_escalation',
        'sensitive_data',
        'data_exfiltration',
        'suspicious_network',
        'unknown_tool',
        'anomalous_behavior'
      )
    ),
  severity text not null
    check (
      severity in ('low','medium','high','critical')
    ),
  score integer not null
    check (score >= 0 and score <= 100),
  confidence numeric(5,4) not null
    check (confidence >= 0 and confidence <= 1),
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null
    default timezone('utc', now())
);

create index if not exists risk_assessments_workspace_idx
  on public.risk_assessments(workspace_id);

create index if not exists risk_assessments_agent_idx
  on public.risk_assessments(workspace_id, agent_id);

create index if not exists risk_signals_workspace_idx
  on public.risk_signals(workspace_id);

create index if not exists risk_signals_assessment_idx
  on public.risk_signals(assessment_id);

alter table public.risk_assessments
  enable row level security;

alter table public.risk_signals
  enable row level security;

drop policy if exists risk_assessments_read_workspace
  on public.risk_assessments;

create policy risk_assessments_read_workspace
on public.risk_assessments
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists risk_assessments_write_workspace
  on public.risk_assessments;

create policy risk_assessments_write_workspace
on public.risk_assessments
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

drop policy if exists risk_signals_read_workspace
  on public.risk_signals;

create policy risk_signals_read_workspace
on public.risk_signals
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists risk_signals_write_workspace
  on public.risk_signals;

create policy risk_signals_write_workspace
on public.risk_signals
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

revoke all on public.risk_assessments from anon;
revoke all on public.risk_signals from anon;

grant select, insert
on public.risk_assessments
to authenticated;

grant select, insert
on public.risk_signals
to authenticated;
