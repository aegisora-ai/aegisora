-- AEGISORA 3.0
-- Migration 020
-- Harden enterprise usage ledger ingestion.
--
-- Security intent:
--   * authenticated clients must NOT be able to INSERT usage events
--   * authenticated clients remain read-only for tenant-scoped usage
--   * service_role remains the trusted server-side ingestion path
--   * UPDATE / DELETE remain prohibited
--
-- This migration intentionally does not create a client-side ingestion path.

drop policy if exists enterprise_usage_ledger_insert_authenticated
  on public.enterprise_usage_ledger;

drop policy if exists enterprise_usage_ledger_no_client_insert
  on public.enterprise_usage_ledger;

create policy enterprise_usage_ledger_no_client_insert
  on public.enterprise_usage_ledger
  as restrictive
  for insert
  to authenticated
  with check (false);

revoke insert
  on public.enterprise_usage_ledger
  from anon, authenticated;

revoke update, delete
  on public.enterprise_usage_ledger
  from anon, authenticated;

grant select
  on public.enterprise_usage_ledger
  to authenticated;

comment on table public.enterprise_usage_ledger is
  'Append-only enterprise usage ledger. Client INSERT/UPDATE/DELETE prohibited; trusted server-side service_role ingestion only.';