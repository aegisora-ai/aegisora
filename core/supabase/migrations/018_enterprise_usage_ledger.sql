create table if not exists public.enterprise_usage_ledger (
  event_id TEXT PRIMARY KEY,

  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  trace_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,

  agent_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,

  event_type TEXT NOT NULL
    CHECK (
      event_type IN (
        'provider.execution',
        'provider.completion'
      )
    ),

  outcome TEXT NOT NULL
    CHECK (
      outcome IN (
        'executed',
        'failed'
      )
    ),

  prompt_tokens BIGINT NOT NULL
    CHECK (prompt_tokens >= 0),

  completion_tokens BIGINT NOT NULL
    CHECK (completion_tokens >= 0),

  total_tokens BIGINT NOT NULL
    CHECK (
      total_tokens >= 0
      AND total_tokens = prompt_tokens + completion_tokens
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

alter table public.enterprise_usage_ledger enable row level security;
alter table public.enterprise_usage_ledger force row level security;

create policy enterprise_usage_ledger_workspace_select
on public.enterprise_usage_ledger
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = enterprise_usage_ledger.workspace_id
      and wm.user_id = auth.uid()
  )
);

create policy enterprise_usage_ledger_workspace_insert
on public.enterprise_usage_ledger
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = enterprise_usage_ledger.workspace_id
      and wm.user_id = auth.uid()
  )
);

create policy enterprise_usage_ledger_no_update
on public.enterprise_usage_ledger
for update
to authenticated
using (false)
with check (false);

create policy enterprise_usage_ledger_no_delete
on public.enterprise_usage_ledger
for delete
to authenticated
using (false);

revoke update, delete on public.enterprise_usage_ledger from authenticated;
revoke update, delete on public.enterprise_usage_ledger from anon;

grant select, insert on public.enterprise_usage_ledger to authenticated;

create or replace function public.prevent_enterprise_usage_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'enterprise_usage_ledger is append-only';
end;
$$;

drop trigger if exists enterprise_usage_ledger_block_update
on public.enterprise_usage_ledger;

create trigger enterprise_usage_ledger_block_update
before update or delete
on public.enterprise_usage_ledger
for each row
execute function public.prevent_enterprise_usage_ledger_mutation();

create index if not exists idx_enterprise_usage_workspace_created
  on public.enterprise_usage_ledger(workspace_id, created_at desc);

create index if not exists idx_enterprise_usage_trace
  on public.enterprise_usage_ledger(trace_id);

create index if not exists idx_enterprise_usage_execution
  on public.enterprise_usage_ledger(execution_id);

create index if not exists idx_enterprise_usage_provider_model
  on public.enterprise_usage_ledger(provider_id, model_id);
