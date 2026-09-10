-- ============================================================
-- AEGISORA 3.0
-- 021 - Production Schema Reconciliation
-- ============================================================

begin;

-- ============================================================
-- 1. WORKSPACES
-- ============================================================

alter table public.workspaces
  add column if not exists created_by uuid;

alter table public.workspaces
  add column if not exists updated_at timestamptz;

-- Existing production workspace has exactly one OWNER membership.
-- Backfill created_by from that authoritative membership.
update public.workspaces w
set created_by = wm.user_id
from public.workspace_members wm
where wm.workspace_id = w.id
  and wm.role = 'OWNER'
  and w.created_by is null;

-- Fail closed if any existing workspace still has no owner.
do $$
begin
  if exists (
    select 1
    from public.workspaces
    where created_by is null
  ) then
    raise exception
      '021 reconciliation aborted: one or more workspaces have no OWNER-derived created_by';
  end if;
end
$$;

alter table public.workspaces
  alter column created_by set not null;

alter table public.workspaces
  alter column updated_at
  set default timezone('utc', now());

alter table public.workspaces
  alter column updated_at set not null;

-- FK to auth.users.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workspaces_created_by_fkey'
      and conrelid = 'public.workspaces'::regclass
  ) then
    alter table public.workspaces
      add constraint workspaces_created_by_fkey
      foreign key (created_by)
      references auth.users(id)
      on delete restrict;
  end if;
end
$$;

-- ============================================================
-- 2. WORKSPACE MEMBERS
-- ============================================================

alter table public.workspace_members
  add column if not exists id uuid;

alter table public.workspace_members
  add column if not exists active boolean;

alter table public.workspace_members
  add column if not exists updated_at timestamptz;

update public.workspace_members
set
  id = coalesce(id, gen_random_uuid()),
  active = coalesce(active, true),
  updated_at = coalesce(updated_at, timezone('utc', now()))
where
  id is null
   or active is null
   or updated_at is null;

alter table public.workspace_members
  alter column id set default gen_random_uuid();

alter table public.workspace_members
  alter column active set default true;

alter table public.workspace_members
  alter column updated_at
  set default timezone('utc', now());

alter table public.workspace_members
  alter column id set not null;

alter table public.workspace_members
  alter column active set not null;

alter table public.workspace_members
  alter column updated_at set not null;

create unique index if not exists workspace_members_id_key
  on public.workspace_members(id);

create index if not exists idx_workspace_members_user
  on public.workspace_members(user_id);

create index if not exists idx_workspace_members_workspace_id
  on public.workspace_members(workspace_id);

-- ============================================================
-- 3. POLICIES COMPATIBILITY
-- ============================================================

alter table public.policies
  add column if not exists policy_key text;

alter table public.policies
  add column if not exists description text;

alter table public.policies
  add column if not exists state text;

alter table public.policies
  add column if not exists current_version_id uuid;

update public.policies
set
  policy_key = coalesce(policy_key, id::text),
  state = coalesce(
    state,
    case
      when enabled then 'published'
      else 'archived'
    end
  )
where policy_key is null
   or state is null;

alter table public.policies
  alter column policy_key set not null;

alter table public.policies
  alter column state set not null;

alter table public.policies
  add constraint policies_state_check
  check (state in ('draft', 'published', 'archived'));

create unique index if not exists uq_policies_workspace_policy_key
  on public.policies(workspace_id, policy_key);

create index if not exists idx_policies_workspace
  on public.policies(workspace_id);

-- ============================================================
-- 4. POLICY VERSIONS COMPATIBILITY
-- ============================================================

alter table public.policy_versions
  add column if not exists version_number integer;

alter table public.policy_versions
  add column if not exists document jsonb;

alter table public.policy_versions
  add column if not exists validation_state text;

alter table public.policy_versions
  add column if not exists validation_errors jsonb;

alter table public.policy_versions
  add column if not exists immutable boolean;

alter table public.policy_versions
  add column if not exists published_at timestamptz;

alter table public.policy_versions
  add column if not exists published_by uuid;

update public.policy_versions
set
  version_number = coalesce(version_number, version),
  document = coalesce(
    document,
    jsonb_build_object(
      'conditions', conditions,
      'metadata', metadata
    )
  ),
  validation_state = coalesce(
    validation_state,
    case
      when enabled then 'valid'
      else 'not_validated'
    end
  ),
  validation_errors = coalesce(validation_errors, '[]'::jsonb),
  immutable = coalesce(immutable, true)
where version_number is null
   or document is null
   or validation_state is null
   or validation_errors is null
   or immutable is null;

alter table public.policy_versions
  alter column version_number set not null;

alter table public.policy_versions
  alter column document set not null;

alter table public.policy_versions
  alter column validation_state set not null;

alter table public.policy_versions
  alter column validation_errors set not null;

alter table public.policy_versions
  alter column immutable set not null;

alter table public.policy_versions
  add constraint policy_versions_validation_state_check
  check (
    validation_state in (
      'not_validated',
      'valid',
      'invalid'
    )
  );

alter table public.policy_versions
  add constraint policy_versions_version_number_check
  check (version_number > 0);

create unique index if not exists uq_policy_versions_policy_version_number
  on public.policy_versions(policy_id, version_number);

create index if not exists idx_policy_versions_policy_version
  on public.policy_versions(policy_id, version_number desc);

-- ============================================================
-- 5. WORKSPACE POLICY BINDINGS
-- ============================================================
--
-- Canonical owner:
--   012_production_core_reconciliation.sql
--
-- Intentionally not created here.
-- This migration only reconciles the legacy workspace/policy
-- contract that 012 depends on.
-- ============================================================
-- ============================================================
-- 6. OPTIONAL POLICY CURRENT VERSION FK
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'policies_current_version_fk'
      and conrelid = 'public.policies'::regclass
  ) then
    alter table public.policies
      add constraint policies_current_version_fk
      foreign key (current_version_id)
      references public.policy_versions(id)
      deferrable initially deferred;
  end if;
end
$$;

-- ============================================================
-- 7. RLS
-- ============================================================

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.policies enable row level security;
alter table public.policy_versions enable row level security;
alter table public.workspace_policy_bindings enable row level security;

-- ============================================================
-- 8. ANON HARDENING
-- ============================================================

revoke all on public.workspaces from anon;
revoke all on public.workspace_members from anon;
revoke all on public.policies from anon;
revoke all on public.policy_versions from anon;
revoke all on public.workspace_policy_bindings from anon;

commit;