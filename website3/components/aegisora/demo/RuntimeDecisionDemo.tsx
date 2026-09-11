"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Database,
  FileCheck2,
  LockKeyhole,
  ShieldAlert,
  UserRoundCheck,
  X,
  Zap,
} from "lucide-react";

type DemoState =
  | "idle"
  | "intercepting"
  | "analyzing"
  | "blocked"
  | "escalated"
  | "approved"
  | "rejected";

const blockedTrace = {
  agent: "agent_research_042",
  action: "database.execute",
  resource: "production.customer_records",
  operation: "DELETE FROM customers WHERE region = 'EU'",
  policy: "prod-data-destructive-actions",
  risk: "CRITICAL",
  decision: "BLOCK",
};

const escalatedTrace = {
  agent: "agent_ops_017",
  action: "api.request",
  resource: "payments.refund",
  operation: "POST /v1/refunds",
  policy: "financial-actions-require-review",
  risk: "HIGH",
  decision: "ESCALATE",
};

export function RuntimeDecisionDemo() {
  const [state, setState] = useState<DemoState>("idle");
  const [mode, setMode] = useState<"block" | "escalate">("block");

  const trace = mode === "block" ? blockedTrace : escalatedTrace;

  async function runDemo(nextMode: "block" | "escalate") {
    setMode(nextMode);
    setState("intercepting");

    await wait(700);
    setState("analyzing");

    await wait(850);
    setState(nextMode === "block" ? "blocked" : "escalated");
  }

  async function review(approved: boolean) {
    setState(approved ? "approved" : "rejected");
  }

  const isTerminal =
    state === "blocked" ||
    state === "escalated" ||
    state === "approved" ||
    state === "rejected";

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[.09] bg-[#070b11] shadow-[0_30px_100px_rgba(0,0,0,.42)]">
      <div className="border-b border-white/[.07] px-5 py-4 md:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1688ff] shadow-[0_0_12px_rgba(22,136,255,.8)]" />
              <span className="text-[9px] font-semibold uppercase tracking-[.24em] text-[#54aaff]">
                Runtime Decision Demo
              </span>
            </div>

            <h3 className="mt-3 text-xl font-medium tracking-[-.035em] text-white md:text-2xl">
              See Aegisora stop an action before it executes.
            </h3>
          </div>

          <div className="text-[9px] uppercase tracking-[.2em] text-white/25">
            Interactive simulation
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_.95fr]">
        <div className="border-b border-white/[.07] p-5 md:p-7 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runDemo("block")}
              className={`rounded-full border px-4 py-2 text-[10px] font-semibold transition ${
                mode === "block"
                  ? "border-[#0878ff]/50 bg-[#0878ff]/10 text-white"
                  : "border-white/10 text-white/45 hover:text-white"
              }`}
            >
              Dangerous action
            </button>

            <button
              onClick={() => runDemo("escalate")}
              className={`rounded-full border px-4 py-2 text-[10px] font-semibold transition ${
                mode === "escalate"
                  ? "border-[#0878ff]/50 bg-[#0878ff]/10 text-white"
                  : "border-white/10 text-white/45 hover:text-white"
              }`}
            >
              Ambiguous action
            </button>
          </div>

          <div className="mt-6 space-y-2">
            <Step
              icon={<Zap size={13} />}
              label="Agent requests action"
              active={state !== "idle"}
              complete={
                state === "analyzing" ||
                isTerminal
              }
            />

            <Step
              icon={<ShieldAlert size={13} />}
              label="Aegisora intercepts"
              active={
                state === "intercepting" ||
                state === "analyzing" ||
                isTerminal
              }
              complete={state === "analyzing" || isTerminal}
            />

            <Step
              icon={<LockKeyhole size={13} />}
              label="Risk + policy evaluation"
              active={state === "analyzing" || isTerminal}
              complete={isTerminal}
            />

            <Step
              icon={
                state === "blocked" || state === "rejected" ? (
                  <X size={13} />
                ) : state === "approved" ? (
                  <Check size={13} />
                ) : (
                  <UserRoundCheck size={13} />
                )
              }
              label={
                state === "blocked"
                  ? "BLOCK"
                  : state === "escalated"
                    ? "ESCALATE → HUMAN REVIEW"
                    : state === "approved"
                      ? "APPROVED"
                      : state === "rejected"
                        ? "REJECTED"
                        : "Decision"
              }
              active={isTerminal}
              terminal
            />
          </div>

          <div className="mt-7 rounded-2xl border border-white/[.07] bg-black/20 p-4">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[.18em] text-white/30">
              <Database size={12} />
              Requested execution
            </div>

            <pre className="mt-4 overflow-x-auto text-[11px] leading-6 text-white/62">
{JSON.stringify(
  {
    agent: trace.agent,
    action: trace.action,
    resource: trace.resource,
    operation: trace.operation,
  },
  null,
  2
)}
            </pre>
          </div>
        </div>

        <div className="p-5 md:p-7">
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex min-h-[330px] flex-col justify-center"
              >
                <div className="text-[9px] uppercase tracking-[.2em] text-[#1688ff]">
                  Start the demonstration
                </div>

                <h4 className="mt-4 max-w-sm text-3xl font-medium tracking-[-.05em]">
                  Security belongs at the execution boundary.
                </h4>

                <p className="mt-4 max-w-sm text-sm leading-6 text-white/40">
                  Trigger a dangerous action or an ambiguous action and watch
                  the control flow.
                </p>

                <button
                  onClick={() => runDemo("block")}
                  className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-semibold text-black"
                >
                  Run live example
                  <ChevronRight size={13} />
                </button>
              </motion.div>
            )}

            {(state === "intercepting" || state === "analyzing") && (
              <motion.div
                key="working"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-[330px] flex-col justify-center"
              >
                <div className="relative flex h-28 items-center justify-center">
                  <div className="absolute h-24 w-24 rounded-full bg-[#0878ff]/10 blur-2xl" />
                  <div className="h-20 w-20 animate-pulse rounded-full border border-[#1688ff]/30 bg-[#08111d] shadow-[0_0_50px_rgba(8,120,255,.15)]" />
                  <div className="absolute h-10 w-10 rounded-full border border-[#43d8ff]/30" />
                </div>

                <div className="mt-8 text-center">
                  <div className="text-[9px] uppercase tracking-[.24em] text-[#43b5ff]">
                    {state === "intercepting"
                      ? "Intercepting execution"
                      : "Evaluating policy + risk"}
                  </div>

                  <p className="mt-3 text-sm text-white/45">
                    The action has not been executed.
                  </p>
                </div>
              </motion.div>
            )}

            {state === "blocked" && (
              <DecisionCard
                key="blocked"
                title="Action blocked."
                subtitle="Aegisora prevented execution before it reached the target system."
                tone="blocked"
                trace={trace}
              />
            )}

            {state === "escalated" && (
              <motion.div
                key="escalated"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-[330px] flex-col justify-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#eab308]/20 bg-[#eab308]/[.06] text-[#eab308]">
                  <UserRoundCheck size={20} />
                </div>

                <h4 className="mt-5 text-3xl font-medium tracking-[-.05em]">
                  Human review required.
                </h4>

                <p className="mt-3 max-w-md text-sm leading-6 text-white/42">
                  The action is ambiguous under the current policy. Aegisora
                  paused execution and created an approval request.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => review(false)}
                    className="rounded-xl border border-white/[.1] py-3 text-[11px] font-semibold text-white/70 transition hover:bg-white/[.03]"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => review(true)}
                    className="rounded-xl bg-white py-3 text-[11px] font-semibold text-black"
                  >
                    Approve
                  </button>
                </div>
              </motion.div>
            )}

            {(state === "approved" || state === "rejected") && (
              <DecisionCard
                key={state}
                title={state === "approved" ? "Execution approved." : "Execution rejected."}
                subtitle={
                  state === "approved"
                    ? "Human authorization resolved the pending action."
                    : "Human review denied the pending action."
                }
                tone={state === "approved" ? "approved" : "blocked"}
                trace={{
                  ...trace,
                  decision: state === "approved" ? "ALLOW" : "BLOCK",
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Step({
  icon,
  label,
  active,
  complete,
  terminal,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  complete?: boolean;
  terminal?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
        active
          ? "border-white/[.10] bg-white/[.025]"
          : "border-white/[.05] bg-transparent opacity-40"
      }`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
          terminal && complete
            ? "border-[#0878ff]/30 bg-[#0878ff]/10 text-[#58b3ff]"
            : "border-white/[.08] text-white/50"
        }`}
      >
        {icon}
      </div>

      <div className="flex-1 text-[11px] text-white/65">{label}</div>

      {complete && (
        <div className="text-[8px] uppercase tracking-[.15em] text-[#43b5ff]">
          resolved
        </div>
      )}
    </div>
  );
}

function DecisionCard({
  title,
  subtitle,
  tone,
  trace,
}: {
  title: string;
  subtitle: string;
  tone: "blocked" | "approved";
  trace: Record<string, string>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[330px]"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            tone === "blocked"
              ? "border border-red-500/20 bg-red-500/[.06] text-red-400"
              : "border border-emerald-400/20 bg-emerald-400/[.06] text-emerald-400"
          }`}
        >
          {tone === "blocked" ? <X size={21} /> : <Check size={21} />}
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-[.2em] text-white/30">
            Decision
          </div>
          <h4 className="mt-1 text-2xl font-medium tracking-[-.04em]">
            {title}
          </h4>
        </div>
      </div>

      <p className="mt-5 max-w-md text-sm leading-6 text-white/42">
        {subtitle}
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {Object.entries(trace).map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-white/[.065] bg-black/20 p-3"
          >
            <div className="text-[8px] uppercase tracking-[.17em] text-white/25">
              {key}
            </div>
            <div className="mt-2 truncate text-[11px] text-white/65">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-[9px] text-white/30">
        <FileCheck2 size={12} />
        Decision evidence generated
      </div>
    </motion.div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
