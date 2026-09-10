create table if not exists public.enterprise_usage_projection (
  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,

  event_count BIGINT NOT NULL DEFAULT 0
    CHECK (event_count >= 0),

  prompt_tokens BIGINT NOT NULL DEFAULT 0
    CHECK (prompt_tokens >= 0),

  completion_tokens BIGINT NOT NULL DEFAULT 0
    CHECK (completion_tokens >= 0),

  total_tokens BIGINT NOT NULL DEFAULT 0
    CHECK (
      total_tokens >= 0
      AND total_tokens = prompt_tokens + completion_tokens
    ),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (
    workspace_id,
    window_start,
    window_end,
    provider_id,
    model_id,
    agent_id
  ),

  CHECK (window_end > window_start)
);

create table if not exists public.enterprise_usage_projection_events (
  event_id TEXT NOT NULL,
  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (
    event_id,
    window_start,
    window_end
  ),

  CHECK (window_end > window_start)
);

alter table public.enterprise_usage_projection enable row level security;
alter table public.enterprise_usage_projection force row level security;

alter table public.enterprise_usage_projection_events enable row level security;
alter table public.enterprise_usage_projection_events force row level security;

drop policy if exists enterprise_usage_projection_workspace_select
on public.enterprise_usage_projection;

create policy enterprise_usage_projection_workspace_select
on public.enterprise_usage_projection
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = enterprise_usage_projection.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists enterprise_usage_projection_no_insert
on public.enterprise_usage_projection;

create policy enterprise_usage_projection_no_insert
on public.enterprise_usage_projection
for insert
to authenticated
with check (false);

drop policy if exists enterprise_usage_projection_no_update
on public.enterprise_usage_projection;

create policy enterprise_usage_projection_no_update
on public.enterprise_usage_projection
for update
to authenticated
using (false)
with check (false);

drop policy if exists enterprise_usage_projection_no_delete
on public.enterprise_usage_projection;

create policy enterprise_usage_projection_no_delete
on public.enterprise_usage_projection
for delete
to authenticated
using (false);

drop policy if exists enterprise_usage_projection_events_no_select
on public.enterprise_usage_projection_events;

create policy enterprise_usage_projection_events_no_select
on public.enterprise_usage_projection_events
for select
to authenticated
using (false);

drop policy if exists enterprise_usage_projection_events_no_insert
on public.enterprise_usage_projection_events;

create policy enterprise_usage_projection_events_no_insert
on public.enterprise_usage_projection_events
for insert
to authenticated
with check (false);

drop policy if exists enterprise_usage_projection_events_no_update
on public.enterprise_usage_projection_events;

create policy enterprise_usage_projection_events_no_update
on public.enterprise_usage_projection_events
for update
to authenticated
using (false)
with check (false);

drop policy if exists enterprise_usage_projection_events_no_delete
on public.enterprise_usage_projection_events;

create policy enterprise_usage_projection_events_no_delete
on public.enterprise_usage_projection_events
for delete
to authenticated
using (false);

revoke all
on public.enterprise_usage_projection
from authenticated, anon;

revoke all
on public.enterprise_usage_projection_events
from authenticated, anon;

grant select
on public.enterprise_usage_projection
to authenticated;

create index if not exists idx_enterprise_usage_projection_workspace_window
on public.enterprise_usage_projection(
  workspace_id,
  window_start,
  window_end
);

create index if not exists idx_enterprise_usage_projection_provider_model
on public.enterprise_usage_projection(
  workspace_id,
  provider_id,
  model_id
);

create or replace function public.project_enterprise_usage_event(
  p_event_id TEXT,
  p_workspace_id UUID,
  p_window_start TIMESTAMPTZ,
  p_window_end TIMESTAMPTZ
)
returns JSONB
language plpgsql
security definer
set search_path = public
as $$
declare
  source_event public.enterprise_usage_ledger%ROWTYPE;
  inserted_count INTEGER;
begin
  if auth.role() <> 'service_role' then
    raise exception 'enterprise usage projection is server-only';
  end if;

  if p_window_end <= p_window_start then
    raise exception 'projection window_end must be greater than window_start';
  end if;

  select *
  into source_event
  from public.enterprise_usage_ledger
  where event_id = p_event_id
    and workspace_id = p_workspace_id
  for share;

  if not found then
    raise exception 'enterprise usage source event not found for workspace';
  end if;

  if source_event.created_at < p_window_start
     or source_event.created_at >= p_window_end then
    return jsonb_build_object(
      'status', 'ignored',
      'event_id', source_event.event_id
    );
  end if;

  insert into public.enterprise_usage_projection_events (
    event_id,
    workspace_id,
    window_start,
    window_end
  )
  values (
    source_event.event_id,
    source_event.workspace_id,
    p_window_start,
    p_window_end
  )
  on conflict (
    event_id,
    window_start,
    window_end
  )
  do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    return jsonb_build_object(
      'status', 'duplicate',
      'event_id', source_event.event_id
    );
  end if;

  insert into public.enterprise_usage_projection (
    workspace_id,
    window_start,
    window_end,
    provider_id,
    model_id,
    agent_id,
    event_count,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    updated_at
  )
  values (
    source_event.workspace_id,
    p_window_start,
    p_window_end,
    source_event.provider_id,
    source_event.model_id,
    source_event.agent_id,
    1,
    source_event.prompt_tokens,
    source_event.completion_tokens,
    source_event.total_tokens,
    now()
  )
  on conflict (
    workspace_id,
    window_start,
    window_end,
    provider_id,
    model_id,
    agent_id
  )
  do update set
    event_count =
      public.enterprise_usage_projection.event_count + 1,

    prompt_tokens =
      public.enterprise_usage_projection.prompt_tokens
      + excluded.prompt_tokens,

    completion_tokens =
      public.enterprise_usage_projection.completion_tokens
      + excluded.completion_tokens,

    total_tokens =
      public.enterprise_usage_projection.total_tokens
      + excluded.total_tokens,

    updated_at = now();

  return jsonb_build_object(
    'status', 'applied',
    'event_id', source_event.event_id,
    'workspace_id', source_event.workspace_id,
    'provider_id', source_event.provider_id,
    'model_id', source_event.model_id,
    'agent_id', source_event.agent_id
  );
end;
$$;

revoke all
on function public.project_enterprise_usage_event(
  TEXT,
  UUID,
  TIMESTAMPTZ,
  TIMESTAMPTZ
)
from public, anon, authenticated;

grant execute
on function public.project_enterprise_usage_event(
  TEXT,
  UUID,
  TIMESTAMPTZ,
  TIMESTAMPTZ
)
to service_role;
