-- Aegisora 3.0
-- Policy Studio + immutable versioning + workspace binding.

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id)
    on delete cascade,
  policy_key text not null,
  name text not null,
  description text,
  state text not null default 'draft'
    check (state in ('draft','published','archived')),
  current_version_id uuid,
  created_at timestamptz not null
    default timezone('utc', now()),
  updated_at timestamptz not null
    default timezone('utc', now()),
  unique(workspace_id, policy_key)
);

create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id)
    on delete cascade,
  policy_id uuid not null
    references public.policies(id)
    on delete cascade,
  version_number integer not null
    check (version_number > 0),
  document jsonb not null,
  validation_state text not null default 'not_validated'
    check (
      validation_state in
      ('not_validated','valid','invalid')
    ),
  validation_errors jsonb not null default '[]'::jsonb,
  immutable boolean not null default true,
  created_at timestamptz not null
    default timezone('utc', now()),
  published_at timestamptz,
  published_by uuid,
  unique(policy_id, version_number)
);

alter table public.policies
  add constraint policies_current_version_fk
  foreign key (current_version_id)
  references public.policy_versions(id)
  deferrable initially deferred;

create table if not exists public.workspace_policy_bindings (
  workspace_id uuid not null
    references public.workspaces(id)
    on delete cascade,
  policy_id uuid not null
    references public.policies(id)
    on delete cascade,
  enabled boolean not null default false,
  created_at timestamptz not null
    default timezone('utc', now()),
  updated_at timestamptz not null
    default timezone('utc', now()),
  primary key(workspace_id, policy_id)
);

create index if not exists policies_workspace_idx
  on public.policies(workspace_id);

create index if not exists policy_versions_workspace_idx
  on public.policy_versions(workspace_id);

create index if not exists policy_versions_policy_idx
  on public.policy_versions(policy_id);

create index if not exists workspace_policy_bindings_workspace_idx
  on public.workspace_policy_bindings(workspace_id);

alter table public.policies enable row level security;
alter table public.policy_versions enable row level security;
alter table public.workspace_policy_bindings enable row level security;

drop policy if exists policies_read_workspace
  on public.policies;

create policy policies_read_workspace
on public.policies
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists policies_write_workspace
  on public.policies;

create policy policies_write_workspace
on public.policies
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

drop policy if exists policies_update_workspace
  on public.policies;

create policy policies_update_workspace
on public.policies
for update
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
)
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

drop policy if exists policies_delete_workspace
  on public.policies;

create policy policies_delete_workspace
on public.policies
for delete
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin']
      ::public.workspace_role[]
  )
);

drop policy if exists policy_versions_read_workspace
  on public.policy_versions;

create policy policy_versions_read_workspace
on public.policy_versions
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists policy_versions_write_workspace
  on public.policy_versions;

create policy policy_versions_write_workspace
on public.policy_versions
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

drop policy if exists policy_versions_update_workspace
  on public.policy_versions;

create policy policy_versions_update_workspace
on public.policy_versions
for update
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
)
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

drop policy if exists workspace_policy_binding_read
  on public.workspace_policy_bindings;

create policy workspace_policy_binding_read
on public.workspace_policy_bindings
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

drop policy if exists workspace_policy_binding_write
  on public.workspace_policy_bindings;

create policy workspace_policy_binding_write
on public.workspace_policy_bindings
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

drop policy if exists workspace_policy_binding_update
  on public.workspace_policy_bindings;

create policy workspace_policy_binding_update
on public.workspace_policy_bindings
for update
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
)
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin','developer']
      ::public.workspace_role[]
  )
);

drop policy if exists workspace_policy_binding_delete
  on public.workspace_policy_bindings;

create policy workspace_policy_binding_delete
on public.workspace_policy_bindings
for delete
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin']
      ::public.workspace_role[]
  )
);

revoke all on public.policies from anon;
revoke all on public.policy_versions from anon;
revoke all on public.workspace_policy_bindings from anon;

grant select, insert, update, delete
on public.policies
to authenticated;

grant select, insert, update
on public.policy_versions
to authenticated;

grant select, insert, update, delete
on public.workspace_policy_bindings
to authenticated;

-- ============================================================
-- 3.0-06 HARDENING
-- Policy versions are immutable after creation.
-- Publication metadata may be written once, but the policy
-- document / identity / version number cannot be altered.
-- ============================================================

create or replace function public.protect_policy_version_immutability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if OLD.policy_id <> NEW.policy_id then
    raise exception
      'policy_versions.policy_id is immutable';
  end if;

  if OLD.workspace_id <> NEW.workspace_id then
    raise exception
      'policy_versions.workspace_id is immutable';
  end if;

  if OLD.version_number <> NEW.version_number then
    raise exception
      'policy_versions.version_number is immutable';
  end if;

  if OLD.document <> NEW.document then
    raise exception
      'policy_versions.document is immutable';
  end if;

  if OLD.validation_state <> NEW.validation_state
     and OLD.published_at is not null then
    raise exception
      'published policy version validation cannot be changed';
  end if;

  if OLD.validation_errors <> NEW.validation_errors
     and OLD.published_at is not null then
    raise exception
      'published policy version validation errors cannot be changed';
  end if;

  if OLD.immutable is distinct from NEW.immutable then
    raise exception
      'policy_versions.immutable is immutable';
  end if;

  if OLD.published_at is not null then
    if NEW.published_at is distinct from OLD.published_at then
      raise exception
        'published_at cannot be changed after publication';
    end if;

    if NEW.published_by is distinct from OLD.published_by then
      raise exception
        'published_by cannot be changed after publication';
    end if;
  else
    if NEW.published_at is not null
       and NEW.published_by is null then
      raise exception
        'published_by is required when publishing a policy version';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists policy_version_immutability
on public.policy_versions;

create trigger policy_version_immutability
before update
on public.policy_versions
for each row
execute function public.protect_policy_version_immutability();

revoke delete on public.policy_versions from authenticated;
