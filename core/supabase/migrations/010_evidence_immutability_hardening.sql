-- ============================================================
-- AEGISORA 3.0
-- 010 — Enterprise Evidence Immutability Hardening
-- ============================================================

-- Evidence is an append-only security ledger.
-- Client UPDATE access is removed permanently.
-- Existing DELETE revocation remains in force.

ALTER TABLE public.enterprise_evidence
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enterprise_evidence_update_workspace
  ON public.enterprise_evidence;

REVOKE UPDATE
  ON public.enterprise_evidence
  FROM authenticated;

REVOKE UPDATE
  ON public.enterprise_evidence
  FROM anon;

REVOKE DELETE
  ON public.enterprise_evidence
  FROM authenticated;

REVOKE DELETE
  ON public.enterprise_evidence
  FROM anon;

COMMENT ON TABLE public.enterprise_evidence IS
'Append-only enterprise evidence ledger. Existing evidence records cannot be updated or deleted by client roles.';
