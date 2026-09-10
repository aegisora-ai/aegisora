-- ============================================================
-- Aegisora 3.0
-- Enterprise control decisions
-- ============================================================

create table if not exists public.control_decisions (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references public.workspaces(id)
    on delete cascade,

  request_id text not null,

  agent_id text not null,

  decision text not null
    check (
      decision in ('ALLOW','BLOCK','ESCALATE')
    ),

  reason text not null
    check (
      reason in ('risk','policy','combined','system')
    ),

  risk_assessment_id uuid
    references public.risk_assessments(id)
    on delete set null,

  policy_id uuid
    references public.policies(id)
    on delete set null,

  policy_version_id uuid
    references public.policy_versions(id)
    on delete set null,

  risk_score integer not null
    check (risk_score >= 0 and risk_score <= 100),

  risk_level text not null
    check (
      risk_level in ('low','medium','high','critical')
    ),

  decided_at timestamptz not null
    default timezone('utc', now()),

  unique(workspace_id, request_id)
);

create index if not exists control_decisions_workspace_idx
  on public.control_decisions(workspace_id);

create index if not exists control_decisions_agent_idx
  on public.control_decisions(workspace_id, agent_id);

create index if not exists control_decisions_decision_idx
  on public.control_decisions(workspace_id, decision);

alter table public.control_decisions
  enable row level security;

drop policy if exists control_decisions_read_workspace
  on public.control_decisions;

create policy control_decisions_read_workspace
on public.control_decisions
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists control_decisions_write_workspace
  on public.control_decisions;

create policy control_decisions_write_workspace
on public.control_decisions
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

revoke all on public.control_decisions from anon;

grant select, insert
on public.control_decisions
to authenticated;
