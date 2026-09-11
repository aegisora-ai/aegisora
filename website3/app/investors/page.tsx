import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  FileText,
  GitBranch,
  LockKeyhole,
  Network,
  Presentation,
  ShieldCheck,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Investor Room — Aegisora",
  description:
    "Investor-ready overview of Aegisora, autonomous AI runtime security infrastructure.",
};

const roomItems = [
  {
    title: "Pitch deck",
    text: "12-slide investor narrative: problem, architecture, product, market, timing, traction and round.",
    icon: Presentation,
    status: "Prepared structure",
  },
  {
    title: "One-pager",
    text: "One-screen company overview for fast partner forwarding and first meetings.",
    icon: FileText,
    status: "Prepared structure",
  },
  {
    title: "Live demo",
    text: "Dangerous action → intercept → risk → block. Ambiguous action → escalate → human review.",
    icon: ShieldCheck,
    status: "Live on website",
  },
  {
    title: "Architecture",
    text: "Runtime Gateway, policy enforcement, decision engine, enforcement gate and evidence.",
    icon: Network,
    status: "Core narrative",
  },
  {
    title: "Open-source proof",
    text: "Repository, releases, contributors, PRs, integrations and runtime evidence.",
    icon: GitBranch,
    status: "Connect verified data",
  },
  {
    title: "Security documentation",
    text: "Security model, evidence model, execution boundaries and enterprise controls.",
    icon: LockKeyhole,
    status: "Build-out",
  },
  {
    title: "Pilot pipeline",
    text: "Design partners, pilot companies, integrations and usage evidence.",
    icon: Users,
    status: "Connect verified data",
  },
  {
    title: "Financial model",
    text: "Runway, hiring plan, infrastructure costs and pre-seed deployment plan.",
    icon: Database,
    status: "Build-out",
  },
];

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <section className="border-b border-white/[.06] py-32 md:py-44">
        <div className="aegisora-container">
          <div className="text-[9px] uppercase tracking-[.25em] text-[#43aaff]">
            Aegisora investor room
          </div>

          <h1 className="mt-7 max-w-5xl text-[clamp(4rem,8vw,8rem)] font-medium leading-[.86] tracking-[-.075em]">
            Runtime security
            <span className="block text-white/38">
              for autonomous AI.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-7 text-white/42 md:text-lg">
            The proof package for investors evaluating Aegisora as the
            execution control layer for governed autonomous AI.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/#demo"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[11px] font-semibold text-black"
            >
              Run the demo
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-full border border-white/10 px-6 text-[11px] text-white/65"
            >
              Back to company
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="aegisora-container">
          <div className="mb-10">
            <div className="text-[9px] uppercase tracking-[.25em] text-[#43aaff]">
              Evidence room
            </div>

            <h2 className="mt-4 text-4xl font-medium tracking-[-.05em] md:text-6xl">
              Everything an investor asks for.
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {roomItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[22px] border border-white/[.075] bg-[#080c12] p-6 md:p-7"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[.08] text-[#43aaff]">
                      <Icon size={17} />
                    </div>

                    <span className="rounded-full border border-white/[.07] px-3 py-1.5 text-[8px] uppercase tracking-[.15em] text-white/30">
                      {item.status}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-medium">{item.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/38">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[.06] py-20 md:py-28">
        <div className="aegisora-container grid gap-10 md:grid-cols-2">
          <div>
            <div className="text-[9px] uppercase tracking-[.25em] text-[#43aaff]">
              Fundraise
            </div>

            <div className="mt-5 text-7xl font-medium tracking-[-.075em] md:text-8xl">
              $1.5M
            </div>

            <div className="mt-2 text-lg text-white/40">Pre-Seed</div>
          </div>

          <div className="flex flex-col justify-end">
            <p className="max-w-xl text-sm leading-7 text-white/42">
              Capital is intended to turn the open-source runtime layer into
              enterprise infrastructure: product control plane, integrations,
              security, design partners and distribution.
            </p>

            <Link
              href="/contact/sales"
              className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-semibold text-black"
            >
              Start an investor conversation
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}


