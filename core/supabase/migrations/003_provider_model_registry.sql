-- Aegisora 3.0
-- Provider / model governance registry.
--
-- Secrets are NOT stored here.
-- credential_ref is an opaque reference into a secret-management layer.

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique,
  kind text not null check (
    kind in ('openai','anthropic','gemini','groq','custom')
  ),
  name text not null,
  status text not null default 'active' check (
    status in ('active','disabled','degraded','deprecated')
  ),
  endpoint text,
  capabilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  model_key text not null,
  model_name text not null,
  display_name text not null,
  status text not null default 'active' check (
    status in ('active','disabled','deprecated')
  ),
  capabilities jsonb not null default '[]'::jsonb,
  context_window integer,
  max_output_tokens integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(provider_id, model_key)
);

create table if not exists public.workspace_provider_bindings (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  enabled boolean not null default false,
  credential_ref text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key(workspace_id, provider_id)
);

create table if not exists public.workspace_model_bindings (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key(workspace_id, model_id)
);

create index if not exists models_provider_id_idx
  on public.models(provider_id);

create index if not exists workspace_provider_bindings_workspace_idx
  on public.workspace_provider_bindings(workspace_id);

create index if not exists workspace_model_bindings_workspace_idx
  on public.workspace_model_bindings(workspace_id);

alter table public.providers enable row level security;
alter table public.models enable row level security;
alter table public.workspace_provider_bindings enable row level security;
alter table public.workspace_model_bindings enable row level security;

drop policy if exists providers_read_authenticated on public.providers;
create policy providers_read_authenticated
on public.providers
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_provider_bindings wpb
    where wpb.provider_id = providers.id
      and public.is_workspace_member(wpb.workspace_id)
  )
);

drop policy if exists models_read_authenticated on public.models;
create policy models_read_authenticated
on public.models
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_model_bindings wmb
    where wmb.model_id = models.id
      and public.is_workspace_member(wmb.workspace_id)
  )
);

drop policy if exists workspace_provider_binding_read on public.workspace_provider_bindings;
create policy workspace_provider_binding_read
on public.workspace_provider_bindings
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists workspace_provider_binding_write on public.workspace_provider_bindings;
create policy workspace_provider_binding_write
on public.workspace_provider_bindings
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin']::public.workspace_role[]
  )
);

drop policy if exists workspace_provider_binding_update on public.workspace_provider_bindings;
create policy workspace_provider_binding_update
on public.workspace_provider_bindings
for update
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin']::public.workspace_role[]
  )
)
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin']::public.workspace_role[]
  )
);

drop policy if exists workspace_provider_binding_delete on public.workspace_provider_bindings;
create policy workspace_provider_binding_delete
on public.workspace_provider_bindings
for delete
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin']::public.workspace_role[]
  )
);

drop policy if exists workspace_model_binding_read on public.workspace_model_bindings;
create policy workspace_model_binding_read
on public.workspace_model_bindings
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists workspace_model_binding_write on public.workspace_model_bindings;
create policy workspace_model_binding_write
on public.workspace_model_bindings
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']::public.workspace_role[]
  )
);

drop policy if exists workspace_model_binding_update on public.workspace_model_bindings;
create policy workspace_model_binding_update
on public.workspace_model_bindings
for update
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']::public.workspace_role[]
  )
)
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']::public.workspace_role[]
  )
);

drop policy if exists workspace_model_binding_delete on public.workspace_model_bindings;
create policy workspace_model_binding_delete
on public.workspace_model_bindings
for delete
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']::public.workspace_role[]
  )
);

revoke all on public.providers from anon;
revoke all on public.models from anon;
revoke all on public.workspace_provider_bindings from anon;
revoke all on public.workspace_model_bindings from anon;

grant select on public.providers to authenticated;
grant select on public.models to authenticated;

grant select, insert, update, delete
on public.workspace_provider_bindings
to authenticated;

grant select, insert, update, delete
on public.workspace_model_bindings
to authenticated;
