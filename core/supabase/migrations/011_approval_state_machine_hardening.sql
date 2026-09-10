-- ============================================================
-- AEGISORA 3.0
-- 011 — Enterprise Approval State Machine Hardening
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_approval_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending'
     AND NEW.status IN ('approved', 'rejected', 'expired') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'approved'
     AND NEW.status = 'consumed' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'Invalid approval status transition: % -> %',
    OLD.status,
    NEW.status;

END;
$$;

DROP TRIGGER IF EXISTS approval_status_transition_guard
  ON public.approval_requests;

CREATE TRIGGER approval_status_transition_guard
BEFORE UPDATE OF status
ON public.approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_approval_status_transition();

COMMENT ON FUNCTION public.validate_approval_status_transition()
IS
'Enterprise approval lifecycle guard. Valid transitions:
pending -> approved/rejected/expired
approved -> consumed.
All other status transitions are rejected.';
