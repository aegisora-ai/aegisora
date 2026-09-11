export const metadata = {
  title: "Platform — Aegisora",
  description: "One control plane for autonomous AI.",
};

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="aegisora-container px-6 py-40">
        <p className="text-xs uppercase tracking-[0.25em] text-[#0878ff]">
          The Platform
        </p>

        <h1 className="mt-6 max-w-5xl text-6xl font-medium leading-[0.95] tracking-[-0.055em] md:text-8xl">
          One control plane
          <span className="block text-white/45">
            for autonomous AI.
          </span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-white/50">
          Secure execution, policy enforcement, decision intelligence and
          auditable evidence in one platform.
        </p>
      </div>
    </main>
  );
}
