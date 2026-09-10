-- ============================================================
-- Aegisora 3.0
-- Runtime/control-plane bridge audit
-- ============================================================

create table if not exists public.runtime_control_events (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references public.workspaces(id)
    on delete cascade,

  request_id text not null,

  agent_id text not null,

  action text not null,

  decision text not null
    check (
      decision in ('ALLOW','BLOCK','ESCALATE')
    ),

  risk_score integer not null
    check (
      risk_score >= 0 and risk_score <= 100
    ),

  risk_level text not null
    check (
      risk_level in ('low','medium','high','critical')
    ),

  control_decision_id uuid
    references public.control_decisions(id)
    on delete set null,

  created_at timestamptz not null
    default timezone('utc', now())
);

create index if not exists runtime_control_events_workspace_idx
  on public.runtime_control_events(workspace_id);

create index if not exists runtime_control_events_request_idx
  on public.runtime_control_events(
    workspace_id,
    request_id
  );

create index if not exists runtime_control_events_decision_idx
  on public.runtime_control_events(
    workspace_id,
    decision
  );

alter table public.runtime_control_events
  enable row level security;

drop policy if exists runtime_control_events_read_workspace
  on public.runtime_control_events;

create policy runtime_control_events_read_workspace
on public.runtime_control_events
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists runtime_control_events_write_workspace
  on public.runtime_control_events;

create policy runtime_control_events_write_workspace
on public.runtime_control_events
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

revoke all
on public.runtime_control_events
from anon;

grant select, insert
on public.runtime_control_events
to authenticated;
