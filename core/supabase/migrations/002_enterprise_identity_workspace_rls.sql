-- Aegisora 3.0
-- Enterprise identity / workspace / membership foundation.
--
-- Security invariants:
-- 1. Every workspace belongs to exactly one tenant boundary.
-- 2. Membership is the authoritative workspace authorization relationship.
-- 3. Workspace-owned records must be protected by RLS.
-- 4. Clients never receive cross-workspace rows through normal authenticated access.
-- 5. Service-role operations are backend-only and must not be exposed to browsers.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n
      on n.oid = t.typnamespace
    where t.typname = 'workspace_role'
      and n.nspname = 'public'
  ) then
    create type public.workspace_role as enum (
      'owner',
      'admin',
      'developer',
      'analyst',
      'auditor',
      'viewer'
    );
  end if;
end
$$;

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members(user_id);

create index if not exists workspace_members_workspace_id_idx
  on public.workspace_members(workspace_id);

create or replace function public.bootstrap_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    active
  )
  values (
    new.id,
    new.created_by,
    'owner',
    true
  )
  on conflict (workspace_id, user_id)
  do update set
    role = 'owner',
    active = true,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

revoke all on function public.bootstrap_workspace_owner() from public;

create trigger workspace_owner_bootstrap
after insert on public.workspaces
for each row
execute function public.bootstrap_workspace_owner();
create or replace function public.is_workspace_member(
  requested_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = requested_workspace_id
      and wm.user_id = auth.uid()
      and wm.active = true
  );
$$;

create or replace function public.has_workspace_role(
  requested_workspace_id uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = requested_workspace_id
      and wm.user_id = auth.uid()
      and wm.active = true
      and wm.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.has_workspace_role(uuid, public.workspace_role[]) from public;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, public.workspace_role[]) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists workspace_select_members on public.workspaces;
create policy workspace_select_members
on public.workspaces
for select
to authenticated
using (
  public.is_workspace_member(id)
);

drop policy if exists workspace_insert_authenticated on public.workspaces;
create policy workspace_insert_authenticated
on public.workspaces
for insert
to authenticated
with check (
  created_by = auth.uid()
);

drop policy if exists workspace_update_admins on public.workspaces;
create policy workspace_update_admins
on public.workspaces
for update
to authenticated
using (
  public.has_workspace_role(
    id,
    array['owner','admin']::public.workspace_role[]
  )
)
with check (
  public.has_workspace_role(
    id,
    array['owner','admin']::public.workspace_role[]
  )
);

drop policy if exists workspace_delete_owner on public.workspaces;
create policy workspace_delete_owner
on public.workspaces
for delete
to authenticated
using (
  public.has_workspace_role(
    id,
    array['owner']::public.workspace_role[]
  )
);

drop policy if exists workspace_member_select_self_or_admin on public.workspace_members;
create policy workspace_member_select_self_or_admin
on public.workspace_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_workspace_role(
    workspace_id,
    array['owner','admin','auditor']::public.workspace_role[]
  )
);

drop policy if exists workspace_member_insert_admin on public.workspace_members;
create policy workspace_member_insert_admin
on public.workspace_members
for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin']::public.workspace_role[]
  )
);

drop policy if exists workspace_member_update_admin on public.workspace_members;
create policy workspace_member_update_admin
on public.workspace_members
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

drop policy if exists workspace_member_delete_admin on public.workspace_members;
create policy workspace_member_delete_admin
on public.workspace_members
for delete
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner','admin']::public.workspace_role[]
  )
);

-- Prevent ordinary clients from directly changing ownership creation semantics.
revoke all on public.workspaces from anon;
revoke all on public.workspace_members from anon;

grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
