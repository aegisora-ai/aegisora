"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ShieldCheck,
  ArrowUp,
  Loader2,
  Terminal,
  CheckCircle2,
} from "lucide-react";

// GPU-accelerated Aegisora Spark icon
const AegisoraSpark = ({
  className = "w-5 h-5 text-blue-400",
  isThinking = false,
}) => {
  return (
    <motion.div
      animate={
        isThinking
          ? { rotate: [0, 180, 360], scale: [1, 1.2, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={
        isThinking
          ? { duration: 2, ease: "linear", repeat: Infinity }
          : { duration: 0.3 }
      }
      className={`flex-shrink-0 will-change-transform ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M11.25 1.5L12.75 1.5L12.75 9L19.5 4.5L20.25 5.5L14.25 10.5L22.5 11.25L22.5 12.75L14.25 13.5L20.25 18.5L19.5 19.5L12.75 15L12.75 22.5L11.25 22.5L11.25 15L4.5 19.5L3.75 18.5L9.75 13.5L1.5 12.75L1.5 11.25L9.75 10.5L3.75 5.5L4.5 4.5L11.25 9L11.25 1.5Z" />
      </svg>
    </motion.div>
  );
};

const FLOW_SCENARIOS = [
  {
    command:
      "Deploy zero-trust policy to Finance Swarm. Enforce strict fail-closed enforcement.",
    logs: [
      "Initializing sidecar proxy in secure VPC...",
      "Target identified: Finance Swarm (4 nodes)",
      "Applying strict fail-closed runtime policy...",
      "Neural firewall active: payload egress policy enforced.",
    ],
    response:
      "Policy deployed successfully. 4 active Finance Agents restricted under strict fail-closed enforcement.",
  },
  {
    command: "Isolate unauthorized LLM tool calls in Customer Support cluster.",
    logs: [
      "Scanning active agent tool hooks...",
      "Anomaly detected: Unsandboxed python execution",
      "Terminating unauthorized external route...",
      "Enforcing perimeter security...",
    ],
    response:
      "Cluster secured. 2 shadow model requests intercepted and neutralized locally.",
  },
  {
    command: "Generate ISO/SOC2 immutable audit log for European operations.",
    logs: [
      "Gathering runtime decision timelines...",
      "Compiling zero-trust proof vectors...",
      "Encrypting audit trail with local HSM...",
      "Compliance bundle ready.",
    ],
    response:
      "SOC 2 & GDPR compliance report successfully generated and archived within perimeter.",
  },
];

export default function ChatMockup() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, margin: "-100px" });

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentScenario = FLOW_SCENARIOS[scenarioIndex];

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isAutoPlaying && isInView) {
      if (step === 0) {
        timer = setTimeout(() => setStep(1), 1200);
      } else if (step === 1) {
        timer = setTimeout(() => setStep(2), 600);
      } else if (step === 3) {
        timer = setTimeout(() => {
          setScenarioIndex((prev) => (prev + 1) % FLOW_SCENARIOS.length);
          setStep(0);
          queueMicrotask(() => setVisibleLogs([]));
        }, 3500);
      }
    }

    return () => clearTimeout(timer);
  }, [step, isAutoPlaying, isInView]);

  useEffect(() => {
    if (step === 2 && isInView) {
      let currentIndex = 0;
      queueMicrotask(() => setVisibleLogs([]));
      const interval = setInterval(() => {
        if (currentIndex < currentScenario.logs.length) {
          setVisibleLogs((prev) => [
            ...prev,
            currentScenario.logs[currentIndex],
          ]);
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => setStep(3), 400);
        }
      }, 300);

      return () => clearInterval(interval);
    }
  }, [step, currentScenario, isInView]);

  const handleManualTrigger = () => {
    if (step === 1 || step === 2) return;
    setIsAutoPlaying(false);
    setStep(1);
    setTimeout(() => setStep(2), 400);
    setTimeout(() => setIsAutoPlaying(true), 5500);
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full py-32 flex flex-col items-center justify-center px-4 sm:px-6 font-sans overflo w-hidden bg-transparent z-10 text-white"
    >
      <div className="relative z-10 max-w-4xl w-full mx-auto flex flex-col items-center text-center">
        {/* Top badge */}
        <div className="bg-zinc-900/90 backdrop-blur-2xl rounded-full px-5 py-2 flex items-center gap-2.5 mb-8 border b order-zinc-800 shado w-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border b order-blue-500/20">
            <AegisoraSpark
              className="w-3.5 h-3.5 text-blue-400"
              isThinking={isInView && isAutoPlaying}
            />
          </div>
          <span className="text-[13px] font-mono text-zinc-300 font-medium">
            Swarm Command Center
          </span>
        </div>

        {/* Main heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold font-serif text-white leading-[1.1] tracking-tight mb-6">
          Govern AI swarms at the speed of thought.
        </h2>

        {/* Description */}
        <p className="text-zinc-400 font-mono text-sm sm:text-base max-w-2xl leading-relaxed mb-14">
          Aegisora intercepts unauthorized tool calls, enforces dynamic
          zero-trust policies with strict fail-closed runtime, and helps keep
          raw payloads within your perimeter.
        </p>

        {/* Chat mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl bg-zinc-950/90 backdrop-blur-3xl border b order-zinc-800 rounded-[28px] shado w-[0_25px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 text-left space-y-6 flex flex-col h-[520px] sm:h-[500px]"
        >
          {/* Chat header / status bar */}
          <div className="flex items-center justify-between b order-b b order-zinc-800 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border b order-zinc-800 flex items-center justify-center">
                <AegisoraSpark className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">
                  Aegisora Core Intelligence
                </h4>
                <p className="text-[11px] text-blue-400 font-mono">
                  Runtime Governance Active • Fail-Closed Enforced
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border b order-emerald-500/20 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secured (Local VPC)</span>
            </div>
          </div>

          {/* Conversation area */}
          <div
            className="flex-1 space-y-4 py-2 overflo w-y-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* System boot message */}
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-xl bg-zinc-900 border b order-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                <AegisoraSpark
                  className="w-3.5 h-3.5 text-blue-400"
                  isThinking={step === 2}
                />
              </div>
              <div className="max-w-[85%] bg-zinc-900/90 border b order-zinc-800 text-zinc-200 rounded-[20px] rounded-tl-sm p-4 text-sm leading-relaxed backdrop-blur-md">
                <p className="font-medium text-zinc-200">
                  Aegisora sidecar proxy is online. Raw payloads remain inside
                  your secure perimeter.
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step >= 1 && (
                <motion.div
                  key={`cmd-${scenarioIndex}`}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-end pt-2 will-change-transform"
                >
                  <div className="max-w-[85%] px-[18px] py-3 bg-blue-600 text-white rounded-[20px] rounded-tr-sm font-medium text-sm shado w-lg shado w-blue-600/20">
                    {currentScenario.command}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 items-start pt-2 will-change-transform"
                >
                  <div className="w-7 h-7 rounded-xl bg-transparent flex items-center justify-center flex-shrink-0 mt-1"></div>
                  <div
                    className="w-full max-w-[85%] bg-zinc-950 border b order-zinc-800 rounded-xl p-4 shado w-inner font-mono text-xs text-zinc-400"
                    role="log"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="animate-pulse">
                        Executing Protocol...
                      </span>
                    </div>
                    {visibleLogs.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-1 will-change-transform"
                      >
                        <span className="text-zinc-600 mr-2">{">"}</span> {log}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {step === 3 && (
                <motion.div
                  key={`res-${scenarioIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 items-start pt-2 will-change-transform"
                >
                  <div className="w-7 h-7 rounded-xl bg-zinc-900 border b order-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <AegisoraSpark className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="max-w-[85%] bg-zinc-900/90 border b order-zinc-800 text-zinc-200 rounded-[20px] rounded-tl-sm p-4 text-sm leading-relaxed space-y-2 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Policy enforced successfully.
                    </div>
                    <p className="text-xs font-mono text-zinc-400 pt-1">
                      {currentScenario.response}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom input bar */}
          <div className="pt-2 shrink-0 b order-t b order-zinc-800">
            <div className="bg-zinc-900/80 border b order-zinc-800 rounded-full px-4 py-2.5 flex items-center gap-3">
              <div className="flex-1 text-[13px] text-zinc-400 font-mono truncate">
                {step === 0
                  ? "Awaiting next autonomous cycle..."
                  : step === 3
                    ? "Cycling to next swarm intelligence..."
                    : "Processing runtime interception..."}
              </div>
              <button
                onClick={handleManualTrigger}
                disabled={step === 1 || step === 2}
                aria-label="Trigger manual scan"
                className={`w-8 h-8 rounded-full flex items-center justify-center shado w-md transition-colors outline-none shrink-0
                  ${step === 1 || step === 2 ? "bg-zinc-800 border b order-zinc-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 cursor-pointer"}
                `}
              >
                {step === 2 ? (
                  <Loader2 className="w-4 h-4 text-blue-300 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
