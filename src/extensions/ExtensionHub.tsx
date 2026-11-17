import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Notice, PageHead } from "../ui/kit";
import { supabase } from "../lib/supabase";
import { apiCall, apiError } from "../lib/api";
import { useWorkspace } from "../lib/workspace";
import { CATALOG, KIND_META } from "./catalog";
import type { Decision, ExtensionItem, ExtensionKind } from "./types";
import "./extensions.css";

const DECISION_CLASS: Record<Decision, string> = {
  ALLOW: "ax-allow",
  ESCALATE: "ax-escalate",
  BLOCK: "ax-block",
};

type Note = { tone: "info" | "warn" | "bad"; text: string; mfa?: boolean };

const MFA_TEXT =
  "Installing presets changes your security rules, so it needs two-step verification. Turn on two-step verification and verify this session first.";

const policyName = (item: ExtensionItem, action: string) => item.name + " / " + action;

export function ExtensionHub({ kind }: { kind: ExtensionKind }) {
  const meta = KIND_META[kind];
  const navigate = useNavigate();
  const { current, canAdmin } = useWorkspace();
  const [query, setQuery] = useState("");
  const [policies, setPolicies] = useState<Map<string, string>>(new Map());
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);

  const load = useCallback(async () => {
    if (!current) return;
    const { data, error } = await supabase
      .from("policies")
      .select("id,name")
      .eq("workspace_id", current.workspaceId)
      .limit(1000);
    if (error) {
      setNote({ tone: "bad", text: "Could not load policies: " + error.message });
      return;
    }
    const rows = (data ?? []) as { id: string; name: string }[];
    setPolicies(new Map(rows.map((r) => [String(r.name), String(r.id)])));
  }, [current]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter(
      (item) =>
        item.kind === kind &&
        (q === "" ||
          `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(q)),
    );
  }, [kind, query]);

  const installedCount = (item: ExtensionItem) =>
    (item.rules ?? []).filter((r) => policies.has(policyName(item, r.action))).length;

  async function enable(item: ExtensionItem) {
    if (!current) return;
    setBusy(item.id);
    setNote(null);
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== "aal2") {
        setNote({ tone: "warn", text: MFA_TEXT, mfa: true });
        return;
      }
      let created = 0;
      for (const rule of item.rules ?? []) {
        const name = policyName(item, rule.action);
        if (policies.has(name)) continue;
        const res = await apiCall({
          method: "POST",
          path: "/api/v1/workspace/policies",
          body: {
            workspace_id: current.workspaceId,
            name,
            action_pattern: rule.action,
            resource_pattern: "*",
            decision: rule.decision,
            priority: 100,
          },
        });
        if (!res.ok) {
          const e = apiError(res);
          await load();
          if (e.code === "mfa_required") setNote({ tone: "warn", text: MFA_TEXT, mfa: true });
          else setNote({ tone: "bad", text: `Stopped after ${created} rule(s). ${e.message}` });
          return;
        }
        created++;
      }
      await load();
      setNote({
        tone: "info",
        text: created > 0 ? `${item.name} is active: ${created} rule(s) created.` : `${item.name} was already active.`,
      });
    } finally {
      setBusy(null);
    }
  }

  async function disable(item: ExtensionItem) {
    if (!current) return;
    const ids = (item.rules ?? [])
      .map((r) => policies.get(policyName(item, r.action)))
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return;
    if (!window.confirm(`Remove ${item.name}? Agents are no longer governed by these ${ids.length} rule(s).`)) return;
    setBusy(item.id);
    setNote(null);
    try {
      const { error } = await supabase
        .from("policies")
        .delete()
        .in("id", ids)
        .eq("workspace_id", current.workspaceId);
      if (error) {
        const rls = /row-level security/i.test(error.message);
        setNote(rls ? { tone: "warn", text: MFA_TEXT, mfa: true } : { tone: "bad", text: error.message });
        return;
      }
      await load();
      setNote({ tone: "info", text: `${item.name} removed.` });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ax-hub">
      <PageHead title={meta.title} subtitle={meta.subtitle} />

      {kind === "presets" && (
        <div className="ax-note">
          Enabling a preset creates real policies in your workspace. Anything no policy matches is
          decided by your workspace default. Review the result on the Policies page.
        </div>
      )}

      {note && (
        <div>
          <Notice tone={note.tone}>{note.text}</Notice>
          {note.mfa && (
            <div style={{ marginTop: 8 }}>
              <button type="button" className="ax-btn ax-btn-primary" onClick={() => navigate("/app/security")}>
                Open Security
              </button>
            </div>
          )}
        </div>
      )}

      <div className="ax-bar">
        <input
          className="ax-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${meta.title.toLowerCase()}...`}
        />
      </div>

      {items.length === 0 ? (
        <p className="ax-empty">{meta.empty}</p>
      ) : (
        <div className="ax-grid">
          {items.map((item) => {
            const isReady = item.status === "ready";
            const total = item.rules?.length ?? 0;
            const have = installedCount(item);
            const active = total > 0 && have === total;
            const partial = have > 0 && have < total;
            const working = busy === item.id;
            return (
              <article key={item.id} className="ax-card">
                <div className="ax-card-top">
                  <div>
                    <h2>{item.name}</h2>
                    <div className="ax-cat">{item.category}</div>
                  </div>
                  <span className={"ax-badge " + (isReady ? "ax-badge-ready" : "ax-badge-preview")}>
                    {isReady ? "Ready" : "Preview"}
                  </span>
                </div>

                <p className="ax-desc">{item.description}</p>

                {item.rules && (
                  <div className="ax-rules">
                    {item.rules.map((rule) => (
                      <span key={rule.action} className={"ax-rule " + DECISION_CLASS[rule.decision]}>
                        {rule.action} · {rule.decision}
                      </span>
                    ))}
                  </div>
                )}

                {item.setup && <p className="ax-setup">{item.setup}</p>}
                {partial && <p className="ax-setup">Partly installed: {have} of {total} rules exist.</p>}
                {kind === "skills" && isReady && <p className="ax-setup">Part of the Aegisora runtime.</p>}

                <div className="ax-foot">
                  {!isReady ? (
                    <button type="button" className="ax-btn" disabled>Coming soon</button>
                  ) : kind === "presets" ? (
                    active ? (
                      <button
                        type="button"
                        className="ax-btn ax-btn-on"
                        disabled={working || !canAdmin}
                        onClick={() => void disable(item)}
                      >
                        {working ? "Working..." : "Active · Remove"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ax-btn ax-btn-primary"
                        disabled={working || !canAdmin || !current}
                        title={canAdmin ? undefined : "Only owners and admins can install presets."}
                        onClick={() => void enable(item)}
                      >
                        {working ? "Working..." : partial ? "Finish install" : "Enable"}
                      </button>
                    )
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}