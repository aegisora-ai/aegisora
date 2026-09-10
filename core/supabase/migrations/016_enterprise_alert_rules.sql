-- ============================================================
-- 016 — Enterprise Alert Rules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_alert_rules (

  rule_id TEXT PRIMARY KEY,

  workspace_id UUID NOT NULL
    REFERENCES public.workspaces(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT NOT NULL,

  enabled BOOLEAN NOT NULL DEFAULT TRUE,

  source TEXT NOT NULL
    CHECK (
      source IN (
        'policy',
        'risk',
        'decision',
        'execution',
        'approval',
        'evidence',
        'audit',
        'runtime',
        'incident',
        'manual'
      )
    ),

  severity TEXT NOT NULL
    CHECK (
      severity IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
      )
    ),

  min_risk_score INTEGER
    CHECK (
      min_risk_score IS NULL
      OR (
        min_risk_score >= 0
        AND min_risk_score <= 100
      )
    ),

  required_decision TEXT
    CHECK (
      required_decision IS NULL
      OR required_decision IN (
        'ALLOW',
        'BLOCK',
        'ESCALATE'
      )
    ),

  dedupe_window_ms BIGINT NOT NULL DEFAULT 300000
    CHECK (
      dedupe_window_ms >= 0
    ),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc', now()),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc', now()),

  metadata JSONB NOT NULL
    DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS
  enterprise_alert_rules_workspace_idx
ON public.enterprise_alert_rules (
  workspace_id
);

CREATE INDEX IF NOT EXISTS
  enterprise_alert_rules_enabled_idx
ON public.enterprise_alert_rules (
  workspace_id,
  enabled
);

ALTER TABLE public.enterprise_alert_rules
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.enterprise_alert_rules
  FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  enterprise_alert_rules_select_workspace
ON public.enterprise_alert_rules;

CREATE POLICY
  enterprise_alert_rules_select_workspace
ON public.enterprise_alert_rules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_alert_rules.workspace_id
      AND wm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS
  enterprise_alert_rules_insert_workspace
ON public.enterprise_alert_rules;

CREATE POLICY
  enterprise_alert_rules_insert_workspace
ON public.enterprise_alert_rules
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id =
      enterprise_alert_rules.workspace_id
      AND wm.user_id = auth.uid()
  )
);

COMMENT ON TABLE public.enterprise_alert_rules IS
  'Tenant-scoped enterprise alert rules for governance events.';
